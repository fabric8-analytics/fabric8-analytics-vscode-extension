/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
'use strict';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import * as exhortServices from '../../src/exhortServices';
import { executeImageAnalysis } from '../../src/imageAnalysis/analysis';
import { Uri } from 'vscode';
import { IImage } from '../../src/imageAnalysis/collector';
import { type IOptions } from '../../src/imageAnalysis';

const expect = chai.expect;
chai.use(sinonChai);

/**
 * Creates a mock IExhortAnalysisReport with a single provider/source
 * using the given SourceSummary fields.
 */
function createMockReport(imageRef: string, summary: Record<string, number>) {
  return {
    [imageRef]: {
      providers: {
        'test-provider': {
          status: { ok: true },
          sources: {
            'test-source': {
              summary: {
                total: 0,
                direct: 0,
                transitive: 0,
                dependencies: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                unknown: 0,
                remediations: 0,
                recommendations: 0,
                ...summary,
              },
              dependencies: [],
            },
          },
        },
      },
    },
  };
}

suite('Image Analysis - getHighestSeverity', () => {
  let sandbox: sinon.SinonSandbox;

  const mockUri = Uri.file('/mock/path');
  const mockOptions = {} as IOptions;
  const mockImages: IImage[] = [
    {
      name: { value: 'test-image:latest', position: { line: 0, column: 0 } },
      line: 'FROM test-image:latest',
      platform: undefined,
    },
  ];

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  /// Verifies that getHighestSeverity returns 'UNKNOWN' when only unknown-severity vulnerabilities exist.
  test('should return UNKNOWN when only unknown severity vulnerabilities exist', async () => {
    // Given a report where only unknown > 0
    const mockReport = createMockReport('test-image:latest', { unknown: 3 });
    sandbox.stub(exhortServices, 'imageAnalysisService').resolves(mockReport as any);

    // When executing image analysis
    const response = await executeImageAnalysis(mockUri, mockImages, mockOptions);

    // Then the highest severity should be UNKNOWN
    const imageDataArray = response.images.get('test-image:latest');
    expect(imageDataArray).to.not.be.undefined;
    expect(imageDataArray!).to.have.lengthOf(1);
    expect(imageDataArray![0].highestVulnerabilitySeverity).to.equal('UNKNOWN');
  });

  /// Verifies that getHighestSeverity returns 'LOW' when both low and unknown vulnerabilities exist (LOW outranks UNKNOWN).
  test('should return LOW when both low and unknown vulnerabilities exist', async () => {
    // Given a report where both low and unknown > 0
    const mockReport = createMockReport('test-image:latest', { low: 1, unknown: 2 });
    sandbox.stub(exhortServices, 'imageAnalysisService').resolves(mockReport as any);

    // When executing image analysis
    const response = await executeImageAnalysis(mockUri, mockImages, mockOptions);

    // Then the highest severity should be LOW (outranks UNKNOWN)
    const imageDataArray = response.images.get('test-image:latest');
    expect(imageDataArray).to.not.be.undefined;
    expect(imageDataArray![0].highestVulnerabilitySeverity).to.equal('LOW');
  });

  /// Verifies that getHighestSeverity returns 'NONE' when no severity counts are present.
  test('should return NONE when no vulnerabilities exist', async () => {
    // Given a report where all severity counts are 0
    const mockReport = createMockReport('test-image:latest', {});
    sandbox.stub(exhortServices, 'imageAnalysisService').resolves(mockReport as any);

    // When executing image analysis
    const response = await executeImageAnalysis(mockUri, mockImages, mockOptions);

    // Then the highest severity should be NONE
    const imageDataArray = response.images.get('test-image:latest');
    expect(imageDataArray).to.not.be.undefined;
    expect(imageDataArray![0].highestVulnerabilitySeverity).to.equal('NONE');
  });
});
