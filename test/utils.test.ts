/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { settingNameMappings } from '../src/constants';
import { applySettingNameMappings, isDefined } from '../src/utils';

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

    test('should return true when all keys are defined in the object (with key request)', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(isDefined(obj, 'a', 'b', 'c')).to.be.true;
    });

    test('should return true when all keys are defined in the object (without key requests)', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(isDefined(obj)).to.be.true;
    });

    test('should return false if any key is not defined in the object', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(isDefined(obj, 'a', 'b', 'd')).to.be.false;
    });

    test('should return false if the object itself is not defined', () => {
        const obj = null;
        expect(isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });

    test('should return false if any intermediate key in the object chain is not defined', () => {
        const obj = {
            a: {
                b: null
            },
        };
        expect(isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });

    test('should return false if any intermediate key in the object chain is undefined', () => {
        const obj = {
            a: {
                b: undefined
            },
        };
        expect(isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });
});
