'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/pom.xml';

let dependencyProvider: DependencyProvider;
suite('Java Maven pom.xml parser tests', () => {
    test('tests pom.xml with empty string', async () => {
        const pom = ``;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });

    test('tests pom.xml with empty project', async () => {
        const pom = `
            <project>

            </project>
       `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });

    test('tests pom.xml with empty dependencies', async () => {
        const pom = `
            <project>
                <dependencies>

                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });

    test('tests valid pom.xml', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'foo/bar', position: { line: 10, column: 21 } },
                version: { value: '2.4', position: { line: 13, column: 34 } },
            }
        ]);
    });

    test('tests duplicate dependencies', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'foo/bar', position: { line: 10, column: 21 } },
                version: { value: '2.4', position: { line: 13, column: 34 } },
            },
            {
                name: { value: 'foo/bar', position: { line: 15, column: 21 } },
                version: { value: '2.4', position: { line: 18, column: 34 } },
            }
        ]);
    });

    test('tests duplicate dependencies when only one does not specify a version', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'foo/bar', position: { line: 10, column: 21 } },
                version: { value: '2.4', position: { line: 13, column: 34 } },
            },
            {
                name: { value: 'foo/bar', position: { line: 15, column: 21 } },
                context: {
                    value:
                        `<dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>__VERSION__</version>
                    </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 17
                        },
                        start: {
                            character: 20,
                            line: 14
                        }
                    }
                }
            }
        ]);
    });

    test('tests duplicate dependencies where none specify a version', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'foo/bar', position: { line: 10, column: 21 } },
                context: {
                    value:
                        `<dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>__VERSION__</version>
                    </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 12
                        },
                        start: {
                            character: 20,
                            line: 9
                        }
                    }
                }
            },
            {
                name: { value: 'foo/bar', position: { line: 14, column: 21 } },
                context: {
                    value:
                        `<dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>__VERSION__</version>
                    </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 16
                        },
                        start: {
                            character: 20,
                            line: 13
                        }
                    }
                }
            }
        ]);
    });

    test('tests pom.xml with multiple dependencies', async () => {
        const pom = `
            <project>
                <plugins>
                    <dependencies>
                        <dependency>
                            <groupId>plugins</groupId>
                            <artifactId>a</artifactId>
                            <version>2.3</version>
                        </dependency>
                    </dependencies>
                </plugins>
                <dependencies>
                    <dependency>
                        <groupId>dep</groupId>
                        <artifactId>a</artifactId>
                        <version>10.1</version>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'plugins/a', position: { line: 5, column: 25 } },
                version: { value: '2.3', position: { line: 8, column: 38 } }
            },
            {
                name: { value: 'dep/a', position: { line: 13, column: 21 } },
                version: { value: '10.1', position: { line: 16, column: 34 } }
            },
            {
                name: { value: 'foo/bar', position: { line: 18, column: 21 } },
                version: { value: '2.4', position: { line: 21, column: 34 } }
            }
        ]);
    });

    test('tests pom.xml with only test scope', async () => {
        const pom = `
            <project>
                <plugins>
                    <dependencies>
                        <dependency>
                            <groupId>plugins</groupId>
                            <artifactId>a</artifactId>
                            <version>2.3</version>
                            <scope>test</scope>
                        </dependency>
                    </dependencies>
                </plugins>
                <dependencies>
                    <dependency>
                        <groupId>dep</groupId>
                        <artifactId>a</artifactId>
                        <version>10.1</version>
                        <scope>test</scope>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                        <scope>test</scope>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });

    test('tests pom.xml with invalid dependencies', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId></groupId>
                        <artifactId>ab-cd</artifactId>
                    </dependency>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId></artifactId>
                    </dependency>
                    <dependency>
                        <groupId>c</groupId>
                    </dependency>
                    <dependency>
                        <artifactId></artifactId>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });

    test('tests pom.xml with invalid dependency versions', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version></version>
                    </dependency>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        </version>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'c/ab-cd', position: { line: 4, column: 21 } },
                context: {
                    value:
                        `<dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>__VERSION__</version>
                        </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 7
                        },
                        start: {
                            character: 20,
                            line: 3
                        }
                    }
                }
            },
            {
                name: { value: 'c/ab-cd', position: { line: 9, column: 21 } },
                context: {
                    value:
                        `<dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>__VERSION__</version>
                        </dependency>`,
                    range: {
                        end: {
                            character: 34,
                            line: 11
                        },
                        start: {
                            character: 20,
                            line: 8
                        }
                    }
                }
            }
        ]);
    });

    test('tests pom.xml with dependencyManagement scope', async () => {
        const pom = `
            <project>
                <dependencyManagement>
                    <dependency>
                        <!-- Dependency with scope as runtime -->
                        <groupId>{a.groupId}</groupId>
                        <artifactId>bc</artifactId>
                        <version>{a.version}</version>
                        <scope>runtime</scope>
                    </dependency>
                    <dependency>
                        <!-- Dependency with scope as compile -->
                        <groupId>a</groupId>
                        <artifactId>b-c</artifactId>
                        <version>1.2.3</version>
                        <scope>compile</scope>
                        <optional>true</optional>
                    </dependency>
                </dependencyManagement>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                    </dependency>
                    <dependency>
                        <groupId>foo</groupId>
                        <artifactId>bar</artifactId>
                        <version>2.4</version>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'c/ab-cd', position: { line: 21, column: 21 } },
                version: { value: '2.3', position: { line: 24, column: 34 } }
            },
            {
                name: { value: 'foo/bar', position: { line: 26, column: 21 } },
                version: { value: '2.4', position: { line: 29, column: 34 } }
            }
        ]);
    });

    test('tests pom.xml without version and with properties', async () => {
        const pom = `
            <project>
                <dependencies>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-cd</artifactId>
                        <version>2.3</version>
                    </dependency>
                    <dependency>
                        <groupId>\${some.example}</groupId>
                        <artifactId>\${other.example}</artifactId>
                    </dependency>
                    <dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-other</artifactId>
                    </dependency>
                </dependencies>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.containSubset([
            {
                name: { value: 'c/ab-cd', position: { line: 4, column: 21 } },
                version: { value: '2.3', position: { line: 7, column: 34 } }
            },
            {
                name: { value: '${some.example}/${other.example}', position: { line: 9, column: 21 } },
                context: {
                    value: `<dependency>
                        <groupId>\${some.example}</groupId>
                        <artifactId>\${other.example}</artifactId>
                        <version>__VERSION__</version>
                    </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 11
                        },
                        start: {
                            character: 20,
                            line: 8
                        }
                    }
                }
            },
            {
                name: { value: 'c/ab-other', position: { line: 13, column: 21 } },
                context: {
                    value: `<dependency>
                        <groupId>c</groupId>
                        <artifactId>ab-other</artifactId>
                        <version>__VERSION__</version>
                    </dependency>`,
                    range: {
                        end: {
                            character: 33,
                            line: 15
                        },
                        start: {
                            character: 20,
                            line: 12
                        }
                    }
                }
            }
        ]);
    });

    test('tests pom.xml with only dependencyManagement scope', async () => {
        const pom = `
            <project>
                <dependencyManagement>
                    <dependency>
                        <!-- Dependency with scope as runtime -->
                        <groupId>{a.groupId}</groupId>
                        <artifactId>bc</artifactId>
                        <version>{a.version}</version>
                        <scope>runtime</scope>
                    </dependency>
                    <dependency>
                        <!-- Dependency with scope as compile -->
                        <groupId>a</groupId>
                        <artifactId>b-c</artifactId>
                        <version>1.2.3</version>
                        <scope>compile</scope>
                        <optional>true</optional>
                    </dependency>
                </dependencyManagement>
            </project>
        `;
        const deps = dependencyProvider.collect(pom);
        expect(deps).is.eql([]);
    });
}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
