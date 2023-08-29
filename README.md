# Red Hat Dependency Analytics

[![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/redhat.fabric8-analytics.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.fabric8-analytics)
![CI Build](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/workflows/Tests/badge.svg?branch=master)
[![codecov](https://codecov.io/gh/fabric8-analytics/fabric8-analytics-vscode-extension/branch/master/graph/badge.svg?token=rHIO4KNlJ0)](https://codecov.io/gh/fabric8-analytics/fabric8-analytics-vscode-extension)

`Red Hat Dependency Analytics (RHDA)` is powered by [Snyk Intel Vulnerability DB](https://snyk.io/product/vulnerability-database/). It is the most advanced and accurate open source vulnerability database in the industry and adds value with the latest, fastest, and numerous vulnerabilities derived from multiple sources.

'Dependency Analytics Report' provides insights about your application dependencies and flags security vulnerabilities(CVE)

## Supported Languages

Red Hat Dependency Analytics extension supports projects using Maven and NPM (Node ecosystem).
Extending support for other languages is currently in progress.

## Prerequisites

This extension assumes you have the following binaries on your `PATH`:

- `mvn` (for analyzing Java applications)

By default, the `mvn` command is executed directly in the terminal, which requires that `mvn` is found in your system environment `PATH`. 

> **NOTE** Red Hat Dependency Analytics is an online service hosted and maintained by Red Hat. This open source software will access only your manifests file(s) to learn about the application dependencies within before providing you with a detailed report.

## Quick Start

- Install the `Dependency Analytics` extension by Red Hat.

To trigger `Inline Component Analysis` for a manifest file, you need to:
- Open or edit a manifest file (`pom.xml`/`package.json`), which scans your application and provides inline feedback on any dependencies identified with security vulnerabilities.

To generate the `Red Hat Dependency Analytics Report` for your application, you can do one of the following:
- Right click on a manifest file (`pom.xml`/`package.json`) in the 'Vscode File explorer' or 'Vscode File editor' and choose `Dependency Analytics Report` option.
- On an open manifest file (`pom.xml`/`package.json`), click on the pie icon located at the upper right corner in the tab container.
-  On an open manifest file (`pom.xml`/`package.json`), hoover over a dependency marked by Inline Component Analysis, click on `Quick Fix` and choose `Detailed Vulnerability Report`.

## Features

1. Upon opening or editing a manifest file (`pom.xml`/`package.json`), an automated scan will be triggered on your application. This process provides immediate, inline feedback regarding any dependencies that have been detected to have security vulnerabilities. Such dependencies will be appropriately flagged in red and present a short summary when hoovered over. Summary contains the full package name and version, amount of known security vulnerabilities and highest severity status of said vulnerabilities.
<br >**Note** a `target` folder will be created in the workspace, used to process pom.xml files. Please add `target` to `.gitignore`.


2. When hoovering over the inline feedback for dependencies with security vulnerabilities, the 'Quick Fix' link provides an option for `Detailed Vulnerability Report` in order to display the Red Hat Dependency Analytics Report for more information.

3. Excluding a package from analysis can be achieved by marking the package for exclusion.
<br >If users wish to ignore vulnerabilities for a dependency, it can be done by adding "exhortignore" as a comment against the dependency, group id, artifact id, or version scopes of that particular dependency in the manifest file for Maven. Node manifest files don't support comments, hence "exhortignore" must be given inside a JSON.
If "exhortignore" is followed by a list of comma-separated Snyk vulnerability IDs, only listed vulnerabilities will be ignored during analysis.

- Java Maven users can add a comment in pom.xml, example:
	```
	<dependency> <!--exhortignore-->
		<groupId>...</groupId>
		<artifactId>...</artifactId>
		<version>...</version>
	</dependency>
	```
- Javascript NPM users can add a list of Snyk vulnerability IDs to be excluded under the *exhortignore* field in package.json, example:
	```
	{
		"name": "sample",
		"version": "1.0.0",
		"description": "",
		"main": "index.js",
		"keywords": [],
		"author": "",
		"license": "ISC",
		"dependencies": {
			"dotenv": "^8.2.0",
			"express": "^4.17.1",
			"jsonwebtoken": "^8.5.1",
			"mongoose": "^5.9.18"
		},
		"exhortignore": [
			"jsonwebtoken"
		]
	}
	```

4. Red Hat Dependency Analytics does not analyse **dev/test** dependencies.
- *test* scope in pom.xml:
	```
	<dependency>
		<groupId>...</groupId>
		<artifactId>...</artifactId>
		<version>...</version>
		<scope>test</scope>
	</dependency>
	```
- *devDependencies* field in package.json:
	```
	{
		"name": "sample",
		"version": "1.0.0",
		"description": "",
		"main": "index.js",
		"keywords": [],
		"author": "",
		"license": "ISC",
		"dependencies": {
			"dotenv": "^8.2.0",
			"express": "^4.17.1",
			"jsonwebtoken": "^8.5.1",
			"mongoose": "^5.9.18"
		},
		"devDependencies": {
        	"axios": "^0.19.0"
    	}
	}
	```

5. To generate the `Red Hat Dependency Analytics Report` for your application, you can do one of the following:
- Right click on a manifest file (`pom.xml`/`package.json`) in the 'Vscode File explorer' or 'Vscode File editor' and choose `Dependency Analytics Report` option.
- On an open manifest file (`pom.xml`/`package.json`), click on the pie icon ![icon](images/0.2.0/icon.png) located at the upper right corner in the tab container.
-  On an open manifest file (`pom.xml`/`package.json`), hoover over a dependency marked by Inline Component Analysis, click on `Quick Fix` and choose `Detailed Vulnerability Report`.

6. The HTML of the `Red Hat Dependency Analytics Report` will be stored temporarily while the Dependency Analytics Report tab remains open. Once the tab is closed, the corresponding file will be automatically removed. You can define the filename by adjusting the configuration in the extension's workspace settings, under the *Dependency Analytics: Dependency Analysis Report File Path* field. The default location for this file is '/tmp/dependencyAnalysisReport.html'.

7. what you can do in the report

## Configuration

The Dependency Analysis plugin has configurable parameters within the extension that allow users to tailor the behavior and functionality of the extension according to their preferences.
To access these configurable parameters please enter the [extension workspace settings](https://code.visualstudio.com/docs/getstarted/settings) withing you VS code instance, switch to *Workspace* tab and search for *Dependency Analytics*.

### Configurable Parameters

**Exhort Snyk Token** - edit the *Exhort Snyk Token* setting to change the Snyk token setting.
The Snyk Token allows Exhort to authenticate with Snyk (vulnerability data provider).
Please note that a valid Snyk Token is not provided in the extension workspace settings, Snyk vulnerabilities will not be displayed.
An alert message on edit will provide feedback on whether the token is valid or not.
To generate a new token please visit this [link](https://app.snyk.io/login?utm_campaign=Code-Ready-Analytics-2020&utm_source=code_ready&code_ready=FF1B53D9-57BE-4613-96D7-1D06066C38C9).

**Dependency Analysis Report File Path** - edit the *Dependency Analysis Report File Path* setting to change the location where the HTML of the `Red Hat Dependency Analytics Report` will be stored (Default value: "/tmp/dependencyAnalysisReport.html").

# Using Dependency Analytics on your CI Builds

## GitHub Actions 
You can use the [CodeReady Dependency Analytics GitHub Action](https://github.com/marketplace/actions/codeready-dependency-analytics) to
 automate analysis of vulnerabilities in a project's dependencies. Refer to action's documentation or [this article](https://developers.redhat.com/articles/2021/11/30/automate-dependency-analytics-github-actions#) on how to set it up for your projects.

# Know more about Dependency Analytics Platform

The mission of this project is to enhance developer experience significantly:
providing Insights(security, licenses, AI based guidance) for applications and helping developers, Enterprises.

- [GitHub Organization](https://github.com/fabric8-analytics)

# Support, Feedback & Questions

- File a bug in [GitHub Issues](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues)

# License

Apache 2.0, See [LICENSE](LICENSE) for more information.

# Data and telemetry

The Red Hat Dependency Analytics Extension for Visual Studio Code collects anonymous [usage data](Telemetry.md) and sends it to Red Hat servers to help improve our products and services. Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more. This extension respects the `redhat.elemetry.enabled` setting which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting
