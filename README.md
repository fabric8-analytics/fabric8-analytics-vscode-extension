# OpenShift.io Services

Insights about your application dependencies:
- Flags a security vulnerability and suggests a remedial version
- Shows Github popularity metrics along with latest version
- Suggests a project level license, check for conflicts between dependency licences
- AI based guidance for alternative dependencies
- AI based guidance for additional dependencies 

## Supported Languages

Today OpenShift.io services extension supports projects using Maven and projects build on npm (Node ecosystem). 
Extending support for Python and Go languages is currently under progress.

## Prerequisites
* [For analyzing Java applications] Maven must be installed on your machine. Provide the Maven executable filepath.

> **Note:** By default, the `mvn` command is executed directly in the terminal, which requires that  `mvn` is found in your system environment `PATH`.           
 If you do not want to add it into your system environment `PATH`, you can specify the maven executable path in settings.

```
{
    "maven.executable.path": "/path-to-maven-home/bin/mvn"
}
```

* [For analyzing Node applications] Node and npm must be installed on your machine. Provide the npm executable filepath.

> **Note:** By default, the `npm` command is executed directly in the terminal, which requires that  `npm` is found in your system environment `PATH`.           
 If you do not want to add it into your system environment `PATH`, you can specify the maven executable path in settings.

```
{
    "npm.executable.path": "/path-to-npm-home/bin/npm"
}
```

## Quick Start

1. Install the 'OpenShift.io Services' extension.

2. How to use ?

> Open or edit a manifest file (`pom.xml` / `package.json`) to flag any CVEs present in your application and right click on a manifest file (`pom.xml`/`package.json`) in the 'Vscode File explorer' or  'Vscode File editor' to display a detailed report for your application.



## Features

 Detailed report for your application covering CVEs, license issues, and AI based insights provided on the application dependencies used - flagging dependencies that are rarely used together and suggesting similar alternatives that are more commonly used:

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackanalysis.gif)

Alerts for CVEs are also presented in the **PROBLEMS** tab when you open the `pom.xml` manifest file.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/compAnalysis.png)


## Usage

You can use this extension to see the analysis report for your project as well as address problems shown in the manifest file editor.

To view the application's stack analysis report for a specific module:
1. Open a manifest file (`pom.xml`, `package.json`).
2. Use `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Generate application stack report on manifest file** to see the application's stack analysis report for the manifest file.

To view the application's stack analysis report for the entire project (including multiple sub-modules):
* Use command `Ctrl+Shift+P` on Linux or `Cmd+Shift+P` on Mac, and then click **Generate application stack report on Workspace** to view the application's stack analysis report for the entire workspace/project.

## Contributing

This is an open source project, contributions and questions are welcome. If you have any feedback, suggestions, or ideas, reach us on:
* Chat: [#openshiftio  ](https://chat.openshift.io/developers/channels/town-square).
* Log issues:  [GitHub Repository](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues).

## Note

It creates a folder `target` in workspace which is used for processing of manifest files, needed for generating stack report. So kindly add `target` in `.gitignore`.

### Develop this extension

1. Install the dependencies:
`npm install`.
2. Start the compiler in watch mode:
`npm run compile`.
3. Open this folder in VS Code and press `F5`.
