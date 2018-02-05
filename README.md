# OpenShift.io Services

Red Hat OpenShift.io services extension allows developers using more traditional development tools to benefit from the package, security and license analytics that [OpenShift.io](https://openshift.io/) provides:
- Common Vulnerabilities and Exposures (CVE) analysis highlights code dependencies that have open CVEs against them.
- License analysis determines the license used by the project and its dependencies. If the project already has a license the analysis will show any conflicts between that license and dependency licenses that may be more restrictive. If the project does not have a license, OpenShift.io will suggest a license for the project that is sufficiently permissive to match the license restrictions of the dependencies.
- Suggested dependencies that can be added to your application stack, alternative dependencies to currently used dependencies if any of the currently used dependencies are not typically used together in an application stack

Today OpenShift.io services extension is limited to Vert.x and Spring Boot projects using Maven. Going forward, additional builders for Java, npm and PyPI ecosystems will be supported.

## Prerequisites
* Maven must be installed on your machine. Provide the Maven executable filepath.

 **Note:** By default, the `mvn` command is executed directly in the terminal, which requires that  `mvn` is found in your system environment `PATH`.
 If you do not want to add it into your system environment `PATH`, you can specify the maven executable path in settings:
```
{
    "maven.executable.path": "/path-to-maven-home/bin/mvn"
}
```

## Quick Start

1. Install the extension.

 **Note:** OpenShift.io services extension includes the [OpenShift.io service authorization](https://github.com/fabric8-analytics/vscode-osio-auth) extension. Therefore, when OpenShift.io services extension is installed it automatically enables authorization of OpenShift.io services from VS Code.

2. The analytics are activated when you first access a manifest file in your project (for example, `pom.xml`).

## Features

Analytics Insights are presented as part of a report covering CVEs, license issues, and insights provided on the dependencies used - flagging dependencies that are rarely used together and suggesting similar alternatives that are more commonly used:

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackanalysis.gif)

Alerts for CVEs are also presented in the **PROBLEMS** tab when you open the `pom.xml` manifest file.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/compAnalysis.png)


## Usage

You can use this extension to see the analysis report for your project as well as address problems shown in the manifest file editor.

To view the application's stack analysis report for a specific module:
1. Open a manifest file (`pom.xml`).
2. Use `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Generate application stack report on manifest file** to see the application's stack analysis report for the manifest file.

To view the application's stack analysis report for the entire project (including multiple sub-modules):
* Use command `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Generate application stack report on Workspace** to view the application's stack analysis report for the entire workspace/project.

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
