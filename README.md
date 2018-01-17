# fabric8-analytics stack report

This extension analyses application stack for maven, npm and pypi ecosystem.

Quick Start
============
1. Install the Extension
2. Extension is activated when you first access a manifest file i.e `pom.xml`, `package.json` or `requirements.txt`

Features
=========

* This extension helps to analyze your application stack.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/stackanalysis.png)

* This extension helps to analyze your components of application stack as and when you type.

![ screencast ](https://raw.githubusercontent.com/fabric8-analytics/fabric8-analytics-vscode-extension/master/images/compAnalysis.png)


Available commands
==========================
The following commands are available:

The purpose of the extension is to show stack analyses report. To play with the extension:
- Open a manifest file i.e (`requirements.txt`, `pom.xml`, `package.json`)
- Use command (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) `Show fabric8-analytics stack report` to view stack analyses report on one manifest file
- Use command (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) `Show fabric8-analytics stack report on Workspace` to view stack analyses report on entire workspace/project


Contributing
===============
This is an open source project open to anyone. Contributions are extremely welcome!


# How to run locally

* `npm install`
* `npm run compile` to start the compiler in watch mode
* open this folder in VS Code and press `F5`


# Run tests
* open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Launch Tests`
* press `F5` to run the tests in a new window with your extension loaded
* see the output of the test result in the debug console
* make changes to `test/extension.test.ts` or create new test files inside the `test` folder
    * by convention, the test runner will only consider files matching the name pattern `**.test.ts`
    * you can create folders inside the `test` folder to structure your tests any way you want


Feedback
===============
* File a bug in [GitHub Issues](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues).
