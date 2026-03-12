'use strict';

import * as chai from 'chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/pom.xml';

suite('pom.xml License Field Position Extraction tests', () => {
    let dependencyProvider: DependencyProvider;

    setup(() => {
        dependencyProvider = new DependencyProvider();
    });

    test('should extract license name position from valid pom.xml', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
        <license>
            <name>MIT</name>
        </license>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('MIT');
        expect(result?.position.line).to.equal(5);
    });

    test('should extract Apache license position', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
        <license>
            <name>Apache-2.0</name>
        </license>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('Apache-2.0');
    });

    test('should return undefined when no license element exists', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <groupId>com.example</groupId>
    <artifactId>test</artifactId>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should return undefined for invalid XML', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
        <license>
            <name>MIT
        </license>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });

    test('should handle multiple licenses and return first one', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
        <license>
            <name>MIT</name>
        </license>
        <license>
            <name>Apache-2.0</name>
        </license>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        expect(result?.value).to.equal('MIT');
    });

    test('should handle license with whitespace', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
        <license>
            <name>
                Apache-2.0
            </name>
        </license>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.not.be.undefined;
        // XML parser may trim whitespace
        expect(result?.value).to.include('Apache-2.0');
    });

    test('should return undefined when licenses element is empty', () => {
        const contents = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <licenses>
    </licenses>
</project>`;
        const result = dependencyProvider.extractLicensePosition?.(contents);

        expect(result).to.be.undefined;
    });
});
