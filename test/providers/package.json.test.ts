'use strict';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/package.json';

let dependencyProvider: DependencyProvider;
suite('Javascript NPM package.json parser tests', () => {
    test('tests empty package.json file content', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps.length).equal(0);
    });

    test('tests empty package.json', async () => {
        const deps = dependencyProvider.collect(`{}`);
        expect(deps.length).equal(0);
    });

    test('tests invalid token', async () => {
        const deps = dependencyProvider.collect(`
            {
                <<<<<
                "dependencies": {
                    "hello": "1.0",
                }
            }
        `);
        expect(deps).eql([]);
    });

    test('tests invalid package.json', async () => {
        const deps = dependencyProvider.collect(`
            {
                "dependencies": {
                    "hello": "1.0",
                }
            }
        `);
        expect(deps).eql([]);
    });

    test('tests empty dependencies key', async () => {
        const deps = dependencyProvider.collect(`
            {
                "hello":[],
                "dependencies": {}
            }
        `);
        expect(deps).eql([]);
    });

    test('tests single dependency', async () => {
        const deps = dependencyProvider.collect(`
            {
                "hello":{},
                "dependencies": {
                    "hello": "1.0"
                }
            }
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'hello', position: { line: 5, column: 22 } },
                version: { value: '1.0', position: { line: 5, column: 31 } }
            }
        ]);
    });

    test('tests dependency in devDependencies class', async () => {
        dependencyProvider.classes = ['devDependencies'];
        const deps = dependencyProvider.collect(`
            {
                "devDependencies": {
                    "hello": "1.0"
                },
                "dependencies": {
                    "foo": "10.1.1"
                }
            }
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'hello', position: { line: 4, column: 22 } },
                version: { value: '1.0', position: { line: 4, column: 31 } }
            }
        ]);
    });

    test('tests dependency in multiple classes', async () => {
        dependencyProvider.classes = ['devDependencies', 'dependencies'];
        const deps = dependencyProvider.collect(`
            {
                "devDependencies": {
                    "hello": "1.0"
                },
                "dependencies": {
                    "foo": "10.1.1"
                }
            }
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'hello', position: { line: 4, column: 22 } },
                version: { value: '1.0', position: { line: 4, column: 31 } }
            },
            {
                name: { value: 'foo', position: { line: 7, column: 22 } },
                version: { value: '10.1.1', position: { line: 7, column: 29 } }
            }
        ]);
    });


    test('tests dependency with version in next line', async () => {
        const deps = dependencyProvider.collect(`
            {
                "hello":{},
                "dependencies": {
                    "hello":
                    "1.0"
                }
            }
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'hello', position: { line: 5, column: 22 } },
                version: { value: '1.0', position: { line: 6, column: 22 } }
            }
        ]);
    });

    test('tests dependencies with spaces', async () => {
        const deps = dependencyProvider.collect(`
            {
                "hello":{},
                "dependencies": {
                "hello":                "1.0",
                    "world":"^1.0",


                "foo":

                "     10.0.1"
                }
            }
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'hello', position: { line: 5, column: 18 } },
                version: { value: '1.0', position: { line: 5, column: 42 } }
            },
            {
                name: { value: 'world', position: { line: 6, column: 22 } },
                version: { value: '^1.0', position: { line: 6, column: 30 } }
            },
            {
                name: { value: 'foo', position: { line: 9, column: 18 } },
                version: { value: '     10.0.1', position: { line: 11, column: 18 } }
            }
        ]);
    });

    test('should throw an error for invalid JSON content', async () => {
        sinon.stub(dependencyProvider, <any>'parseJson').throws(new Error('Mock error message'));

        try {
            dependencyProvider.collect(``);
            throw new Error('Expected an error to be thrown');
        } catch (error) {
            expect(error).to.be.an.instanceOf(Error);
            expect((error as Error).message).to.equal('Mock error message');
        }
    });
}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
