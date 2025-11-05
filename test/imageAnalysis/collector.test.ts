/* eslint-disable @typescript-eslint/naming-convention */
'use strict';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as exhortServices from '../../src/exhortServices';

const expect = chai.expect;
chai.use(sinonChai);

import { Image, ImageMap, getRange } from '../../src/imageAnalysis/collector';
import { ImageRef } from '@trustify-da/trustify-da-javascript-client';
import { PackageURL } from 'packageurl-js';
import { Range } from 'vscode';
import { globalConfig } from '../../src/config';
import { type IOptions } from '../../src/imageAnalysis';

const imageToPurl: { [key: string]: PackageURL } = {
    'alpine:3.21.3': new PackageURL(
        'oci', null, 'alpine', 'sha256:1c4eef651f65e2f7daee7ee785882ac164b02b78fb74503052a26dc061c90474',
        { 'arch': 'amd64', 'os': 'linux', 'tag': '3.21.3' }, null
    ),
    'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b': new PackageURL(
        'oci', null, 'alpine', 'sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b',
        { 'arch': 'amd64', 'os': 'linux' }, null
    )
};

suite('Image Analysis Collector tests', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(exhortServices, 'parseImageReference').callsFake((img) => ({
            getPackageURL: (): PackageURL => {
                return imageToPurl[img.image];
            }
        } as ImageRef));
    });

    teardown(() => {
        sandbox.restore();
    });

    // Mock image collection, we can't test unpinned images here as they will change over time, resulting in tests that always need updating.
    const reqImages: Image[] = [
        new Image({ value: 'alpine:3.21.3', position: { line: 2, column: 0 } }, 'FROM --platform=linux/amd64 alpine:3.21.3 AS a'),
        new Image({ value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 3, column: 0 } }, 'FROM --platform=linux/amd64 alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b As a'),
    ];
    reqImages.forEach(image => image.platform = 'linux/amd64');

    const options: IOptions = {
        'TRUSTIFY_DA_TOKEN': globalConfig.telemetryId ?? '',
        'TRUSTIFY_DA_SOURCE': globalConfig.utmSource,
        'TRUSTIFY_DA_SYFT_PATH': globalConfig.exhortSyftPath,
        'TRUSTIFY_DA_SYFT_CONFIG_PATH': globalConfig.exhortSyftConfigPath,
        'TRUSTIFY_DA_SKOPEO_PATH': globalConfig.exhortSkopeoPath,
        'TRUSTIFY_DA_SKOPEO_CONFIG_PATH': globalConfig.exhortSkopeoConfigPath,
        'TRUSTIFY_DA_DOCKER_PATH': globalConfig.exhortDockerPath,
        'TRUSTIFY_DA_PODMAN_PATH': globalConfig.exhortPodmanPath,
        'TRUSTIFY_DA_IMAGE_PLATFORM': globalConfig.exhortImagePlatform,
    };

    test('should create map of images', async () => {

        const imageMap = new ImageMap(reqImages, options);

        expect(Object.fromEntries(imageMap.mapper)).to.eql({
            'pkg:oci/alpine@sha256:1c4eef651f65e2f7daee7ee785882ac164b02b78fb74503052a26dc061c90474?arch=amd64&os=linux&tag=3.21.3': [reqImages[0]],
            'pkg:oci/alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b?arch=amd64&os=linux': [reqImages[1]]
        });
    }).timeout(10000);

    test('should create empty image map', async () => {

        const imageMap = new ImageMap([], options);

        expect(Object.keys(imageMap.mapper).length).to.eql(0);
    });

    test('should get image from image map', async () => {

        const imageMap = new ImageMap(reqImages, options);

        expect(JSON.stringify(imageMap.get('pkg:oci/alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b?arch=amd64&os=linux'))).to.eq(JSON.stringify([reqImages[1]]));
    });

    test('should return image range', async () => {
        expect(getRange(reqImages[0])).to.eql(new Range(1, 0, 1, 46));

        expect(getRange(reqImages[1])).to.eql(new Range(2, 0, 2, 111));
    });
}).beforeAll(() => {
    // https://github.com/containers/skopeo/issues/1654
    process.env['TRUSTIFY_DA_SKOPEO_CONFIG_PATH'] = './auth.json';
});
