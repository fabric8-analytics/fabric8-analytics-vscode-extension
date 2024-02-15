import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { rewireProvider } from './utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('StackAnalysis module', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('exhort services test', async () => {

        const fakeStackAnalysisReportHtml = '<html>fake report</html>';
        let defaultComponentMock = {
            default: {
                stackAnalysis: async () => fakeStackAnalysisReportHtml
            }
        };

        let javaMvnProviderRewire = await rewireProvider("out/src/exhortServices")
        javaMvnProviderRewire.__Rewire__('exhort_javascript_api_1', defaultComponentMock)

        const result = await javaMvnProviderRewire.stackAnalysisService('path/to/manifest', {});

        expect(result).to.equal(fakeStackAnalysisReportHtml);
    });
});