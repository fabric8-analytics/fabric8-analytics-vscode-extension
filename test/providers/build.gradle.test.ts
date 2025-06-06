'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

import { DependencyProvider } from '../../src/providers/build.gradle';

let dependencyProvider: DependencyProvider;
suite('Gradle build.gradle parser tests', () => {

    test('tests empty build.gradle', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps).is.eql([]);
    });

    test('tests build.gradle with string notation dependencies', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { 
    implementation "log4j:log4j:1.2.3"
    implementation 'log4j:log4j:1.2.3'
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 11, column: 33 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 12, column: 33 } }
            }
        ]);
    });

    test('tests build.gradle with map notation dependencies', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { 
    implementation group: "log4j", name: "log4j", version: "1.2.3"
    implementation version: '1.2.3', name: 'log4j', group: 'log4j'
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 11, column: 61 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 12, column: 30 } }
            }
        ]);
    });

    test('tests build.gradle with comments', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}
// a comment
dependencies { // a second comment
    // implementation group: "log4j", name: "log4j", version: "1.2.3"
    implementation version: "1.2.3", /* another comment */ name: "log4j", group: "log4j" // yet another comment
    /* last comment */
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 12, column: 30 } }
            }
        ]);
    });

    test('tests build.gradle with empty lines', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}


dependencies { 



    implementation "log4j:log4j:1.2.3"


}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 15, column: 33 } }
            }
        ]);
    });

    test('tests build.gradle with spaces before and after package parameters', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { 
         implementation      "log4j:log4j:1.2.3"
         implementation         group:    "log4j",         name: "log4j",   version:"1.2.3"
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 11, column: 43 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 12, column: 86 } }
            }
        ]);
    });

    test('tests build.gradle with arguments', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

ext mockArg = 'mock'

ext { nameArg = "log4j" }

ext {
    mockArg = 'mock'}

ext {
    versionArg = '1.2.3'
    groupArg = 'log4j'
}

ext 
{ mockArg = 'mock' }

ext 
{
    mockArg = 'mock'
}
repositories {
    mavenCentral()
}

dependencies { 
    implementation "\${groupArg}:\${nameArg}:\${versionArg}"
    implementation group: "log4j", name: "\${nameArg}", version: "\${versionArg}"
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 30, column: 44 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 31, column: 66 } }
            }
        ]);
    });

    test('tests build.gradle with single line dependency declarations', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { implementation "log4j:log4j:1.2.3" }
dependencies { implementation group: "log4j", name: "log4j", version: "1.2.3" }

        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 10, column: 44 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 11, column: 72 } }
            }
        ]);
    });

    test('tests build.gradle with muliple dependency declarations', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies implementation "log4j:log4j:1.2.3"

dependencies { implementation "log4j:log4j:1.2.3" }

dependencies {
    implementation 'log4j:log4j:1.2.3'}

dependencies {
    implementation group: "log4j", name: "log4j", version: "1.2.3"
}

dependencies 
{ implementation group: 'log4j', name: 'log4j', version: '1.2.3' }
dependencies 
{
    implementation group: 'log4j', name: 'log4j', version: '1.2.3'
}

        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 10, column: 42 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 12, column: 44 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 15, column: 33 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 18, column: 61 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 22, column: 59 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 25, column: 61 } }
            }
        ]);
    });

    test('tests build.gradle with special dependency declarations', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { 
    implementation('commons-codec:commons-codec') {
        version {
            strictly '1.9'
        }
    }
    implementation('commons-beanutils:commons-beanutils:1.9.4') {
        exclude group: 'commons-collections', module: 'commons-collections'
    }
    implementation project(":module_a")
    api libs.io.quarkus.quarkus.vertx.http
    implementation "log4j:log4j:1.2.3"
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'commons-codec/commons-codec', position: { line: 0, column: 0 } },
                context: { value: 'commons-codec:commons-codec:__VERSION__', range: { start: { line: 10, character: 20 }, end: { line: 10, character: 47 } } }
            },
            {
                name: { value: 'commons-beanutils/commons-beanutils', position: { line: 0, column: 0 } },
                version: { value: '1.9.4', position: { line: 16, column: 57 } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                version: { value: '1.2.3', position: { line: 21, column: 33 } }
            }
        ]);
    });

    test('tests build.gradle dependencies with missing version parameter', async () => {
        const deps = dependencyProvider.collect(`
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies { 
    implementation "log4j:log4j"
    implementation group: "log4j", name: "log4j"
}
        `);
        expect(deps).is.containSubset([
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                context: { value: 'log4j:log4j:__VERSION__', range: { start: { line: 10, character: 20 }, end: { line: 10, character: 31 } } }
            },
            {
                name: { value: 'log4j/log4j', position: { line: 0, column: 0 } },
                context: { value: 'name: "log4j", version: "__VERSION__"', range: { start: { line: 11, character: 35 }, end: { line: 11, character: 48 } } }
            }
        ]);
    });
}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
