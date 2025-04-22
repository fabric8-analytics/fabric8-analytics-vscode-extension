/* eslint-disable @typescript-eslint/no-unused-expressions */
'use strict';


import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

import * as utils from '../src/utils';

suite('Utils tests', () => {

    test('should return true when all keys are defined in the object (with key request)', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(utils.isDefined(obj, 'a', 'b', 'c')).to.be.true;
    });

    test('should return true when all keys are defined in the object (without key requests)', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(utils.isDefined(obj)).to.be.true;
    });

    test('should return false if any key is not defined in the object', () => {
        const obj = {
            a: {
                b: {
                    c: 10,
                },
            },
        };
        expect(utils.isDefined(obj, 'a', 'b', 'd')).to.be.false;
    });

    test('should return false if the object itself is not defined', () => {
        const obj = null;
        expect(utils.isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });

    test('should return false if any intermediate key in the object chain is not defined', () => {
        const obj = {
            a: {
                b: null
            },
        };
        expect(utils.isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });

    test('should return false if any intermediate key in the object chain is undefined', () => {
        const obj = {
            a: {
                b: undefined
            },
        };
        expect(utils.isDefined(obj, 'a', 'b', 'c')).to.be.false;
    });
});