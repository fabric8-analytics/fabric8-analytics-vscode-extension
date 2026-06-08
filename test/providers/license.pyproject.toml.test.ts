'use strict';

import * as chai from 'chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/pyproject.toml';

suite('pyproject.toml License Field Position Extraction tests', () => {
    let dependencyProvider: DependencyProvider;

    setup(() => {
        dependencyProvider = new DependencyProvider();
    });

    test('should extract license from Poetry-style [tool.poetry] section', () => {
        const contents = `[tool.poetry]
name = "my-package"
version = "1.0.0"
license = "MIT"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('MIT');
        expect(result?.position.line).to.equal(4);
        expect(result?.position.column).to.equal(12);
    });

    test('should extract license from PEP 639-style [project] section (simple string)', () => {
        const contents = `[project]
name = "my-package"
version = "1.0.0"
license = "Apache-2.0"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('Apache-2.0');
        expect(result?.position.line).to.equal(4);
        expect(result?.position.column).to.equal(12);
    });

    test('should extract license from PEP 621-style [project] section (inline table with text key)', () => {
        const contents = `[project]
name = "my-package"
version = "1.0.0"
license = {text = "GPL-3.0"}
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('GPL-3.0');
        expect(result?.position.line).to.equal(4);
        expect(result?.position.column).to.equal(20);
    });

    test('should return undefined when no license field is present', () => {
        const contents = `[project]
name = "my-package"
version = "1.0.0"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should return undefined for invalid TOML', () => {
        const contents = `[project
name = "my-package"
license = "MIT"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should return undefined when PEP 621 inline table has no text key', () => {
        const contents = `[project]
name = "my-package"
license = {file = "LICENSE"}
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should prefer [project] license over [tool.poetry] when both are present', () => {
        const contents = `[project]
name = "my-package"
license = "BSD-3-Clause"

[tool.poetry]
license = "MIT"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('BSD-3-Clause');
        expect(result?.position.line).to.equal(3);
    });

    test('should prefer [project] license even when [tool.poetry] appears first', () => {
        const contents = `[tool.poetry]
name = "my-package"
license = "MIT"

[project]
name = "my-package"
license = "BSD-3-Clause"
`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('BSD-3-Clause');
        expect(result?.position.line).to.equal(7);
    });
});
