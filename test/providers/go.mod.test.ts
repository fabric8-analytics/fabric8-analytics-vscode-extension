'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/go.mod';

let dependencyProvider: DependencyProvider;
suite('Golang Gomodules go.mod parser tests', () => {
    test('tests empty go.mod', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps).is.eql([]);
    });

    test('tests require statements in go.mod', async () => {
        const deps = dependencyProvider.collect(`
        module github.com/alecthomas/kingpin

        require github.com/pmezard/go-difflib v1.0.0

        require (
            github.com/davecgh/go-spew v1.1.1
        )

        go 1.13
    `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/pmezard/go-difflib', position: { line: 0, column: 0 } },
                version: { value: 'v1.0.0', position: { line: 4, column: 47 } }
            },
            {
                name: { value: 'github.com/davecgh/go-spew', position: { line: 0, column: 0 } },
                version: { value: 'v1.1.1', position: { line: 7, column: 40 } }
            }
        ]);
    });

    test('tests go.mod with the same package but different versions', async () => {
        const deps = dependencyProvider.collect(`
            module test/data/sample1

            go 1.15

            require (
                github.com/googleapis/gax-go v1.0.3
                github.com/googleapis/gax-go/v2 v2.0.5
            )
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/googleapis/gax-go', position: { line: 0, column: 0 } },
                version: { value: 'v1.0.3', position: { line: 7, column: 46 } }
            },
            {
                name: { value: 'github.com/googleapis/gax-go/v2', position: { line: 0, column: 0 } },
                version: { value: 'v2.0.5', position: { line: 8, column: 49 } }
            }
        ]);
    });

    test('tests go.mod with comments', async () => {
        const deps = dependencyProvider.collect(`
            // This is the starting point.
            module github.com/alecthomas/kingpin
            require (
                github.com/alecthomas/units v0.0.0-20151022065526-2efee857e7cf // Valid data before this.
                // Extra comment in require section.
                github.com/pmezard/go-difflib v1.0.0 // indirect
                github.com/stretchr/testify v1.2.2
            )
            go 1.13
            // Final notes.
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/alecthomas/units', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20151022065526-2efee857e7cf', position: { line: 5, column: 45 } }
            },
            {
                name: { value: 'github.com/pmezard/go-difflib', position: { line: 0, column: 0 } },
                version: { value: 'v1.0.0', position: { line: 7, column: 47 } }
            },
            {
                name: { value: 'github.com/stretchr/testify', position: { line: 0, column: 0 } },
                version: { value: 'v1.2.2', position: { line: 8, column: 45 } }
            }
        ]);
    });

    test('tests go.mod with empty lines', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin

            require (

                github.com/alecthomas/units v0.0.0-20151022065526-2efee857e7cf

                github.com/stretchr/testify v1.2.2



            )
            go 1.13

        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/alecthomas/units', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20151022065526-2efee857e7cf', position: { line: 6, column: 45 } }
            },
            {
                name: { value: 'github.com/stretchr/testify', position: { line: 0, column: 0 } },
                version: { value: 'v1.2.2', position: { line: 8, column: 45 } }
            }
        ]);
    });

    test('tests go.mod with dependencies which have spaces before and after package name and version', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin
            require (
                github.com/alecthomas/units    v0.0.0-20151022065526-2efee857e7cf
                    github.com/davecgh/go-spew v1.1.1 // indirect
                github.com/pmezard/go-difflib v1.0.0     // indirect
                    github.com/stretchr/testify    v1.2.2    // indirect
            )
            go 1.13
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/alecthomas/units', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20151022065526-2efee857e7cf', position: { line: 4, column: 48 } }
            },
            {
                name: { value: 'github.com/davecgh/go-spew', position: { line: 0, column: 0 } },
                version: { value: 'v1.1.1', position: { line: 5, column: 48 } }
            },
            {
                name: { value: 'github.com/pmezard/go-difflib', position: { line: 0, column: 0 } },
                version: { value: 'v1.0.0', position: { line: 6, column: 47 } }
            },
            {
                name: { value: 'github.com/stretchr/testify', position: { line: 0, column: 0 } },
                version: { value: 'v1.2.2', position: { line: 7, column: 52 } }
            }
        ]);
    });

    test('tests go.mod with dependencies which have extra sufixes in version', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin

            require (
                github.com/alecthomas/units v0.1.3-alpha
                github.com/pierrec/lz4 v2.5.2-alpha+incompatible
                github.com/davecgh/go-spew v1.1.1+incompatible
                github.com/pmezard/go-difflib v1.3.0+version
                github.com/stretchr/testify v1.2.2+incompatible-version
                github.com/regen-network/protobuf v1.3.2-alpha.regen.4
                github.com/vmihailenco/msgpack/v5 v5.0.0-beta.1
                github.com/btcsuite/btcd v0.20.1-beta
            )

            go 1.13
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/alecthomas/units', position: { line: 0, column: 0 } },
                version: { value: 'v0.1.3-alpha', position: { line: 5, column: 45 } }
            },
            {
                name: { value: 'github.com/pierrec/lz4', position: { line: 0, column: 0 } },
                version: { value: 'v2.5.2-alpha+incompatible', position: { line: 6, column: 40 } }
            },
            {
                name: { value: 'github.com/davecgh/go-spew', position: { line: 0, column: 0 } },
                version: { value: 'v1.1.1+incompatible', position: { line: 7, column: 44 } }
            },
            {
                name: { value: 'github.com/pmezard/go-difflib', position: { line: 0, column: 0 } },
                version: { value: 'v1.3.0+version', position: { line: 8, column: 47 } }
            },
            {
                name: { value: 'github.com/stretchr/testify', position: { line: 0, column: 0 } },
                version: { value: 'v1.2.2+incompatible-version', position: { line: 9, column: 45 } }
            },
            {
                name: { value: 'github.com/regen-network/protobuf', position: { line: 0, column: 0 } },
                version: { value: 'v1.3.2-alpha.regen.4', position: { line: 10, column: 51 } }
            },
            {
                name: { value: 'github.com/vmihailenco/msgpack/v5', position: { line: 0, column: 0 } },
                version: { value: 'v5.0.0-beta.1', position: { line: 11, column: 51 } }
            },
            {
                name: { value: 'github.com/btcsuite/btcd', position: { line: 0, column: 0 } },
                version: { value: 'v0.20.1-beta', position: { line: 12, column: 42 } }
            }
        ]);
    });

    test('tests replace statements in go.mod', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin
            go 1.13

            replace (
                github.com/alecthomas/units v0.1.3-alpha => github.com/test-user/units v13.3.2 // Required by OLM
                github.com/alecthomas/units v0.1.3 => github.com/test-user/units v13.3.2 // Required by OLM
                github.com/pierrec/lz4 => github.com/pierrec/lz4 v3.4.2 // Required by prometheus-operator
                github.com/pierrec/lz4 v3.4.1 => github.com/pierrec/lz4 v3.4.3 // same-module with diff version in replace
            )

            replace github.com/vmihailenco/msgpack/v5 v5.0.0-beta.1 => ./msgpack/v5 // replace with local module

            require (
                github.com/alecthomas/units v0.1.3-alpha
                github.com/pierrec/lz4 v2.5.2-alpha+incompatible
                github.com/davecgh/go-spew v1.1.1+incompatible
                github.com/pmezard/go-difflib v1.3.0
                github.com/stretchr/testify v1.2.2+incompatible-version
                github.com/regen-network/protobuf v1.3.2-alpha.regen.4
                github.com/vmihailenco/msgpack/v5 v5.0.0-beta.1
                github.com/btcsuite/btcd v0.0.0-20151022065526-2efee857e7cf
            )

            replace (
                github.com/davecgh/go-spew v1.1.1+incompatible => github.com/davecgh/go-spew v1.1.2
                github.com/stretchr/testify => github.com/stretchr-1/testify v1.2.3 // test with module and with one import package
                github.com/regen-network/protobuf => github.com/regen-network/protobuf1 v1.3.2 // test with module and with one import package
                github.com/pmezard/go-difflib v1.3.0 => github.com/pmezard/go-difflib v0.0.0-20151022065526-2efee857e7cf // semver to pseudo
            )

            replace github.com/btcsuite/btcd v0.0.0-20151022065526-2efee857e7cf => github.com/btcsuite/btcd v0.20.1-beta // pseudo to semver
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'github.com/test-user/units', position: { line: 0, column: 0 } },
                version: { value: 'v13.3.2', position: { line: 6, column: 88 } }
            },
            {
                name: { value: 'github.com/pierrec/lz4', position: { line: 0, column: 0 } },
                version: { value: 'v3.4.2', position: { line: 8, column: 66 } }
            },
            {
                name: { value: 'github.com/davecgh/go-spew', position: { line: 0, column: 0 } },
                version: { value: 'v1.1.2', position: { line: 26, column: 94 } }
            },
            {
                name: { value: 'github.com/pmezard/go-difflib', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20151022065526-2efee857e7cf', position: { line: 29, column: 87 } }
            },
            {
                name: { value: 'github.com/stretchr-1/testify', position: { line: 0, column: 0 } },
                version: { value: 'v1.2.3', position: { line: 27, column: 78 } }
            },
            {
                name: { value: 'github.com/regen-network/protobuf1', position: { line: 0, column: 0 } },
                version: { value: 'v1.3.2', position: { line: 28, column: 89 } }
            },
            {
                name: { value: 'github.com/vmihailenco/msgpack/v5', position: { line: 0, column: 0 } },
                version: { value: 'v5.0.0-beta.1', position: { line: 21, column: 51 } }
            },
            {
                name: { value: 'github.com/btcsuite/btcd', position: { line: 0, column: 0 } },
                version: { value: 'v0.20.1-beta', position: { line: 32, column: 109 } }
            }
        ]);
    });

    test('tests go.mod with multiple packages replaced by the same package in go.mod', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin
            go 1.13
            
            require (
                cloud.google.com/go v0.100.2
                github.com/gogo/protobuf v1.3.0
                github.com/golang/protobuf v1.3.4
            )

            replace (
                github.com/golang/protobuf => github.com/gogo/protobuf v1.3.1
                github.com/gogo/protobuf v1.3.0 => github.com/gogo/protobuf v1.3.1
            )
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'cloud.google.com/go', position: { line: 0, column: 0 } },
                version: { value: 'v0.100.2', position: { line: 6, column: 37 } }
            },
            {
                name: { value: 'github.com/gogo/protobuf', position: { line: 0, column: 0 } },
                version: { value: 'v1.3.1', position: { line: 13, column: 77 } }
            },
            {
                name: { value: 'github.com/gogo/protobuf', position: { line: 0, column: 0 } },
                version: { value: 'v1.3.1', position: { line: 12, column: 72 } }
            }
        ]);
    });

    test('tests exclude statements in go.mod', async () => {
        const deps = dependencyProvider.collect(`
            module github.com/alecthomas/kingpin
            go 1.13

            exclude (
                golang.org/x/crypto v1.4.5
            )

            exclude github.com/gogo/protobuf

            require (
                golang.org/x/sys v0.0.0-20220728004956-3c1f35247d10 
                golang.org/x/sync v0.0.0-20210220032951-036812b2e83c // indirect
                cloud.google.com/go/compute v1.6.1
            )

            exclude (
                cloud.google.com/go v0.100.2
            )

            exclude golang.org/x/sys v1.6.7
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'golang.org/x/sys', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20220728004956-3c1f35247d10', position: { line: 12, column: 34 } }
            },
            {
                name: { value: 'golang.org/x/sync', position: { line: 0, column: 0 } },
                version: { value: 'v0.0.0-20210220032951-036812b2e83c', position: { line: 13, column: 35 } }
            },
            {
                name: { value: 'cloud.google.com/go/compute', position: { line: 0, column: 0 } },
                version: { value: 'v1.6.1', position: { line: 14, column: 45 } }
            }
        ]);
    });
}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
