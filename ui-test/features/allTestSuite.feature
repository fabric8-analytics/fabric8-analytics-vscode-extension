Feature: Automated Tests - PR
    Scenario: setup and run UI tests on all ecosystems
        Given new vscode instance is opened 
        And webdriver is also running
        And extension is bundeled successfully by vscode-extension-tester
        And manifests folder is added in workspace
        When I check for manifests folder in workspace
        Then I Should be able to see it

    Scenario: statusbar button absent before opening manifest file
        When I see statusbar button 
        Then it should be absent

    Scenario: test for ecosystems with vulns
        Given manifests folder is successfully added into workspace
        When I run ui tests on manifest files
        Then I Should be able see result as expected

    Scenario: change workspace folder
        Given vscode instance is running
        When I should be able to add manifests1 folder into workspace
        Then I Should be able to remove manifests folder

    Scenario: workspace should not be null
        When I check for sections
        Then it should not be empty

    Scenario: test for ecosystems without vulns
        Given manifests1 folder is successfully added into workspace
        When I run ui tests on manifest files
        Then I Should be able see result as expected

    Scenario: statusbar button absent before opening manifest file
        When I try to click on PIE button
        Then it should be absent
