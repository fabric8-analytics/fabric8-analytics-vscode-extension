'use strict';

import * as chai from 'chai';

const expect = chai.expect;

import { isRedHatSource, isRhlwSource } from '../../src/dependencyAnalysis/sourceDetection';

suite('Source Detection tests', () => {

    suite('isRedHatSource', () => {
        test('should return true for source containing "redhat"', () => {
            expect(isRedHatSource('redhat-tpa')).to.be.true;
        });

        test('should return true for source containing "RedHat" (case-insensitive)', () => {
            expect(isRedHatSource('RedHat-TPA')).to.be.true;
        });

        test('should return true for source containing "rhlw"', () => {
            expect(isRedHatSource('rhlw-scanner')).to.be.true;
        });

        test('should return true for source containing "RHLW" (case-insensitive)', () => {
            expect(isRedHatSource('RHLW-Scanner')).to.be.true;
        });

        test('should return false for non-Red Hat source', () => {
            expect(isRedHatSource('osv')).to.be.false;
        });

        test('should return false for empty string', () => {
            expect(isRedHatSource('')).to.be.false;
        });
    });

    suite('isRhlwSource', () => {
        test('should return true for source containing "rhlw"', () => {
            expect(isRhlwSource('rhlw-scanner')).to.be.true;
        });

        test('should return true for source containing "RHLW" (case-insensitive)', () => {
            expect(isRhlwSource('RHLW-Scanner')).to.be.true;
        });

        test('should return false for "redhat" source without "rhlw"', () => {
            expect(isRhlwSource('redhat-tpa')).to.be.false;
        });

        test('should return false for non-RHLW source', () => {
            expect(isRhlwSource('osv')).to.be.false;
        });

        test('should return false for empty string', () => {
            expect(isRhlwSource('')).to.be.false;
        });
    });
});
