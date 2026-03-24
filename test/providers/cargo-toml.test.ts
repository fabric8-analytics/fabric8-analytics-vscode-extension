'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/cargo-toml';

let dependencyProvider: DependencyProvider;
suite('Rust Cargo Cargo.toml parser tests', () => {
    test('tests empty Cargo.toml', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps).is.eql([]);
    });

    test('tests Cargo.toml with no dependencies section', async () => {
        const deps = dependencyProvider.collect(`[package]
name = "my-app"
version = "0.1.0"
edition = "2021"
`);
        expect(deps).is.eql([]);
    });

    test('tests simple string version dependencies', async () => {
        const deps = dependencyProvider.collect(`[package]
name = "my-app"
version = "0.1.0"

[dependencies]
serde = "1.0.104"
tokio = "1.28.0"
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0.104', position: { line: 6, column: 10 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0', position: { line: 7, column: 10 } }
            }
        ]);
    });

    test('tests inline table dependencies with version', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.28.0", features = ["full"] }
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 22 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0', position: { line: 3, column: 22 } }
            }
        ]);
    });

    test('tests dotted dependencies section', async () => {
        const deps = dependencyProvider.collect(`[dependencies.reqwest]
version = "0.11"
features = ["json"]

[dependencies.serde]
version = "1.0.104"
features = ["derive"]
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'reqwest', position: { line: 0, column: 0 } },
                version: { value: '0.11', position: { line: 2, column: 12 } }
            },
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0.104', position: { line: 6, column: 12 } }
            }
        ]);
    });

    test('tests dev-dependencies are excluded', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"

[dev-dependencies]
mockall = "0.11.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            }
        ]);
    });

    test('tests build-dependencies are excluded', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"

[build-dependencies]
cc = "1.0.73"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            }
        ]);
    });

    test('tests dotted dev-dependencies are excluded', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"

[dev-dependencies.mockall]
version = "0.11.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            }
        ]);
    });

    test('tests Cargo.toml with comments', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
# This is a comment
serde = "1.0"
# Another comment
tokio = "1.28.0"
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 3, column: 10 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0', position: { line: 5, column: 10 } }
            }
        ]);
    });

    test('tests Cargo.toml with empty lines', async () => {
        const deps = dependencyProvider.collect(`[dependencies]

serde = "1.0"

tokio = "1.28.0"

`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 3, column: 10 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0', position: { line: 5, column: 10 } }
            }
        ]);
    });

    test('tests mixed simple and inline table dependencies', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"
tokio = { version = "1.28.0", features = ["full"] }
reqwest = "0.11"
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0', position: { line: 3, column: 22 } }
            },
            {
                name: { value: 'reqwest', position: { line: 0, column: 0 } },
                version: { value: '0.11', position: { line: 4, column: 12 } }
            }
        ]);
    });

    test('tests dependencies section followed by other sections', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"

[package]
name = "my-app"
version = "0.1.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            }
        ]);
    });

    test('tests inline table dependency without version is skipped', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"
my-lib = { path = "../my-lib" }
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 10 } }
            }
        ]);
    });

    test('tests dependency names with hyphens and underscores', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
my-crate = "1.0.0"
my_other_crate = "2.0.0"
crate123 = "3.0.0"
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'my-crate', position: { line: 0, column: 0 } },
                version: { value: '1.0.0', position: { line: 2, column: 13 } }
            },
            {
                name: { value: 'my_other_crate', position: { line: 0, column: 0 } },
                version: { value: '2.0.0', position: { line: 3, column: 19 } }
            },
            {
                name: { value: 'crate123', position: { line: 0, column: 0 } },
                version: { value: '3.0.0', position: { line: 4, column: 13 } }
            }
        ]);
    });

    test('tests invalid TOML returns empty', async () => {
        const deps = dependencyProvider.collect(`[dependencies
serde = "1.0"
`);
        expect(deps).is.eql([]);
    });

    test('tests extractLicensePosition', async () => {
        const licensePos = dependencyProvider.extractLicensePosition(`[package]
name = "my-app"
version = "0.1.0"
license = "MIT"

[dependencies]
serde = "1.0"
`);
        expect(licensePos).to.not.be.undefined;
        expect(licensePos!.value).to.eql('MIT');
        expect(licensePos!.position.line).to.eql(4);
        expect(licensePos!.position.column).to.eql(12);
    });

    test('tests extractLicensePosition returns undefined when no license', async () => {
        const licensePos = dependencyProvider.extractLicensePosition(`[package]
name = "my-app"
version = "0.1.0"

[dependencies]
serde = "1.0"
`);
        expect(licensePos).to.be.undefined;
    });

    test('tests extractLicensePosition only finds license in [package] section', async () => {
        const licensePos = dependencyProvider.extractLicensePosition(`[some-other-section]
license = "GPL-3.0"

[package]
name = "my-app"
version = "0.1.0"
license = "MIT"
`);
        expect(licensePos).to.not.be.undefined;
        expect(licensePos!.value).to.eql('MIT');
    });

    test('tests [workspace.dependencies] simple versions', async () => {
        const deps = dependencyProvider.collect(`[workspace]
members = ["crate-a", "crate-b"]

[workspace.dependencies]
serde = "1.0"
tokio = "1.28.0"
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0' }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0' }
            }
        ]);
    });

    test('tests [workspace.dependencies] inline table with version', async () => {
        const deps = dependencyProvider.collect(`[workspace.dependencies]
tokio = { version = "1.28.0", features = ["full"] }
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0' }
            }
        ]);
    });

    test('tests [workspace.dependencies.X] dotted section', async () => {
        const deps = dependencyProvider.collect(`[workspace.dependencies.reqwest]
version = "0.11"
features = ["json"]
`);
        expect(deps).is.containSubset([
            {
                name: { value: 'reqwest', position: { line: 0, column: 0 } },
                version: { value: '0.11' }
            }
        ]);
    });

    test('tests workspace = true entries are skipped', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = { workspace = true }
tokio = "1.28.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0' }
            }
        ]);
    });

    test('tests [workspace.dependencies] mixed with [dependencies]', async () => {
        const deps = dependencyProvider.collect(`[workspace.dependencies]
serde = "1.0"

[dependencies]
tokio = "1.28.0"
`);
        expect(deps.length).to.eql(2);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0' }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0' }
            }
        ]);
    });

    test('tests [target.cfg(windows).dependencies] flat section', async () => {
        const deps = dependencyProvider.collect(`[target.'cfg(windows)'.dependencies]
winapi = "0.3"
winreg = { version = "0.10", features = ["transactions"] }
`);
        expect(deps.length).to.eql(2);
        expect(deps).is.containSubset([
            {
                name: { value: 'winapi', position: { line: 0, column: 0 } },
                version: { value: '0.3', position: { line: 2, column: 11 } }
            },
            {
                name: { value: 'winreg', position: { line: 0, column: 0 } },
                version: { value: '0.10', position: { line: 3, column: 23 } }
            }
        ]);
    });

    test('tests [target.cfg(unix).dependencies] flat section', async () => {
        const deps = dependencyProvider.collect(`[target.'cfg(unix)'.dependencies]
nix = "0.26"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'nix', position: { line: 0, column: 0 } },
                version: { value: '0.26', position: { line: 2, column: 8 } }
            }
        ]);
    });

    test('tests [target.X.dependencies.Y] dotted section', async () => {
        const deps = dependencyProvider.collect(`[target.x86_64-unknown-linux-gnu.dependencies.openssl]
version = "0.10"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'openssl', position: { line: 0, column: 0 } },
                version: { value: '0.10', position: { line: 2, column: 12 } }
            }
        ]);
    });

    test('tests target dev-dependencies are excluded', async () => {
        const deps = dependencyProvider.collect(`[target.'cfg(windows)'.dependencies]
winapi = "0.3"

[target.'cfg(windows)'.dev-dependencies]
win-test = "1.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'winapi', position: { line: 0, column: 0 } },
                version: { value: '0.3' }
            }
        ]);
    });

    test('tests target build-dependencies are excluded', async () => {
        const deps = dependencyProvider.collect(`[target.'cfg(windows)'.build-dependencies]
cc = "1.0"

[dependencies]
serde = "1.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0' }
            }
        ]);
    });

    test('tests mixed regular, workspace, and target dependencies', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"

[workspace.dependencies]
log = "0.4"

[target.'cfg(windows)'.dependencies]
winapi = "0.3"
`);
        expect(deps.length).to.eql(3);
        expect(deps).is.containSubset([
            { name: { value: 'serde' }, version: { value: '1.0' } },
            { name: { value: 'log' }, version: { value: '0.4' } },
            { name: { value: 'winapi' }, version: { value: '0.3' } }
        ]);
    });

    test('tests inline table with package rename uses real crate name', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde_lib = { version = "1.0", package = "serde" }
tokio = "1.28.0"
`);
        expect(deps.length).to.eql(2);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0', position: { line: 2, column: 26 } }
            },
            {
                name: { value: 'tokio', position: { line: 0, column: 0 } },
                version: { value: '1.28.0' }
            }
        ]);
    });

    test('tests dotted table with package rename uses real crate name', async () => {
        const deps = dependencyProvider.collect(`[dependencies.my_openssl]
version = "0.10"
package = "openssl"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'openssl', position: { line: 0, column: 0 } },
                version: { value: '0.10', position: { line: 2, column: 12 } }
            }
        ]);
    });

    test('tests simple string version has no package rename effect', async () => {
        const deps = dependencyProvider.collect(`[dependencies]
serde = "1.0"
`);
        expect(deps.length).to.eql(1);
        expect(deps).is.containSubset([
            {
                name: { value: 'serde', position: { line: 0, column: 0 } },
                version: { value: '1.0' }
            }
        ]);
    });

    test('tests extractLicensePosition with invalid TOML returns undefined', async () => {
        const licensePos = dependencyProvider.extractLicensePosition(`[package
license = "MIT"
`);
        expect(licensePos).to.be.undefined;
    });
}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
