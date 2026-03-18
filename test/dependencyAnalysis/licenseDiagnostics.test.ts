'use strict';

import * as chai from 'chai';
import { DiagnosticSeverity } from 'vscode';

const expect = chai.expect;

import { LicenseDiagnosticsPipeline } from '../../src/dependencyAnalysis/licenseDiagnostics';
import { LicenseFieldPosition } from '../../src/dependencyAnalysis/collector';

suite('License Diagnostics Pipeline tests', () => {
    let pipeline: LicenseDiagnosticsPipeline;

    setup(() => {
        pipeline = new LicenseDiagnosticsPipeline();
    });

    test('should create license mismatch diagnostic when licenses differ', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'MIT',
            position: { line: 4, column: 14 }
        };

        const licenseSummary = {
            projectLicense: {
                manifest: {
                    name: 'MIT',
                    identifiers: [{ id: 'MIT', name: 'MIT License', category: 'PERMISSIVE' }]
                },
                file: {
                    name: 'Apache-2.0',
                    identifiers: [{ id: 'Apache-2.0', name: 'Apache License 2.0', category: 'PERMISSIVE' }]
                },
                mismatch: true
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic?.severity).to.equal(DiagnosticSeverity.Error);
        expect(diagnostic?.message).to.include('License mismatch');
        expect(diagnostic?.message).to.include('MIT');
        expect(diagnostic?.message).to.include('Apache-2.0');
        expect(diagnostic?.code).to.equal('license-mismatch');
    });

    test('should return undefined when no mismatch exists', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'MIT',
            position: { line: 4, column: 14 }
        };

        const licenseSummary = {
            projectLicense: {
                manifest: {
                    name: 'MIT',
                    identifiers: [{ id: 'MIT', name: 'MIT License', category: 'PERMISSIVE' }]
                },
                file: {
                    name: 'MIT',
                    identifiers: [{ id: 'MIT', name: 'MIT License', category: 'PERMISSIVE' }]
                },
                mismatch: false
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.be.undefined;
    });

    test('should return undefined when manifest license is missing', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'MIT',
            position: { line: 4, column: 14 }
        };

        const licenseSummary = {
            projectLicense: {
                file: {
                    name: 'Apache-2.0',
                    identifiers: [{ id: 'Apache-2.0', name: 'Apache License 2.0', category: 'PERMISSIVE' }]
                },
                mismatch: true
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.be.undefined;
    });

    test('should create diagnostic with correct range position', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'GPL-3.0',
            position: { line: 10, column: 20 }
        };

        const licenseSummary = {
            projectLicense: {
                manifest: {
                    name: 'GPL-3.0',
                    identifiers: [{ id: 'GPL-3.0', name: 'GNU General Public License v3.0', category: 'STRONG_COPYLEFT' }]
                },
                file: {
                    name: 'MIT',
                    identifiers: [{ id: 'MIT', name: 'MIT License', category: 'PERMISSIVE' }]
                },
                mismatch: true
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.not.be.undefined;
        // Range should start at line-1 (0-indexed) and column-1 (0-indexed)
        expect(diagnostic?.range.start.line).to.equal(9);
        expect(diagnostic?.range.start.character).to.equal(19);
        // Range should end at start + license value length
        expect(diagnostic?.range.end.character).to.equal(19 + 'GPL-3.0'.length);
    });

    test('should handle license identifiers when extracting names', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'Apache-2.0',
            position: { line: 5, column: 15 }
        };

        const licenseSummary = {
            projectLicense: {
                manifest: {
                    identifiers: [{ id: 'Apache-2.0', name: 'Apache License 2.0', category: 'PERMISSIVE' }]
                },
                file: {
                    identifiers: [{ id: 'MIT', name: 'MIT License', category: 'PERMISSIVE' }]
                },
                mismatch: true
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic?.message).to.include('Apache-2.0');
        expect(diagnostic?.message).to.include('MIT');
    });

    test('should fallback to expression when name is not available', () => {
        const licenseFieldPosition: LicenseFieldPosition = {
            value: 'MIT OR Apache-2.0',
            position: { line: 3, column: 12 }
        };

        const licenseSummary = {
            projectLicense: {
                manifest: {
                    expression: 'MIT OR Apache-2.0'
                },
                file: {
                    expression: 'GPL-3.0'
                },
                mismatch: true
            }
        };

        const diagnostic = pipeline.checkLicenseMismatch(licenseSummary as any, licenseFieldPosition);

        expect(diagnostic).to.not.be.undefined;
        expect(diagnostic?.message).to.include('MIT OR Apache-2.0');
        expect(diagnostic?.message).to.include('GPL-3.0');
    });
});
