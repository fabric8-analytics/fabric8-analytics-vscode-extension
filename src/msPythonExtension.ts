import { OutputChannel, Uri, extensions } from 'vscode';

export async function getSelectedInterpreterPath(
  outputChannel: OutputChannel,
  scopeUri: Uri | undefined
): Promise<string | undefined> {
  try {
    const extension = extensions.getExtension('ms-python.python');
    if (!extension) {
      outputChannel.appendLine('Python extension not found');
    } else {
      if (!extension.isActive) {
        outputChannel.appendLine('Waiting for Python extension to load');
        await extension.activate();
        outputChannel.appendLine('Python extension loaded');
      }

      const execDetails = await extension.exports.settings.getExecutionDetails(scopeUri);
      let result: string | undefined;
      if (execDetails.execCommand && execDetails.execCommand.length > 0) {
        result = execDetails.execCommand[0];
      }

      if (!result) {
        outputChannel.appendLine(`No pythonPath provided by Python extension`);
      } else {
        outputChannel.appendLine(`Received pythonPath from Python extension: ${result}`);
      }

      return result;
    }
  } catch (error) {
    outputChannel.appendLine(
      `Exception occurred when attempting to read pythonPath from Python extension: ${JSON.stringify(error)}`
    );
  }

  return undefined;
}
