Feature: npm tests with vulns
    As a user I want to see vulnerabilities in my npm manifest file
    Scenario: run ui tests on npm ecosystem with vulns
        Given manifests1 folder ia added into workspace 
        When I open package.json file into editor
        Then I Should be able to see it in editor
        And I should clear all other tabs opened in editor

    Scenario: package.json is opened in editor
        When I open notifiacations view
        Then I Should not see a notifiacation triggered by extension

    Scenario: Check for SA in editor triggered from statusbar
        Given CA is successfully triggered
        And package.json is present in editor
        When I click on statusbar button
        Then I Should be able to click on it
        And I should wait for 30 seconds
        And I should confirm that detailed report is opened in editor
        And I should close all tabs except package.json file
        And I should delete target folder if created

    Scenario: Check for SA in editor triggered from PIE button
        Given CA is successfully triggered
        And package.json is present in editor
        When I click on PIE button
        Then I Should be able to click on it
        And I should wait for 30 seconds
        And I should confirm that detailed report is opened in editor
        And I should close all tabs except package.json file
        And I should delete target folder if created
        And close all tabs opened in editor

    