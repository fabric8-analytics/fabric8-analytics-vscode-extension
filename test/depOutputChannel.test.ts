import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { DepOutputChannel } from '../src/DepOutputChannel';

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

  test('getOutputChannel should return OutputChannel with Dependency Analytics', () => {
    const depOutputChannel = new DepOutputChannel();
    let outputChannel = depOutputChannel.getOutputChannel();
    expect(outputChannel.name).equals('Dependency Analytics');
  });

  test('getOutputChannel should return OutputChannel with custom name', () => {
    const depOutputChannel = new DepOutputChannel('test channel');
    let outputChannel = depOutputChannel.getOutputChannel();
    expect(outputChannel.name).equals('test channel');
  });
});
