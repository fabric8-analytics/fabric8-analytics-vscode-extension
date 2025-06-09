/* eslint-disable @typescript-eslint/no-unused-expressions */
'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

import * as config from '../src/config';
import { RHDA_DIAGNOSTIC_SOURCE } from '../src/constants';
import * as codeActionHandler from '../src/codeActionHandler';
import { CodeAction, CodeActionKind, Diagnostic, Position, Range, Uri, WorkspaceEdit } from 'vscode';

suite('Code Action Handler tests', () => {

    const mockUri = Uri.file('mock/path');
    const mockLoc = 'mockLocation';
    const mockCodeAction = { title: 'Mock Action' };

    const mockRange0: Range = new Range(
        new Position(123, 123), new Position(456, 456)
    );

    const mockRange1: Range = new Range(
        new Position(321, 321),
        new Position(654, 654)
    );

    const mockDiagnostic0: Diagnostic[] = [
        {
            severity: 1,
            range: mockRange0,
            message: 'mock message',
            source: RHDA_DIAGNOSTIC_SOURCE,
        }
    ];

    const mockDiagnostic1: Diagnostic[] = [
        {
            severity: 3,
            range: mockRange1,
            message: 'another mock message',
            source: 'mockSource',
        }
    ];

    test('should register code action in codeActionsMap under URI and location keys', () => {
        codeActionHandler.registerCodeAction(mockUri, mockLoc, mockCodeAction);

        expect(codeActionHandler.getCodeActionsMap().get(mockUri.toString())?.get(mockLoc)).to.deep.equal([mockCodeAction]);
    });

    test('should remove code action from codeActionsMap under URI and location keys', () => {
        expect(codeActionHandler.getCodeActionsMap().get(mockUri.toString())?.get(mockLoc)).to.deep.equal([mockCodeAction]);

        codeActionHandler.clearCodeActionsMap(mockUri);

        expect(codeActionHandler.getCodeActionsMap().has(mockUri.toString())).to.be.false;
    });

    test('should register code actions in codeActionsMap for same URI key and same location key', () => {
        const codeAction1 = { title: 'Mock Action1' };
        const codeAction2 = { title: 'Mock Action2' };
        codeActionHandler.registerCodeAction(mockUri, mockLoc, codeAction1);
        codeActionHandler.registerCodeAction(mockUri, mockLoc, codeAction2);

        expect(codeActionHandler.getCodeActionsMap().get(mockUri.toString())?.get(mockLoc)).to.deep.equal([codeAction1, codeAction2]);
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should register code actions in codeActionsMap for same URI key and different location keys', () => {
        const loc1 = 'mockLocation/1';
        const loc2 = 'mockLocation/2';
        const codeAction1 = { title: 'Mock Action1' };
        const codeAction2 = { title: 'Mock Action2' };
        codeActionHandler.registerCodeAction(mockUri, loc1, codeAction1);
        codeActionHandler.registerCodeAction(mockUri, loc2, codeAction2);

        expect(codeActionHandler.getCodeActionsMap().get(mockUri.toString())?.get(loc1)).to.deep.equal([codeAction1]);
        expect(codeActionHandler.getCodeActionsMap().get(mockUri.toString())?.get(loc2)).to.deep.equal([codeAction2]);
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should register code actions in codeActionsMap for different URI keys', () => {
        const uri1 = Uri.file('mock/path/1');
        const uri2 = Uri.file('mock/path/2');
        const loc1 = 'mockLocation/1';
        const loc2 = 'mockLocation/2';
        const codeAction1 = { title: 'Mock Action1' };
        const codeAction2 = { title: 'Mock Action2' };
        codeActionHandler.registerCodeAction(uri1, loc1, codeAction1);
        codeActionHandler.registerCodeAction(uri2, loc2, codeAction2);

        expect(codeActionHandler.getCodeActionsMap().get(uri1.toString())?.get(loc1)).to.deep.equal([codeAction1]);
        expect(codeActionHandler.getCodeActionsMap().get(uri2.toString())?.get(loc2)).to.deep.equal([codeAction2]);
        codeActionHandler.clearCodeActionsMap(uri1);
        codeActionHandler.clearCodeActionsMap(uri2);
    });

    test('should return an empty array if no RHDA diagnostics are present and full stack analysis action is provided', () => {
        const diagnostics: Diagnostic[] = [];
        config.globalConfig.stackAnalysisCommand = 'mockStackAnalysisCommand';

        const codeActions = codeActionHandler.getDiagnosticsCodeActions(diagnostics, mockUri);

        expect(codeActions).to.be.an('array').that.is.empty;
    });

    test('should return an empty array if no RHDA diagnostics are present and full stack analysis action is not provided', () => {
        const diagnostics: Diagnostic[] = [];
        config.globalConfig.stackAnalysisCommand = '';

        const codeActions = codeActionHandler.getDiagnosticsCodeActions(diagnostics, mockUri);

        expect(codeActions).to.be.an('array').that.is.empty;
    });

    test('should return an empty array if RHDA diagnostics are present but  no matching URI is found in codeActionsMap', () => {
        const uri1 = Uri.file('mock/path/1');
        codeActionHandler.registerCodeAction(mockUri, mockLoc, mockCodeAction);

        config.globalConfig.stackAnalysisCommand = 'mockStackAnalysisCommand';

        const codeActions = codeActionHandler.getDiagnosticsCodeActions(mockDiagnostic1, uri1);

        expect(codeActions).to.be.an('array').that.is.empty;
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should return an empty array if RHDA diagnostics are present but no matching code actions are found', () => {
        codeActionHandler.registerCodeAction(mockUri, mockLoc, mockCodeAction);

        config.globalConfig.stackAnalysisCommand = 'mockStackAnalysisCommand';

        const codeActions = codeActionHandler.getDiagnosticsCodeActions(mockDiagnostic1, mockUri);

        expect(codeActions).to.be.an('array').that.is.empty;
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should generate code actions for RHDA diagnostics without full stack analysis action setting in globalConfig', async () => {
        const loc = `${mockDiagnostic0[0].range.start.line}|${mockDiagnostic0[0].range.start.character}`;
        codeActionHandler.registerCodeAction(mockUri, loc, mockCodeAction);

        config.globalConfig.stackAnalysisCommand = '';

        const codeActions: CodeAction[] = codeActionHandler.getDiagnosticsCodeActions(mockDiagnostic0, mockUri);

        expect(codeActions).to.deep.equal([mockCodeAction]);
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should generate code actions for RHDA diagnostics without RHDA Diagonostic source', async () => {
        const loc = `${mockDiagnostic1[0].range.start.line}|${mockDiagnostic1[0].range.start.character}`;
        codeActionHandler.registerCodeAction(mockUri, loc, mockCodeAction);

        config.globalConfig.stackAnalysisCommand = 'mockStackAnalysisCommand';

        const codeActions: CodeAction[] = codeActionHandler.getDiagnosticsCodeActions(mockDiagnostic1, mockUri);

        expect(codeActions).to.deep.equal([mockCodeAction]);
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should generate code actions for RHDA diagnostics with full stack analysis action', async () => {
        const loc = `${mockDiagnostic0[0].range.start.line}|${mockDiagnostic0[0].range.start.character}`;
        codeActionHandler.registerCodeAction(mockUri, loc, mockCodeAction);

        config.globalConfig.stackAnalysisCommand = 'mockStackAnalysisCommand';

        const codeActions: CodeAction[] = codeActionHandler.getDiagnosticsCodeActions(mockDiagnostic0, mockUri);

        expect(codeActions).to.deep.equal(
            [
                mockCodeAction,
                {
                    title: 'Detailed Vulnerability Report',
                    kind: CodeActionKind.QuickFix,
                    command: {
                        title: 'Analytics Report',
                        command: 'mockStackAnalysisCommand',
                        arguments: ['', true]
                    }
                }
            ]
        );
        codeActionHandler.clearCodeActionsMap(mockUri);
    });

    test('should return a switch to recommended version code action', async () => {
        config.globalConfig.trackRecommendationAcceptanceCommand = 'mockTrackRecommendationAcceptanceCommand';

        const edit = new WorkspaceEdit();
        const uri = Uri.file('mock/path/pom.xml');
        edit.insert(uri, mockDiagnostic1[0].range.start, 'mockVersionReplacementString');
        const codeAction: CodeAction = codeActionHandler.generateSwitchToRecommendedVersionAction('mockTitle', 'mockPackage@mockversion', 'mockVersionReplacementString', mockDiagnostic1[0], uri);
        expect(codeAction).to.deep.equal(
            {
                'command': {
                    'command': 'mockTrackRecommendationAcceptanceCommand',
                    'title': 'Track recommendation acceptance',
                    'arguments': [
                        'mockPackage@mockversion',
                        'pom.xml'
                    ]
                },
                'diagnostics': [
                    {
                        'message': 'another mock message',
                        'range': mockDiagnostic1[0].range,
                        'severity': 3,
                        'source': 'mockSource'
                    }
                ],
                'edit': edit,
                'kind': { 'value': 'quickfix' },
                'title': 'mockTitle'
            }
        );
    });

    test('should return a redirect to recommended version code action for Dockerfile', async () => {
        config.globalConfig.trackRecommendationAcceptanceCommand = 'mockTrackRecommendationAcceptanceCommand';

        const codeAction: CodeAction = codeActionHandler.generateRedirectToRecommendedVersionAction('mockTitle', 'mockImage@mockTag', mockDiagnostic1[0], Uri.file('mock/path/Dockerfile'));
        expect(codeAction).to.deep.equal(
            {
                'command': {
                    'command': 'mockTrackRecommendationAcceptanceCommand',
                    'title': 'Track recommendation acceptance',
                    'arguments': [
                        'mockImage@mockTag',
                        'Dockerfile'
                    ]
                },
                'diagnostics': [
                    {
                        'message': 'another mock message',
                        'range': new Range(321, 321, 654, 654),
                        'severity': 3,
                        'source': 'mockSource'
                    }
                ],
                'kind': { 'value': 'quickfix' },
                'title': 'mockTitle'
            }
        );
    });

    test('should return a redirect to recommended version code action for Containerfile', async () => {
        config.globalConfig.trackRecommendationAcceptanceCommand = 'mockTrackRecommendationAcceptanceCommand';

        const codeAction: CodeAction = codeActionHandler.generateRedirectToRecommendedVersionAction('mockTitle', 'mockImage@mockTag', mockDiagnostic1[0], Uri.file('mock/path/Containerfile'));
        expect(codeAction).to.deep.equal(
            {
                'command': {
                    'command': 'mockTrackRecommendationAcceptanceCommand',
                    'title': 'Track recommendation acceptance',
                    'arguments': [
                        'mockImage@mockTag',
                        'Containerfile'
                    ]
                },
                'diagnostics': [
                    {
                        'message': 'another mock message',
                        'range': new Range(321, 321, 654, 654),
                        'severity': 3,
                        'source': 'mockSource'
                    }
                ],
                'kind': { 'value': 'quickfix' },
                'title': 'mockTitle'
            }
        );
    });
});