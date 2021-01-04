# Change Log

## 0.3.0 (January 4th, 2021)
- enhancement - Support for Golang ecosystem. Plugin can now scan and identify vulnerability within module and package for golang software stacks. See [#436](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/436)
    - Identify direct and transitive vulnerability for modules and packages
    - Support for semver and pseudo version format
    - Provide early access to vulnerability data for modules and packages
    - Highlight and provide vulnerability details using alerts & messages
    - Recommend a non vulnerable version (if available)
- enhancement - Show status bar text based on component analysis status. See [#459](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/459)
    - Notification will be shown only once per manifest in single session.
    - Further changes will be updated only via status bar.
- enhancement - Updated fabric8-analytics-lsp-server to latest version (v[0.4.19](https://www.npmjs.com/package/fabric8-analytics-lsp-server/v/0.4.19)): See [#469](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/469)
    - Golang CA support from LSP. See [#148](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/148)
    - Handle replace directive from go.mod. See [#162](https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/pull/162)
    - Use concise text for CA popup. See [#472](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/472)
- fixes - Propagate errors from lsp server to client. See [#432](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/432)
- fixes - Dependency UTM encoding issue. See [#460](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/pull/460)
- fixes - VsCode Extension: Dependency Details card needs minor improvements. See [#295](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/295)
- fixes - Sort dependencies shown in stack report. See [#260](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/260)
- fixes - Stop showing notification if no security vulnerability found. See [#434](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/434)
- fixes - Extension overrides default keybinding for opening the debugger view. See [#442](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/442)
- fixes - Output log opens everytime requirements.txt is opened. See [#458](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/458)
- fixes - Clear diagnostics before generating new set of diagnostics. See [#465](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/465)

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
