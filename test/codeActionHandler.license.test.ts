'use strict';

import * as chai from 'chai';
import { CodeActionKind, Diagnostic, DiagnosticSeverity, Position, Range, Uri } from 'vscode';

const expect = chai.expect;

import { generateUpdateManifestLicenseAction } from '../src/codeActionHandler';
import { RHDA_DIAGNOSTIC_SOURCE } from '../src/constants';

suite('License Code Action Handler tests', () => {
    const mockUri = Uri.file('/path/to/package.json');
    const mockRange = new Range(
        new Position(3, 13),
        new Position(3, 16)
    );

    test('should generate update manifest license action for package.json', () => {
        const fileLicense = 'Apache-2.0';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange,
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, mockUri);

        expect(action).to.not.be.undefined;
        expect(action.title).to.equal('Update manifest license to "Apache-2.0" (from LICENSE file)');
        expect(action.kind).to.equal(CodeActionKind.QuickFix);
        expect(action.diagnostics).to.include(diagnostic);
        expect(action.edit).to.not.be.undefined;
    });

    test('should generate update manifest license action for pom.xml', () => {
        const pomUri = Uri.file('/path/to/pom.xml');
        const fileLicense = 'MIT';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange,
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, pomUri);

        expect(action).to.not.be.undefined;
        expect(action.title).to.equal('Update manifest license to "MIT" (from LICENSE file)');
        expect(action.kind).to.equal(CodeActionKind.QuickFix);
    });

    test('should include diagnostic in code action', () => {
        const fileLicense = 'GPL-3.0';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange,
            message: 'License mismatch: manifest declares "MIT" but LICENSE file contains "GPL-3.0"',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, mockUri);

        expect(action.diagnostics).to.have.lengthOf(1);
        expect(action.diagnostics?.[0]).to.equal(diagnostic);
    });

    test('should create workspace edit with correct replacement for JSON files', () => {
        const fileLicense = 'BSD-3-Clause';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange,
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, mockUri);

        expect(action.edit).to.not.be.undefined;
        const entries = action.edit!.entries();
        expect(entries).to.have.lengthOf(1);

        const [uri, edits] = entries[0];
        expect(uri.toString()).to.equal(mockUri.toString());
        expect(edits).to.have.lengthOf(1);
        // The range covers only the value text, not the surrounding quotes
        expect(edits[0].newText).to.equal('BSD-3-Clause');
    });

    test('should create workspace edit with correct replacement for XML files', () => {
        const pomUri = Uri.file('/path/to/pom.xml');
        const fileLicense = 'Apache-2.0';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange,
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, pomUri);

        expect(action.edit).to.not.be.undefined;
        const entries = action.edit!.entries();
        expect(entries).to.have.lengthOf(1);

        const [uri, edits] = entries[0];
        expect(uri.toString()).to.equal(pomUri.toString());
        expect(edits).to.have.lengthOf(1);
        // The range covers only the value text, not the surrounding XML tags
        expect(edits[0].newText).to.equal('Apache-2.0');
    });

    test('should use correct range from diagnostic', () => {
        const customRange = new Range(
            new Position(10, 20),
            new Position(10, 25)
        );
        const fileLicense = 'LGPL-3.0';
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: customRange,
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };

        const action = generateUpdateManifestLicenseAction(fileLicense, diagnostic, mockUri);

        const entries = action.edit!.entries();
        const [, edits] = entries[0];
        expect(edits[0].range.start.line).to.equal(10);
        expect(edits[0].range.start.character).to.equal(20);
        expect(edits[0].range.end.line).to.equal(10);
        expect(edits[0].range.end.character).to.equal(25);
    });

    test('should not add quotes for JSON or tags for XML - range already excludes them', () => {
        // Test JSON file
        const jsonUri = Uri.file('/path/to/package.json');
        const jsonDiag: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange, // This range points to just the value text: MIT
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };
        const jsonAction = generateUpdateManifestLicenseAction('Apache-2.0', jsonDiag, jsonUri);
        const jsonEdits = jsonAction.edit!.entries()[0][1];

        // Should replace MIT with Apache-2.0 (no quotes added)
        // Because the range covers: "MIT" -> just MIT, not the quotes
        expect(jsonEdits[0].newText).to.equal('Apache-2.0');

        // Test XML file
        const xmlUri = Uri.file('/path/to/pom.xml');
        const xmlDiag: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: mockRange, // This range points to just the value text: MIT
            message: 'License mismatch',
            source: RHDA_DIAGNOSTIC_SOURCE,
            code: 'license-mismatch'
        };
        const xmlAction = generateUpdateManifestLicenseAction('GPL-3.0', xmlDiag, xmlUri);
        const xmlEdits = xmlAction.edit!.entries()[0][1];

        // Should replace MIT with GPL-3.0 (no tags added)
        // Because the range covers: <name>MIT</name> -> just MIT, not the tags
        expect(xmlEdits[0].newText).to.equal('GPL-3.0');

        // Both JSON and XML should get the same treatment: just the value
        expect(jsonEdits[0].newText).to.not.include('"');
        expect(xmlEdits[0].newText).to.not.include('<');
    });
});
