'use strict';

import * as chai from 'chai';
import { Uri } from 'vscode';

const expect = chai.expect;

import { CANotification, CANotificationData } from '../src/caNotification';

suite('CA Notification License Support tests', () => {
    const mockUri = Uri.file('/path/to/package.json');

    test('should include incompatible license count in notification', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 5,
            vulns: new Set(['CVE-2021-1234']),
            incompatibleLicenseCount: 3
        };

        const notification = new CANotification(data);

        expect(notification.hasWarning()).to.be.true;
    });

    test('should generate status text with vulnerabilities and licenses', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 5,
            vulns: new Set(['CVE-2021-1234', 'CVE-2021-5678']),
            incompatibleLicenseCount: 2
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('2 vulnerabilities');
        expect(statusText).to.include('2 incompatible licenses');
    });

    test('should use singular form for single incompatible license', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 2,
            vulns: new Set(['CVE-2021-1234']),
            incompatibleLicenseCount: 1
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('1 vulnerability');
        expect(statusText).to.include('1 incompatible license');
    });

    test('should handle only license warnings without vulnerabilities', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 3,
            vulns: new Set(),
            incompatibleLicenseCount: 3
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('3 incompatible licenses');
        expect(statusText).to.not.include('vulnerabilities');
    });

    test('should handle only vulnerabilities without license warnings', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 2,
            vulns: new Set(['CVE-2021-1234', 'CVE-2021-5678']),
            incompatibleLicenseCount: 0
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('2 vulnerabilities');
        expect(statusText).to.not.include('licenses');
    });

    test('should handle null incompatible license count', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 1,
            vulns: new Set(['CVE-2021-1234']),
            incompatibleLicenseCount: null
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('1 vulnerability');
        expect(statusText).to.not.include('licenses');
    });

    test('should handle undefined incompatible license count', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 1,
            vulns: new Set(['CVE-2021-1234'])
        };

        const notification = new CANotification(data);
        const statusText = notification.statusText();

        expect(statusText).to.include('1 vulnerability');
        expect(statusText).to.not.include('licenses');
    });

    test('should generate popup text with both vulnerabilities and licenses', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 7,
            vulns: new Set(['CVE-2021-1234', 'CVE-2021-5678', 'CVE-2021-9012']),
            incompatibleLicenseCount: 4
        };

        const notification = new CANotification(data);
        const popupText = notification.popupText();

        expect(popupText).to.include('3');
        expect(popupText).to.include('vulnerabilities');
        expect(popupText).to.include('4');
        expect(popupText).to.include('incompatible');
        expect(popupText).to.include('licenses');
        expect(popupText).to.include('/path/to/package.json');
    });

    test('should not show warning when no issues exist', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 0,
            vulns: new Set(),
            incompatibleLicenseCount: 0
        };

        const notification = new CANotification(data);

        expect(notification.hasWarning()).to.be.false;
    });

    test('should show warning when only licenses are incompatible', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 2,
            vulns: new Set(),
            incompatibleLicenseCount: 2
        };

        const notification = new CANotification(data);

        expect(notification.hasWarning()).to.be.true;
    });

    test('should show warning when both vulnerabilities and licenses exist', () => {
        const data: CANotificationData = {
            done: true,
            uri: mockUri,
            diagCount: 5,
            vulns: new Set(['CVE-2021-1234']),
            incompatibleLicenseCount: 2
        };

        const notification = new CANotification(data);

        expect(notification.hasWarning()).to.be.true;
    });
});
