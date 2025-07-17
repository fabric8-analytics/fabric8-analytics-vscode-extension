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

export class AnalysisMatcher {
  matchers: Array<{ scheme: string, pattern: RegExp, callback: (path: Uri, contents: string) => Promise<void> }> = [
    {
      scheme: 'file', pattern: new RegExp('^package\\.json$'), callback: (path: Uri, contents: string) => {
        return dependencyDiagnostics.performDiagnostics(path, contents, new PackageJson());
      }
    },
    {
      scheme: 'file', pattern: new RegExp('^pom\\.xml$'), callback: (path: Uri, contents: string) => {
        return dependencyDiagnostics.performDiagnostics(path, contents, new PomXml());
      }
    },
    {
      scheme: 'file', pattern: new RegExp('^go\\.mod$'), callback: (path: Uri, contents: string) => {
        return dependencyDiagnostics.performDiagnostics(path, contents, new GoMod());
      }
    },
    {
      scheme: 'file', pattern: new RegExp('^requirements\\.txt$'), callback: (path: Uri, contents: string) => {
        return dependencyDiagnostics.performDiagnostics(path, contents, new RequirementsTxt());
      }
    },
    {
      scheme: 'file', pattern: new RegExp('^build\\.gradle$'), callback: (path: Uri, contents: string) => {
        return dependencyDiagnostics.performDiagnostics(path, contents, new BuildGradle());
      }
    },
    {
      scheme: 'file', pattern: new RegExp('^(Dockerfile|Containerfile)$'), callback: (path: Uri, contents: string) => {
        return imageDiagnostics.performDiagnostics(path, contents, new Docker());
      }
    }
  ];

  async handle(doc: TextDocument, outputChannel: DepOutputChannel) {
    const excludeMatch = globalConfig.excludePatterns.find(pattern => pattern.match(doc.uri.fsPath));
    if (excludeMatch) {
      outputChannel.debug(`skipping "${doc.uri.fsPath}" due to matching ${excludeMatch.pattern}`);
      return;
    }
    for (const matcher of this.matchers) {
      if (matcher.pattern.test(basename(doc.fileName))) {
        outputChannel.info(`generating component analysis diagnostics for "${doc.fileName}"`);
        await matcher.callback(doc.uri, doc.getText());
        outputChannel.info(`done generating component analysis diagnostics for "${doc.fileName}"`);
      }
    }
  }
}