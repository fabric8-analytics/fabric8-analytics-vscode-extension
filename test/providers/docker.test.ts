'use strict';

import { ImageProvider } from '../../src/providers/docker';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

let dependencyProvider: ImageProvider;
suite('Docker Image parser tests', () => {
    test('tests empty file', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps).is.eql([]);
    });

    test('tests valid file', async () => {
        const deps = dependencyProvider.collect(`
FROM alpine
FROM alpine:latest
FROM alpine:1.2.3
FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine', position: { line: 2, column: 0 } },
                line: 'FROM alpine'
            },
            {
                name: { value: 'alpine:latest', position: { line: 3, column: 0 } },
                line: 'FROM alpine:latest'
            },
            {
                name: { value: 'alpine:1.2.3', position: { line: 4, column: 0 } },
                line: 'FROM alpine:1.2.3'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 5, column: 0 } },
                line: 'FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b'
            }
        ]);
    });

    test('tests file with comments', async () => {
        const deps = dependencyProvider.collect(`
# hello world
FROM alpine
# with tags and digest
FROM alpine:latest
FROM alpine:1.2.3
FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b
# done
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine', position: { line: 3, column: 0 } },
                line: 'FROM alpine'
            },
            {
                name: { value: 'alpine:latest', position: { line: 5, column: 0 } },
                line: 'FROM alpine:latest'
            },
            {
                name: { value: 'alpine:1.2.3', position: { line: 6, column: 0 } },
                line: 'FROM alpine:1.2.3'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 7, column: 0 } },
                line: 'FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b'
            }
        ]);
    });

    test('tests file with empty lines', async () => {
        const deps = dependencyProvider.collect(`

FROM alpine


FROM alpine:latest
FROM alpine:1.2.3




FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b

        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine', position: { line: 3, column: 0 } },
                line: 'FROM alpine'
            },
            {
                name: { value: 'alpine:latest', position: { line: 6, column: 0 } },
                line: 'FROM alpine:latest'
            },
            {
                name: { value: 'alpine:1.2.3', position: { line: 7, column: 0 } },
                line: 'FROM alpine:1.2.3'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 12, column: 0 } },
                line: 'FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b'
            }
        ]);
    });

    test('tests file with platform', async () => {
        const deps = dependencyProvider.collect(`
FROM --platform=linux/amd64 alpine
FROM --platform=linux/amd64 alpine:latest
FROM --platform=linux/amd64 alpine:1.2.3
FROM --platform=linux/amd64 alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b
        `);
        expect(deps).is.eql([
            {
                name: { value: 'alpine', position: { line: 2, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'alpine:latest', position: { line: 3, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine:latest',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'alpine:1.2.3', position: { line: 4, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine:1.2.3',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 5, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b',
                platform: 'linux/amd64'
            }
        ]);
    });

    test('tests file with multi-stage builds', async () => {
        const deps = dependencyProvider.collect(`
FROM alpine as stage1
FROM alpine:latest As stage2
FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b AS stage3
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine', position: { line: 2, column: 0 } },
                line: 'FROM alpine as stage1'
            },
            {
                name: { value: 'alpine:latest', position: { line: 3, column: 0 } },
                line: 'FROM alpine:latest As stage2'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 4, column: 0 } },
                line: 'FROM alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b AS stage3'
            }
        ]);
    });

    test('tests file with platform and multi-stage builds', async () => {
        const deps = dependencyProvider.collect(`
FROM --platform=linux/amd64 alpine as stage1
FROM --platform=linux/amd64 alpine:latest As stage2
FROM --platform=linux/amd64 alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b AS stage3
        `);
        expect(deps).is.eql([
            {
                name: { value: 'alpine', position: { line: 2, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine as stage1',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'alpine:latest', position: { line: 3, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine:latest As stage2',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b', position: { line: 4, column: 0 } },
                line: 'FROM --platform=linux/amd64 alpine@sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b AS stage3',
                platform: 'linux/amd64'
            }
        ]);
    });

    test('tests file with arguments', async () => {
        const deps = dependencyProvider.collect(`
ARG ARG_IMAGE=python
ARG ARG_TAG=3.9.5
FROM --platform=linux/amd64 \${ARG_IMAGE}:\${ARG_TAG} as stage1$ARG_FAKE
FROM $ARG_IMAGE
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'python:3.9.5', position: { line: 4, column: 0 } },
                line: 'FROM --platform=linux/amd64 ${ARG_IMAGE}:${ARG_TAG} as stage1$ARG_FAKE',
                platform: 'linux/amd64'
            },
            {
                name: { value: 'python', position: { line: 5, column: 0 } },
                line: 'FROM $ARG_IMAGE',
            }
        ]);
    });

    test('tests file with image registries', async () => {
        const deps = dependencyProvider.collect(`
FROM docker.io/library/nginx:1.2.3
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'docker.io/library/nginx:1.2.3', position: { line: 2, column: 0 } },
                line: 'FROM docker.io/library/nginx:1.2.3'
            },
            {
                name: { value: 'registry.access.redhat.com/ubi9/nodejs-20-minimal', position: { line: 3, column: 0 } },
                line: 'FROM registry.access.redhat.com/ubi9/nodejs-20-minimal'
            }
        ]);
    });

    test('tests file with scratch images', async () => {
        const deps = dependencyProvider.collect(`
FROM scratch
FROM alpine
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine', position: { line: 3, column: 0 } },
                line: 'FROM alpine'
            }
        ]);
    });

    test('tests file with spaces before and after image and line', async () => {
        const deps = dependencyProvider.collect(`      
            FROM    alpine:latest      as stage1
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'alpine:latest', position: { line: 2, column: 0 } },
                line: '            FROM    alpine:latest      as stage1'
            }
        ]);
    });

    test('tests file with various Dockerfile/Containerfile components', async () => {
        const deps = dependencyProvider.collect(`
# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["node", "index.js"]
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'node:14', position: { line: 3, column: 0 } },
                line: 'FROM node:14'
            }
        ]);
    });
}).beforeEach(() => {
    dependencyProvider = new ImageProvider();
});
