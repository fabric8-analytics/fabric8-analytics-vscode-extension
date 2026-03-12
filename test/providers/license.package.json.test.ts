'use strict';

import * as chai from 'chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/package.json';

suite('package.json License Field Position Extraction tests', () => {
    let dependencyProvider: DependencyProvider;

    setup(() => {
        dependencyProvider = new DependencyProvider();
    });

    test('should extract license field position from valid package.json', () => {
        const contents = `{
  "name": "test-package",
  "version": "1.0.0",
  "license": "MIT"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('MIT');
        expect(result?.position.line).to.equal(4);
        expect(result?.position.column).to.equal(14);
    });

    test('should extract license field position with different formatting', () => {
        const contents = `{
  "name": "test-package",
  "license":    "Apache-2.0",
  "version": "1.0.0"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('Apache-2.0');
        expect(result?.position.line).to.equal(3);
    });

    test('should return undefined when no license field exists', () => {
        const contents = `{
  "name": "test-package",
  "version": "1.0.0"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should return undefined for invalid JSON', () => {
        const contents = `{
  "name": "test-package",
  "license": "MIT"
  "version": "1.0.0"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should handle license field with complex SPDX expression', () => {
        const contents = `{
  "name": "test-package",
  "version": "1.0.0",
  "license": "(MIT OR Apache-2.0)"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('(MIT OR Apache-2.0)');
    });

    test('should handle license field in different positions', () => {
        const contents = `{
  "license": "GPL-3.0",
  "name": "test-package",
  "version": "1.0.0"
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('GPL-3.0');
        expect(result?.position.line).to.equal(2);
    });

    test('should return undefined when license is not a string', () => {
        const contents = `{
  "name": "test-package",
  "version": "1.0.0",
  "license": {
    "type": "MIT"
  }
}`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });
});
