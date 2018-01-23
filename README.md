# Fabric8-Analytics stack report

Fabric8-Analytics stack report extension analyzes application stacks for Maven and the components comprising the application stack. Going forward, npm and PyPI ecosystems will be supported too.

## Prerequisites
1. Make sure you have Maven installed in your operating system.

## Quick Start
1. Install the extension. It automatically enables authorization of [OpenShift.io](https://openshift.io/) services from VS Code by using the VSCode-osio-auth extension.
2. The extension is activated when you first access a manifest file such as a `pom.xml`.


## Features

This extension helps analyze:

* The stack at workspace level.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackanalysis.gif)


* The stack at individual manifest file level (`pom.xml`).

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackAnalysisManifest.gif)

* The individual components of application stack as and when you type.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/compAnalysis.png)

## Usage

You can use this extension to see the analysis report for your manifest file and for the entire workspace.

To view the stack analysis report for the manifest file:
1. Open a manifest file (`pom.xml`).
2. Use `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Show fabric8-analytics stack report** to see the stack analysis report for the manifest file.

To view the stack analysis report for the entire workspace:
* Use command `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Show fabric8-analytics stack report on Workspace** to view the stack analysis report for the entire workspace/project.

## Contributing

This is an open source project, contributions and questions are welcome. If you have any feedback, suggestions, or ideas, reach us on:
* Chat: [fabric8-analytics mattermost  channel](https://chat.openshift.io/developers/channels/fabric8-analytics).
* Log issues:  [GitHub Repository](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues).

### Develop this extension

1. Install the dependencies:
`npm install`.
2. Start the compiler in watch mode:
`npm run compile`.
3. Open this folder in VS Code and press `F5`.
