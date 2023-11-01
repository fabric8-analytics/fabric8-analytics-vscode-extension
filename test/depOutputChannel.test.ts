import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { DepOutputChannel } from '../src/DepOutputChannel';
import { Titles } from '../src/constants';

const expect = chai.expect;
chai.use(sinonChai);

suite('DepOutputChannel module', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('DepOutputChannel should create an OutputChannel if it does not exist', () => {
    const depOutputChannel = new DepOutputChannel();

    expect(depOutputChannel.outputChannel).to.exist;
  });

  test('getOutputChannel should return OutputChannel with default name', () => {
    const depOutputChannel = new DepOutputChannel();

    let outputChannel = depOutputChannel.getOutputChannel();

    expect(outputChannel.name).equals(Titles.EXT_TITLE);
  });

  test('getOutputChannel should return OutputChannel with custom name', () => {
    const depOutputChannel = new DepOutputChannel('Mock Channel');

    let outputChannel = depOutputChannel.getOutputChannel();

    expect(outputChannel.name).equals('Mock Channel');
  });

  test('showOutputChannel should call show() once', () => {
    const depOutputChannel = new DepOutputChannel();
    const showStub = sandbox.stub(depOutputChannel.outputChannel, 'show');

    depOutputChannel.showOutputChannel();

    expect(showStub).to.be.calledOnce;
  });

  test('clearOutputChannel should call clear() once', () => {
    const depOutputChannel = new DepOutputChannel();
    const clearStub = sandbox.stub(depOutputChannel.outputChannel, 'clear');

    depOutputChannel.clearOutputChannel();

    expect(clearStub).to.be.calledOnce;
  });

  test('addMsgOutputChannel should call add() once', () => {
    const depOutputChannel = new DepOutputChannel();
    const appendStub = sandbox.stub(depOutputChannel.outputChannel, 'append');

    depOutputChannel.addMsgOutputChannel('Mock Message');

    expect(appendStub).to.be.calledOnce;
  });
});
