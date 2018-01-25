# OpenShift.io Services

Red Hat [OpenShift.io](https://openshift.io/) services extension allows developers using more traditional development tools to benefit from the package, security and license analytics that OpenShift.io provides:
- CVE(Common Vulnerabilities and Exposures) analysis highlights code dependencies that have open CVEs against them.
- License analysis determines the license used by the project and its dependencies. If the project already has a license the analysis will show any conflicts between that license and dependency licenses that may be more restrictive. If the project does not have a license, OpenShift.io will recommend a license for the project that is sufficiently permissive to match the license restrictions of the dependencies.

Today OpenShift.io analytics is limited to Vertx and Spring Boot projects using Maven. Going forward additional builders for Java, NPM and PyPI ecosystems will be supported.

## Prerequisites

Provide Maven executable filepath.
* By default, `mvn` command is executed directly in the terminal, which requires `mvn` can be found in system envronment `PATH`.
* If you do not want to add it into `PATH`, you can specify maven executable path in settings:
    ```
    {
        "maven.executable.path": "/path-to-maven-home/bin/mvn"
    }
    ```


## Quick Start

1. Install the extension. It automatically enables authorization of [OpenShift.io](https://openshift.io/) services from VSCode by using the VSCode-osio-auth extension (included).
2. The analytics are activated when you first access a manifest file in your project (e.g. `pom.xml`).

## Features

Analytics recommendations are presented as part of a report covering CVEs, license issues and provides insights on the packages used - indicating dependencies that are rarely used together and suggesting similar alternatives that are more commonly used:

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
* Chat: [#openshiftio  ](https://chat.openshift.io/developers/channels/town-square).
* Log issues:  [GitHub Repository](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues).

### Develop this extension

1. Install the dependencies:
`npm install`.
2. Start the compiler in watch mode:
`npm run compile`.
3. Open this folder in VS Code and press `F5`.
