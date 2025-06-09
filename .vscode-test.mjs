import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    version: '1.78.1',
    installExtensions: ['redhat.vscode-commons'],
    launchArgs: ['--user-data-dir=/tmp/vscode-test'],
    coverage: {
        reporter: ['text', 'text-summary', 'lcov'],
        includeAll: true,
        exclude: ['exhortServices.js', 'exhortServices_rewire.js', 'redhatTelemetry.js', 'redhatTelemetry_rewire.js']
    }
});