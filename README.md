# OpenShift.io Services

Red Hat OpenShift.io services extension allows developers using more traditional development tools to benefit from the package, security and license analytics that OpenShift.io provides:
- CVE analysis highlights code dependencies that have open CVEs against them.
- License analysis determines the license used by the project and its dependencies. If the project already has a license the analysis will show any conflicts between that license and dependency licenses that may be more restrictive. If the project doesn't have a license OpenShift.io will recommend a license for the project that is sufficiently permissive to match the license restrictions of the dependencies.

Today OpenShift.io analytics is limited to Java projects using Maven. Going forward additional builders for Java, NPM and PyPI ecosystems will be supported.

## Prerequisites
Maven must be installed on your machine.

## Quick Start
1. Install the extension. It automatically enables authorization of [OpenShift.io](https://openshift.io/) services from VSCode by using the VSCode-osio-auth extension (included).
2. The analytcis are activated when you first access a manifest file in your project (e.g. `pom.xml`).

## Features

Analytics recommendations are presented as part of a report covering CVEs, license issues and provides insights on the packages used - indicating dependcies that are rarely used together and suggesting similar alternatives that are more commonly used:

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackanalysis.gif)

Alerts for CVEs are also presented in the problems tab when opening the `pom.xml` manifest file.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/compAnalysis.png)


## Usage

You can use this extension to see the analysis report for your project as well as problems shown in the manifest file editor itself.

To view the stack analysis report for a specific module:
1. Open a manifest file (`pom.xml`).
2. Use `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Show fabric8-analytics stack report** to see the stack analysis report for the manifest file.

To view the stack analysis report for the entire project (including multiple sub-modules):
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
