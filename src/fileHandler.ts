import { basename } from 'path';
import { TextDocument, Uri } from 'vscode';
import * as dependencyDiagnostics from './dependencyAnalysis/diagnostics';
import * as imageDiagnostics from './imageAnalysis/diagnostics';
import { DependencyProvider as PackageJson } from './providers/package.json';
import { DependencyProvider as PomXml } from './providers/pom.xml';
import { DependencyProvider as GoMod } from './providers/go.mod';
import { DependencyProvider as RequirementsTxt } from './providers/requirements.txt';
import { DependencyProvider as BuildGradle } from './providers/build.gradle';
import { ImageProvider as Docker } from './providers/docker';
import { globalConfig } from './config';
import { DepOutputChannel } from './depOutputChannel';
import { TokenProvider } from './tokenProvider';

interface MatcherConfig {
  pattern: RegExp
  callback(tokenProvider: TokenProvider, path: Uri, contents: string): Promise<void>
  providerName: string
}

export class AnalysisMatcher {
  private static readonly matchers: ReadonlyArray<MatcherConfig> = [
    {
      pattern: /^package\.json$/,
      callback: (tokenProvider, path, contents) => { return dependencyDiagnostics.performDiagnostics(tokenProvider, path, contents, new PackageJson()); },
      providerName: 'npm'
    },
    {
      pattern: /^pom\.xml$/,
      callback: (tokenProvider, path, contents) => { return dependencyDiagnostics.performDiagnostics(tokenProvider, path, contents, new PomXml()); },
      providerName: 'maven'
    },
    {
      pattern: /^go\.mod$/,
      callback: (tokenProvider, path, contents) => { return dependencyDiagnostics.performDiagnostics(tokenProvider, path, contents, new GoMod()); },
      providerName: 'go'
    },
    {
      pattern: /^requirements\.txt$/,
      callback: (tokenProvider, path, contents) => { return dependencyDiagnostics.performDiagnostics(tokenProvider, path, contents, new RequirementsTxt()); },
      providerName: 'requirements'
    },
    {
      pattern: /^build\.gradle$/,
      callback: (tokenProvider, path, contents) => { return dependencyDiagnostics.performDiagnostics(tokenProvider, path, contents, new BuildGradle()); },
      providerName: 'gradle'
    },
    {
      pattern: /^(Dockerfile|Containerfile)/,
      callback: (tokenProvider, path, contents) => { return imageDiagnostics.performDiagnostics(tokenProvider, path, contents, new Docker()); },
      providerName: 'docker'
    }
  ];

  public static pathToConfig(uri: Uri): MatcherConfig | undefined {
    for (const matcher of AnalysisMatcher.matchers) {
      if (matcher.pattern.test(basename(uri.fsPath))) {
        return matcher;
      }
    }
  }

  async handle(tokenProvider: TokenProvider, doc: TextDocument, outputChannel: DepOutputChannel) {
    const excludeMatch = globalConfig.excludePatterns.find(pattern => pattern.match(doc.uri.fsPath));
    if (excludeMatch) {
      outputChannel.debug(`skipping "${doc.uri.fsPath}" due to matching ${excludeMatch.pattern}`);
      return;
    }
    const matcher = AnalysisMatcher.pathToConfig(doc.uri);
    if (matcher) {
      outputChannel.info(`generating component analysis diagnostics for "${doc.fileName}"`);
      await matcher.callback(tokenProvider, doc.uri, doc.getText());
      outputChannel.info(`done generating component analysis diagnostics for "${doc.fileName}"`);
    }
  }
}