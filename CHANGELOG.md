# Change Log

## 0.0.13 (April 26th, 2019)

- enhancement - Resolved dependencies are stored in target in workspace root. See [#302](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/302)
- fixes - Dependency Analytics Report not generated if triggered via file explorer. See [#299](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/299)
- fixes - Stop polling for stack-report if it takes any longer than 120 secs. See [#304](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/304)

## 0.0.12 (April 25th, 2019)

- enhancement - Replace priview-html with VSCode webView APIs. See [#257](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/257)
- enhancement - Shows error(STDOUT/ERR) in output channel. See [#284](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/284)
- enhancement - Support for Eclipse che/theia.
- enhancement - codeAction returns command which does seems to be supported by all LSP implementations. See [#95](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/issues/95)
- fixes - Issue with Dependency analytics report, if triggered via file explorer. [#279](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/279)
- fixes - Unable to update dependency version. See [#274](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/274)
- fixes - Unable to generate stack report for Maven pom.xml. See [#272](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/272)
- fixes - Experiencing 504 Gateway Time-out for component-analyses. See [#270](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/270)
- fixes - Switching to report page is slow. See [#89](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/89)
- fixes - Generate application stack report for manifest file is throwing unable to parse error for package.json. See [#216](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/216)
- fixes - Recommended version shown in component analyses and stack analyses are not Same. See [#292](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/292)
- improvements - Improved latency numbers to analyze your application dependencies.
- improvements - Optimized resolving application dependencies.

## 0.0.11 (December 14th, 2018)

- enhancement - add support for muti-root workspaces. See [#4496](https://github.com/openshiftio/openshift.io/issues/4496)
- fixes - removes usage of depreciated rootpath APIs.
- fixes - Show info status messge only first time manifest is open and then show if any CVEs are detected along with minor bug fixes and updates READMEs

## 0.0.10 (November 5th, 2018)

- enhancement - add support for Quickfixes for any CVEs flagged with codeaction. See [#4516](https://github.com/openshiftio/openshift.io/issues/4516)
- enhancement - provide one to command to trigger Dependency Analytics Report for a particular manifest/Application level. See [4518](https://github.com/openshiftio/openshift.io/issues/4518)
- enhancement - add support to show progress along with Info toast when lsp calls complete.

## 0.0.9 (October 27th, 2018)

- enhancement - add support to show progress when language Server is in action. See [#4487](https://github.com/openshiftio/openshift.io/issues/4487).
- enhancement - Show proper status messages for progress for stack report generation, currently it just shows "Generate Application Stack Report". See [#4487](https://github.com/openshiftio/openshift.io/issues/4487).
- Increases test coverage
