import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { settingNameMappings } from '../src/constants';
import { applySettingNameMappings } from '../src/utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('Utils module', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should return a string with applied mappings', () => {

        Object.keys(settingNameMappings).forEach(key => {
            const message = `The ${key} variable should be set.`;
            const expectedMessage = `The ${settingNameMappings[key]} variable should be set.`;

            const result = applySettingNameMappings(message);

            expect(result).to.equal(expectedMessage);
        });
    });

    test('should handle multiple occurrences of mapping keys', () => {

        Object.keys(settingNameMappings).forEach(key => {
            const message = `Please ensure the ${key} is properly configured. Set ${key} to true.`;
            const expectedMessage = `Please ensure the ${settingNameMappings[key]} is properly configured. Set ${settingNameMappings[key]} to true.`;

            const result = applySettingNameMappings(message);

            expect(result).to.equal(expectedMessage);
        });
    });

    test('should not modify the message if no mappings apply', () => {
        const message = 'This message does not contain any mapping keys.';

        const result = applySettingNameMappings(message);

        expect(result).to.equal(message);
    });
});
