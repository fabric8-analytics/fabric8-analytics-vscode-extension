import * as cp from 'child_process';
import * as path from 'path';
import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './');
    const vscodeExecutablePath = await downloadAndUnzipVSCode('1.78.1');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(cliPath, ['--install-extension', 'redhat.vscode-commons'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    // Download VS Code, unzip it and run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--user-data-dir=/tmp/vscode-test', path.resolve(extensionDevelopmentPath, 'test/resources')]
    });
  } catch (err) {
    console.error(`Failed to run tests. ${err}`);
    process.exit(1);
  }
}

main();
