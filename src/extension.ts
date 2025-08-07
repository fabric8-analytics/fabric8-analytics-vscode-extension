'use strict';

import * as path from 'path';
import * as vscode from 'vscode';

import * as commands from './commands';
import { GlobalState, EXTENSION_QUALIFIED_ID, REDHAT_MAVEN_REPOSITORY, REDHAT_MAVEN_REPOSITORY_DOCUMENTATION_URL, REDHAT_CATALOG } from './constants';
import { generateRHDAReport } from './rhda';
import { globalConfig } from './config';
import { StatusMessages, PromptText } from './constants';
import { caStatusBarProvider } from './caStatusBarProvider';
import { CANotification, CANotificationData } from './caNotification';
import { DepOutputChannel } from './depOutputChannel';
import { record, startUp, TelemetryActions } from './redhatTelemetry';
import { applySettingNameMappings, buildLogErrorMessage } from './utils';
import { clearCodeActionsMap, getDiagnosticsCodeActions } from './codeActionHandler';
import { AnalysisMatcher } from './fileHandler';
import { EventEmitter } from 'node:events';
import { ListModelCardResponse, llmAnalysis } from './llmAnalysis';
import { LLMAnalysisReportPanel } from './llmAnalysisReportPanel';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import CliTable3 = require('cli-table3');
import { Language, Parser, Query } from 'web-tree-sitter';

export let outputChannelDep: DepOutputChannel;

export const notifications = new EventEmitter();

/**
 * Activates the extension upon launch.
 * @param context - The extension context.
 */
export async function activate(context: vscode.ExtensionContext) {
  outputChannelDep = new DepOutputChannel();
  outputChannelDep.info(`starting RHDA extension ${context.extension.packageJSON['version']}`);

  globalConfig.linkToSecretStorage(context);

  startUp(context);

  context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new class implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, ctx: vscode.CodeActionContext): vscode.ProviderResult<vscode.CodeAction[]> {
      return getDiagnosticsCodeActions(ctx.diagnostics, document.uri);
    }
  }()));

  const fileHandler = new AnalysisMatcher();
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => fileHandler.handle(doc, outputChannelDep)));
  // Anecdotaly, some extension(s) may cause did-open events for files that aren't actually open in the editor,
  // so this will trigger CA for files not actually open.
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
    const isVisible = vscode.window.visibleTextEditors.some(editor =>
      editor.document.uri.toString() === doc.uri.toString()
    );
    // The file was not opened by the user (e.g. extension used openTextDocument but not showTextDocument), ignore.
    if (!isVisible) {
      return;
    }
    fileHandler.handle(doc, outputChannelDep);
  }));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => clearCodeActionsMap(doc.uri)));
  // Iterate all open docs, as there is (in general) no did-open event for these.
  for (const doc of vscode.workspace.textDocuments) {
    fileHandler.handle(doc, outputChannelDep);
  }

  // show welcome message after first install or upgrade
  showUpdateNotification(context);

  const llmAnalysisDiagnosticsCollection = vscode.languages.createDiagnosticCollection('rhdaLLM');
  context.subscriptions.push(llmAnalysisDiagnosticsCollection);
  const modelsInDocs = new Map<vscode.Uri, Map<vscode.Range, ListModelCardResponse>>();

  context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*',
    new class implements vscode.CodeActionProvider {
      // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars
      provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        if (context.diagnostics.at(0)?.code?.toString() !== 'rhdallm') {
          return;
        }

        // document.getText(context.diagnostics[0].range)

        return [{
          title: 'Open LLM Evaluation Report',
          command: {
            command: commands.LLM_MODELS_ANALYSIS_REPORT,
            title: 'Show LLM Analysis Report',
            arguments: [document.getText(context.diagnostics[0].range), document.uri, context.diagnostics[0].range],
          },
          kind: vscode.CodeActionKind.QuickFix
        }];
      }
    }(), {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
  }));

  let wasmPath: string;
  if (context.extensionMode === vscode.ExtensionMode.Production) {
    wasmPath = path.resolve(context.extensionPath, 'dist');
  } else {
    wasmPath = path.resolve(context.extensionPath, 'node_modules');
  }

  let python: Language;
  try {
    await Parser.init({
      locateFile() {
        return path.resolve(wasmPath, 'web-tree-sitter', 'tree-sitter.wasm');
      },
    });
    const pypath = path.resolve(wasmPath, 'tree-sitter-python', 'tree-sitter-python.wasm');
    python = await Language.load(pypath);
  } catch (e) {
    outputChannelDep.error(`Error when initializing tree-sitter: ${e}`);
  }

  const doLLMAnalysis = async (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'python' || python == null) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    const parser = new Parser();
    parser.setLanguage(python);
    const tree = parser.parse(doc.getText());

    const modelWithLoc: Map<string, vscode.Range[]> = new Map();

    const query = new Query(python, `
      (
        expression_statement
          (string (string_content) @comment) 
          (#match? @comment "@rhda[ \\n\\t]+model=")
      )
      (
        (comment) @rhdamarker 
          (comment) @modelmarker
          (#match? @rhdamarker "# @rhda") 
          (#match? @modelmarker "# model=")
      )`
    );
    const queryMatches = query.matches(tree!.rootNode);

    for (const match of queryMatches) {
      if (match.captures[0].name === 'rhdamarker') {
        const commentStr = match.captures[1].node.text;
        const modelNameIndex = commentStr.indexOf('model=') + 'model='.length;
        const modelEndIndex = /\s/.exec(commentStr.substring(modelNameIndex))?.index ?? commentStr.length;
        const model = commentStr.substring(modelNameIndex, modelEndIndex);

        const startPos = doc.positionAt(match.captures[1].node.startIndex + modelNameIndex);
        const endPos = new vscode.Position(startPos.line, modelNameIndex + modelEndIndex);
        const range = new vscode.Range(startPos, endPos);

        const ranges = modelWithLoc.get(model) ?? [];
        ranges.push(range);
        modelWithLoc.set(model, ranges);
      } else {
        const commentStr = match.captures[0].node.text;
        const markerIndex = commentStr.indexOf('@rhda');

        let currentModelOffset = 0;
        // eslint-disable-next-line no-cond-assign
        while ((currentModelOffset = commentStr.indexOf('model=', markerIndex + currentModelOffset + '@rhda\n'.length)) > 0) {
          const modelStrIndex = /\s/.exec(commentStr.substring(currentModelOffset + 'model='.length))!.index;
          const model = commentStr.substring(currentModelOffset + 'model='.length, currentModelOffset + 'model='.length + modelStrIndex).trim();

          const startPos = doc.positionAt(match.captures[0].node.startIndex + currentModelOffset + 'model='.length);
          const endPos = new vscode.Position(startPos.line, startPos.character + model.length);
          const range = new vscode.Range(startPos, endPos);

          const ranges = modelWithLoc.get(model) ?? [];
          ranges.push(range);
          modelWithLoc.set(model, ranges);
        }
      }
    }

    const modelCardsInfo = await llmAnalysis(Array.from(modelWithLoc.keys()));
    if (!modelCardsInfo) {
      return;
    }

    const rangeToModel = new Map<vscode.Range, ListModelCardResponse>();
    modelsInDocs.set(doc.uri, rangeToModel);
    for (const [model, ranges] of modelWithLoc) {
      for (const range of ranges) {
        const modelInfo = modelCardsInfo.find(modelResponse => modelResponse.model_name === model);
        if (!modelInfo) {
          // log something here?
          continue;
        }
        rangeToModel.set(range, modelInfo);
      }
    }

    // TODO: handle model with no data from API
    for (const modelInfo of modelCardsInfo) {
      const table = new CliTable3({
        head: ['Safety Metric', 'Score', 'Assessment'],
        chars: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'left': '', 'left-mid': '', 'mid': '─', 'mid-mid': '',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'right': '', 'right-mid': '', 'middle': ' '
        },
        style: { compact: true, border: [], head: [] },
      });

      for (const warning of modelInfo.metrics.filter(metric => metric.metric.startsWith('pct_') || metric.metric === 'acc')) {
        table.push([`${warning.task}: ${warning.metric}`, warning.score.toFixed(3), warning.assessment]);
      }

      for (const range of modelWithLoc.get(modelInfo.model_name)!) {
        diagnostics.push({
          range: range,
          message: table.toString() + `\n\nOpen the detailed report via Code Actions for further details & recommended guardrails.\n`,
          severity: vscode.DiagnosticSeverity.Information,
          source: 'Red Hat LLM Dependency Analytics',
          code: `rhdallm`
        });
      }
    }

    llmAnalysisDiagnosticsCollection.set(doc.uri, diagnostics);
  };

  vscode.workspace.textDocuments.forEach(doLLMAnalysis);
  vscode.workspace.onDidOpenTextDocument(doLLMAnalysis);
  vscode.workspace.onDidChangeTextDocument((event) => doLLMAnalysis(event.document));

  const disposableLLMAnalysisReportCommand = vscode.commands.registerCommand(
    commands.LLM_MODELS_ANALYSIS_REPORT,
    async (model: string, uri: vscode.Uri, range: vscode.Range) => {
      LLMAnalysisReportPanel.createOrShowPanel();
      // remove null check, better missing handling
      LLMAnalysisReportPanel.currentPanel?.updatePanel(modelsInDocs.get(uri)!.get(range)!.id);
    }
  );

  const disposableStackAnalysisCommand = vscode.commands.registerCommand(
    commands.STACK_ANALYSIS_COMMAND,
    // filePath must be string as this can be invoked from the editor
    async (filePath: string, isFromCA: boolean = false) => {
      // TODO: vscode.window.activeTextEditor may be null
      const fspath = filePath ? filePath : vscode.window.activeTextEditor!.document.uri.fsPath;
      const fileName = path.basename(fspath);
      if (isFromCA) {
        record(context, TelemetryActions.componentAnalysisVulnerabilityReportQuickfixOption, { manifest: fileName, fileName: fileName });
      }
      try {
        await generateRHDAReport(context, fspath, outputChannelDep);
        record(context, TelemetryActions.vulnerabilityReportDone, { manifest: fileName, fileName: fileName });
      } catch (error) {
        // TODO: dont show raw message
        const message = applySettingNameMappings((error as Error).message);
        vscode.window.showErrorMessage(`RHDA error while analyzing ${filePath}: ${message}`);
        outputChannelDep.error(buildLogErrorMessage((error as Error)));
        record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: fileName, fileName: fileName, error: message });
      }
    }
  );

  const disposableStackLogsCommand = vscode.commands.registerCommand(
    commands.STACK_LOGS_COMMAND,
    () => {
      if (outputChannelDep) {
        outputChannelDep.show();
      } else {
        vscode.window.showInformationMessage(StatusMessages.WIN_SHOW_LOGS);
      }
    }
  );

  const disposableTrackRecommendationAcceptance = vscode.commands.registerCommand(
    commands.TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND,
    (dependency, fileName) => {
      record(context, TelemetryActions.componentAnalysisRecommendationAccepted, { manifest: fileName, fileName: fileName, package: dependency.split('@')[0], version: dependency.split('@')[1] });

      if (fileName === 'Dockerfile' || fileName === 'Containerfile') {
        redirectToRedHatCatalog();
      }
      if (fileName === 'pom.xml') {
        showRHRepositoryRecommendationNotification();
      }
    }
  );

  registerStackAnalysisCommands(context);

  const showVulnerabilityFoundPrompt = async (msg: string, filePath: vscode.Uri) => {
    const fileName = path.basename(filePath.fsPath);
    const selection = await vscode.window.showWarningMessage(`${msg}`, PromptText.FULL_STACK_PROMPT_TEXT);
    if (selection === PromptText.FULL_STACK_PROMPT_TEXT) {
      record(context, TelemetryActions.vulnerabilityReportPopupOpened, { manifest: fileName, fileName: fileName });
      vscode.commands.executeCommand(commands.STACK_ANALYSIS_COMMAND, filePath.fsPath);
    } else {
      record(context, TelemetryActions.vulnerabilityReportPopupIgnored, { manifest: fileName, fileName: fileName });
    }
  };

  notifications.on('caNotification', (respData: CANotificationData) => {
    const notification = new CANotification(respData);
    caStatusBarProvider.showSummary(notification.statusText(), notification.origin());
    if (notification.hasWarning()) {
      showVulnerabilityFoundPrompt(notification.popupText(), notification.origin());
      record(context, TelemetryActions.componentAnalysisDone, { manifest: path.basename(notification.origin().fsPath), fileName: path.basename(notification.origin().fsPath) });
    }
  });

  notifications.on('caError', (errorData: CANotificationData) => {
    const notification = new CANotification(errorData);
    caStatusBarProvider.setError();

    // Since CA is an automated feature, only warning message will be shown on failure
    vscode.window.showWarningMessage(`RHDA error while analyzing ${errorData.uri.fsPath}: ${notification.errorMsg()}`);

    // Record telemetry event
    record(context, TelemetryActions.componentAnalysisFailed, { manifest: path.basename(notification.origin().fsPath), fileName: path.basename(notification.origin().fsPath), error: notification.errorMsg() });
  });

  try {
    await globalConfig.authorizeRHDA(context);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to Authorize Red Hat Dependency Analytics extension: ${(err as Error).message}`);
    throw err;
  }

  context.subscriptions.push(
    disposableLLMAnalysisReportCommand,
    disposableStackAnalysisCommand,
    disposableStackLogsCommand,
    disposableTrackRecommendationAcceptance,
    // disposableSetSnykToken,
    caStatusBarProvider,
  );

  vscode.workspace.onDidChangeConfiguration(() => {
    globalConfig.loadData();
  });
}

/**
 * Deactivates the extension.
 */
export function deactivate(): Thenable<void> { return new Promise(resolve => resolve()); }

/**
 * Shows an update notification if the extension has been updated to a new version.
 * @param context - The extension context.
 * @returns A Promise that resolves once the notification has been displayed if needed.
 */
async function showUpdateNotification(context: vscode.ExtensionContext) {
  const packageJSON = vscode.extensions.getExtension(EXTENSION_QUALIFIED_ID)!.packageJSON;
  const version = packageJSON.version;
  const previousVersion = context.globalState.get<string>(GlobalState.VERSION);

  if (version === previousVersion) {
    return;
  }

  context.globalState.update(GlobalState.VERSION, version);

  const result = await vscode.window.showInformationMessage(
    `${packageJSON.displayName} has been updated to v${version} — check out what's new!`,
    'README',
    'Release Notes'
  );

  if (result !== undefined) {
    if (result === 'README') {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(packageJSON.homepage));
    } else if (result === 'Release Notes') {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${packageJSON.repository.url}/releases/tag/v${version}`));
    }
  }
}

/**
 * Redirects the user to the Red Hat certified image catalog website.
 */
function redirectToRedHatCatalog() {
  vscode.env.openExternal(vscode.Uri.parse(REDHAT_CATALOG));
}

/**
 * Shows a notification regarding Red Hat Dependency Analytics recommendations.
 */
function showRHRepositoryRecommendationNotification() {
  const msg = 'Important: If you apply Red Hat Dependency Analytics recommendations, ' +
    `make sure the Red Hat GA Repository (${REDHAT_MAVEN_REPOSITORY}) has been added to your project configuration. ` +
    'This ensures that the applied dependencies work correctly. ' +
    `Learn how to add the repository: [Click here](${REDHAT_MAVEN_REPOSITORY_DOCUMENTATION_URL})`;
  vscode.window.showWarningMessage(msg);
}

/**
 * Registers stack analysis commands to track RHDA report generations.
 * @param context - The extension context.
 */
function registerStackAnalysisCommands(context: vscode.ExtensionContext) {

  const invokeFullStackReport = async (filePath: string) => {
    const fileName = path.basename(filePath);
    try {
      await generateRHDAReport(context, filePath, outputChannelDep);
      record(context, TelemetryActions.vulnerabilityReportDone, { manifest: fileName, fileName: fileName });
    } catch (error) {
      const message = applySettingNameMappings((error as Error).message);
      vscode.window.showErrorMessage(`RHDA error while analyzing ${filePath}: ${message}`);
      outputChannelDep.error(buildLogErrorMessage((error as Error)));
      record(context, TelemetryActions.vulnerabilityReportFailed, { manifest: fileName, fileName: fileName, error: message });
    }
  };

  const recordAndInvoke = (origin: string, uri: vscode.Uri) => {
    // TODO: vscode.window.activeTextEditor may be null
    const fileUri = uri || vscode.window.activeTextEditor!.document.uri;
    const filePath = fileUri.fsPath;
    record(context, origin, { manifest: path.basename(filePath), fileName: path.basename(filePath) });
    invokeFullStackReport(filePath);
  };

  const registerCommand = (cmd: string, action: TelemetryActions) => {
    return vscode.commands.registerCommand(cmd, recordAndInvoke.bind(null, action));
  };

  const stackAnalysisCommands = [
    registerCommand(commands.STACK_ANALYSIS_FROM_EDITOR_COMMAND, TelemetryActions.vulnerabilityReportEditor),
    registerCommand(commands.STACK_ANALYSIS_FROM_EXPLORER_COMMAND, TelemetryActions.vulnerabilityReportExplorer),
    registerCommand(commands.STACK_ANALYSIS_FROM_PIE_BTN_COMMAND, TelemetryActions.vulnerabilityReportPieBtn),
    registerCommand(commands.STACK_ANALYSIS_FROM_STATUS_BAR_COMMAND, TelemetryActions.vulnerabilityReportStatusBar),
  ];

  context.subscriptions.push(...stackAnalysisCommands);
}