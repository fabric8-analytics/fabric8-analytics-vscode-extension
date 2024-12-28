# Change Log
## 0.9.5 (Jul 30th 2024)
- enhancement - Added support for vulnerability analysis for Gradle build manifests.
- enhancement - Added support for vulnerability analysis on images in Dockerfiles.
- enhancement - Added new settings for the Python and Go ecosystems.
- enhancement - Added support for private GitHub Registries.
- fixes - Fixed an issue by removing a redundant `/` at the beginning of Windows URI paths that was causing some `mvn` commands to fail. See [PR#692](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/692) for details.
- fixes - Fixed an issue with the Stack Analysis running on an open file, instead of running on an opened manifest file. See [PR#692](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/692) for details.
- known issue - You can get an error by using the `Use Pip Dep Tree` and `Use Python Virtual Environment` options simultaneously. See the [Known Issues section](README.md#known-issues) of the README for more information.
- known issue - Red Hat Dependency Analytics has limitations for Maven and Gradle. See the [Known Issues section](README.md#known-issues) of the README for more information.
- informational - Added a telemetry event to track Red Hat's recommended version acceptance.
## 0.9.4 (Mar 25th 2024)
- informational - Removing access to Snyk's Vulnerability Database.
## 0.9.3 (Mar 6th 2024)
- enhancement - Red Hat Dependency Analytics reporting has integrated the ONGuard service by using [Open Source Vulnerability (OSV)](https://google.github.io/osv.dev/) and the [National Vulnerability Database (NVD)](https://nvd.nist.gov/) data sources for additional vulnerability information.
- enhancement - Integrated VS Code's [Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage) feature for securing the Snyk token. See [PR#689](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/689) for details.
- fixes - Fixed an issue with displaying wrong data when triggering the event handler for Component Analysis on a unsaved manifest file. Component Analysis is no longer triggered on unsaved manifest files. See [PR#239](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/239) for details.
- fixes - Fixed an issue where the diagnostic source name is being obscured in the View Problem panel from an inline analysis. See [PR#239](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/239) for details.
- informational - The naming convention for VS Code commands has changed from `fabric8` to `rhda`. For example, `fabric8.stackAnalysis` is now `rhda.stackAnalysis`.
## 0.9.2 (Feb 5th 2024)
- informational - The `redHatDependencyAnalyticsReportFilePath` setting name has changed to `reportFilePath`. If you had a custom file path set for `redHatDependencyAnalyticsReportFilePath`, then you need to add your custom file path to the `reportFilePath` setting.
- enhancement - Added a vulnerability severity alert level setting for the user to receive inline notifications for just errors or warnings. See [PR#674](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/674) for details.
- fixes - Fixed an issue with the `codeActionsMap` call. When multiple manifest documents are open that have the same dependency, one of the document entries gets deleted. This gave a wrong result in the analysis. See [PR#236](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/236) for details.
- fixes - Fixed an issue in the Exhort Javascript API. This fix enables and supports analysis of `pom.xml` manifests that include local modules, and a parent Project Object Model (POM). See the [PR#237](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/237) for details.
- fixes - Fixed an issue with the analysis report not displaying because of spaces in the manifest file path. See [PR#100](https://github.com/RHEcosystemAppEng/exhort-javascript-api/pull/100) for details.
## 0.9.1 (Dec 24th 2023)
- fixes - Resolved endpoint configuration issue by removing EXHORT_DEV_MODE environment configuration parameter. See [PR#672](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/672) for details.
## 0.9.0 (Dec 21th 2023)
- informational - Service Preview release of Red Hat Dependency Analytics (RHDA) extension.
- informational - Configuration names for all supported executable paths in the extension settings have changed. These executable paths are only used for the analysis.
- enhancement - Added support for error observation by using Sentry.
- enhancement - Support for more complex SPDX SBOM relationships.
- enhancement - Added recommendations and remediations in the _Quick Fix..._ tab.
- fixes - Fixed an issue where unique Snyk vulnerability information was not being displayed in the Dependency Analytics report. See [PR#217](https://github.com/RHEcosystemAppEng/exhort/pull/217) for details.
- fixes - Better valid and invalid token alert messages for the Snyk vulnerability information provider. See [PR#218](https://github.com/RHEcosystemAppEng/exhort/pull/218) for details.
- fixes - Fixed analysis report discrepancies between Red Hat Dependency Analytics and Snyk’s analytics. See [PR#219](https://github.com/RHEcosystemAppEng/exhort/pull/219) for details.
- fixes - Fixed the Go and Python package links so they point to their specific package manager website.
## 0.7.3 (Nov 8th 2023)
- enhancement - Support for Golang and Python ecosystems. See [PR#656](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/656) for details.
- enhancement - A new setting for Python and Go environments to restrict package analysis when there is a package version mis-match between the environment and the manifest file. See the [Features section](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/blob/master/README.md#features) of the README for more information.
## 0.7.0 (Sep 11th 2023)
- informational - Alpha release of the new Red Hat Dependency Analytics (RHDA) extension.
- informational - Code base refactoring from CRDA to RHDA alpha. See [PR#636](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/636) for details.
- informational - Currently no support for Python and Go, but coming soon.
- fixes - Improved overall performance and stability with the analysis report.
## 0.3.10 (May 22th 2022)
- fixes - Extension breaks for Go version 1.17. See [#608](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/608)
- fixes - Retry failed stack analysis requests. See [#609](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/609)
## 0.3.6 (June 28th 2022)
- fixes - [ISSUE] Extension causes VSCode Jupyter Notebook to malfunction. See [#546](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/546) [#547](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/547) [#567](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/567)
## 0.3.5 (November 29th 2021)
- fixes - [ISSUE] Remove vscode-commons dependency. See [#528](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/528) [#551](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/551)
## 0.3.4 (October 6th 2021)
- fixes - [ISSUE] letsencrypted issue by moving to selfhosted. See [#542](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/542)
## 0.3.3 (May 6th 2021)
- enhancement - Let language server know about the type of client and RedHat UUID. See [#497](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/497)
- enhancement - Use lsp 0.4.26 to pass more data to api-server.See [#186](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/186)
- enhancement - upgrade dev deps to fix vulns. See [#514](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/514)
- enhancement - add dev-dependency disclaimer. See [#519](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/519)
- fixes - [BUG] go run github.com/fabric8-analytics/cli-tools/gomanifest doesn't work, but gomanifest itself does, and the extension is trying for go run. See [#504](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/504) [#517](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/507)
- fixes - [BUG] Message 'Unable to execute 'go list'' command, run 'go mod tidy' to know more' keeps appearing. See [#506](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/506) [#511](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/511)
- fixes - [BUG] Analysis is triggered way too often (each keystroke). See [#509](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/509) [#516](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/516)
- fixes - [BUG] Duplicate "Dependency Analytics Report..." commands in command palette. See [#512](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/512) [#517](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/517)
- fixes - [BUG] Ignore unparseable files from telemetry reporting. See [#513](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/513) [#191](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/191)

## 0.3.2 (February 9th, 2021)
- enhancement - Get python path from ms-python extension. See [#485](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/485)
- enhancement - Usage data collection to enhance extension. For more details view [privacy statement](https://developers.redhat.com/article/tool-data-collection) and [usage data doc](Telemetry.md). See [#489](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/486) [#487](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/487) [#488](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/488)
- fixes - Use lsp 0.4.24 to fix bug with empty manifests. See [#493](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/493) [#494](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/494)

## 0.3.1 (January 21st, 2021)

- fixes - status bar icon tries to open a report for the currently opened file. See [#478](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/478) [#479](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/479)
- fixes - LSP failure on vscode-insider and Che(node >= 12.16.0). See [#481](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/481) [#483](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/483)

## 0.3.0 (January 4th, 2021)
- enhancement - Support for Golang ecosystem. Plugin can now scan and identify vulnerability within module and package for golang software stacks. See [#436](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/436)
    - Identify direct and transitive vulnerability for modules and packages
    - Support for semver and pseudo version format
    - Provide early access to vulnerability data for modules and packages
    - Highlight and provide vulnerability details using alerts & messages
    - Recommend a non vulnerable version (if available)
- enhancement - Use concise text for component analysis notification. See [#472](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/472)
- enhancement - Show status bar text based on component analysis status. See [#459](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/459)
    - Notification will be shown only once per manifest in single session.
    - Further changes will be updated only via status bar.
- enhancement - Updated fabric8-analytics-lsp-server to latest version (v[0.4.19](https://www.npmjs.com/package/fabric8-analytics-lsp-server/v/0.4.19)): See [#469](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/469)
    - Golang CA support from LSP. See [#148](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/148)
    - Handle replace directive from go.mod. See [#162](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/162)
    - Property tag support for pom.xml. See [#172](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/172)
    - Cache batch requests and avoid repeated api call for better user experience. See [176](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/176)
    - Clear diagnostics before generating new set of diagnostics. See [#177](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/177)
- fixes - Propagate errors from lsp server to client. See [#432](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/432)
- fixes - Dependency UTM encoding issue. See [#460](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/460)
- fixes - VsCode Extension: Dependency Details card needs minor improvements. See [#295](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/295)
- fixes - Sort dependencies shown in stack report. See [#260](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/260)
- fixes - Stop showing notification if no security vulnerability found. See [#434](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/434)
- fixes - Extension overrides default keybinding for opening the debugger view. See [#442](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/442)
- fixes - Output log opens everytime requirements.txt is opened. See [#458](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/458)
- fixes - Diagnostics are not cleared when all vulnerabilities are removed. See [#465](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/465)
- fixes - Property based versions are ignored on LS for maven. See [#258](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/258)

## 0.2.1 (November 9th, 2020)

- enhancement - Updated fabric8-analytics-lsp-server to latest version (v[0.4.2](https://www.npmjs.com/package/fabric8-analytics-lsp-server/v/0.4.2)): See [#440](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/440)
    - Code-action to trigger Dependency Analytics Report. See [#149](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/149)
- fixes - Report generation fails with virtualenv enabled python. See [#404](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/404)
- fixes - Propagate errors from lsp server to client. See [#432](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/432)

## 0.2.0 (October 6th, 2020)

- enhancement - Integration of user management to connect Snyk account with Dependency Analytics report, which enables advance vulnerability analysis for publicly known exploits and Snyk curated unique and pre-published security advisories.
- enhancement - Add shortcut icon for Dependency Analytics Report in editor groups. See [#418](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/418)
- enhancement - Use webpack to reduce extension loading time. See [#359](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/359)
- enhancement - Updated fabric8-analytics-lsp-server to latest version (v[0.3.2](https://www.npmjs.com/package/fabric8-analytics-lsp-server/v/0.3.2)): See [#420](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/420)
    - Using component-analysis batch API with POST request method. See [#125](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/125)
    - Update Diagnostic Message. See [#146](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/146)
    - Show exploitable vulnerability count in Diagnostic Message. See [#137](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/137)
- enhancement - Upadated Stack Report UI:
    - Snyk token submission modal to connect Snyk account with Dependency Analytics Report. See [#161](https://github.com/fabric8-analytics/fabric8-analytics-stack-report-ui/pull/161)
    - View premium fields after connecting Snyk account with Dependency Analytics Report. See [#157](https://github.com/fabric8-analytics/fabric8-analytics-stack-report-ui/pull/157)
    - Remove Github stats and Licenses details from Security Issues card. See [#166](https://github.com/fabric8-analytics/fabric8-analytics-stack-report-ui/pull/166)
- fixes - Can not navigate to Synk: Added postMessage to handle url click. See [#403](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/403)
- fixes - Rename notification button with 'Click here for Detailed Vulnerability Report'. See [#423](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/423)
- fixes - Update tags for extension to enable better prioritization in marketplace search. See [#427](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/427)

## 0.1.0 (July 14th, 2020)

- enhancement - Integration with [Snyk Intel Vulnerability DB](https://snyk.io/product/vulnerability-database/), it is the most advanced and accurate open source vulnerability database in the industry. That adds value with the latest, fastest and more number of vulnerabilities derived from numerous sources and also includes Snyk curated unique and pre-published security advisories that come with early stage of vulnerability detection.
- enhancement - Updated fabric8-analytics-lsp-server to latest version (v[0.2.1](https://www.npmjs.com/package/fabric8-analytics-lsp-server/v/0.2.1)): See [#381](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/381)
  - Different Underline color scheme for commonly known vulnerabilities and vulnerability unique to snyk. See [#118](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/118/files#diff-afd7474282d01269197c1d3f05651761R166-R172)
  - Updated Diagnostic Message: See [#118](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/118)
    - Number of Known Security Vulnerabilities and Security Advisories for each dependency.
    - Highest Severity of vulnerabilities for each affected Dependency. (`Low`/`Medium`/`High`/`Critical`)
    - Recommended version for dependencies having Known Security Vulnerabilities.
    - Added Snyk attribution “Powered by Snyk” in the source of the Diagnostic. See [#121](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/121)
    - Removed CVE-IDs from message.
- enhancement - Upadated Stack Report UI: See [#142](https://github.com/fabric8-analytics/fabric8-analytics-stack-report-ui/pull/142)
    - Updated Security Issue Card content: See [#142](https://github.com/fabric8-analytics/fabric8-analytics-stack-report-ui/pull/142/commits/37d61cf99c1e198c7f85d004b5009ef35d99ff9c)
        - New headers for Security Issue.
        - Added Transitives as a sub-tab in the particular Direct Dependency.
        - Separate tabs for Commonly Known Vulnerabilities and Vulnerabilities Unique to Snyk.
        - Added Snyk Vulnerability ID in place of CVE-ID.
        - Added Vulnerability Titles with Severity (`Low`/`Medium`/`High`/`Critical`) and removed Tags.
        - Added hyperlink to package name, Snyk Vulnerability ID, and Vulnerability Titles.
    - Dependency Details card rearranged in order of preference.
    - Attribution to Snyk “Powered by Snyk” with a `Sign UP`/`Sign In` Hyperlink to Snyk Login page.
- fixes - Upgraded typescript to fix tsc-watch misbehave. See [#373](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/373)
- fixes - Upgraded node version to 14.x LTS. See [#377](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/377)
- fixes - Quick fixes on hover don't show associated code actions however click on version does. See [#297](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/297)
- fixes - A direct dependency included in manifest should not be shown as transitive dependency. See [#337](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/337)
- fixes - CVE IDs should be hyperlinks to NVD. See [#318](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/318)
- fixes - Visual artifact seen after taking corrective action from lsp. See [#357](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/357)
- fixes - Opening manifest file does not show the scanned results. See [#365](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/365)

## 0.0.13 (September 12th, 2019)

- enhancement - Add python support. See [#308](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/308)
- enhancement - Enable transitive(indirect) dependency report by default. See [#330](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/330)
- enhancement - Show welcome message after upgrading to latest version. See [#334](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/334)
- enhancement - Resolved dependencies are stored in target in workspace root. See [#302](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/302)
- fixes - Dependency Analytics Report not generated if triggered via file explorer. See [#299](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/299)
- fixes - Stop polling for stack-report if it takes any longer than 120 secs. See [#304](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/304) [#338](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/338)  [#352](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/352)
- fixes - Issue with running manifest file without having a workspace. See [#314](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/314)

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
