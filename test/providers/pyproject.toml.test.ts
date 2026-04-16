'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as chaiSubset from 'chai-subset';

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiSubset);

import { DependencyProvider } from '../../src/providers/pyproject.toml';

let dependencyProvider: DependencyProvider;
suite('Python PyPi pyproject.toml parser tests', () => {
    /** Verifies that an empty pyproject.toml returns no dependencies. */
    test('tests empty pyproject.toml', async () => {
        const deps = dependencyProvider.collect(``);
        expect(deps).is.eql([]);
    });

    /** Verifies that invalid TOML content returns no dependencies instead of throwing. */
    test('tests invalid TOML returns empty array', async () => {
        const deps = dependencyProvider.collect(`this is not valid toml [[[`);
        expect(deps).is.eql([]);
    });

    /** Verifies parsing of PEP 621 [project.dependencies] with various version operators. */
    test('tests PEP 621 [project.dependencies]', async () => {
        // Given a pyproject.toml with PEP 621 dependencies
        const deps = dependencyProvider.collect(
`[project]
dependencies = [
    "requests>=2.28.1",
    "flask==2.3.0",
    "numpy~=1.24",
]`);

        // Then all three dependencies are extracted with correct version positions
        expect(deps).is.containSubset([
            {
                name: { value: 'requests', position: { line: 0, column: 0 } },
                version: { value: '2.28.1', position: { line: 3, column: 16 } }
            },
            {
                name: { value: 'flask', position: { line: 0, column: 0 } },
                version: { value: '2.3.0', position: { line: 4, column: 13 } }
            },
            {
                name: { value: 'numpy', position: { line: 0, column: 0 } },
                version: { value: '1.24', position: { line: 5, column: 13 } }
            }
        ]);
        expect(deps.length).to.equal(3);
    });

    /** Verifies parsing of Poetry-style string dependencies. */
    test('tests Poetry [tool.poetry.dependencies]', async () => {
        // Given a pyproject.toml with Poetry-style dependencies
        const deps = dependencyProvider.collect(
`[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.1"
flask = "^2.3.0"`);

        // Then python is excluded and version positions point inside the quoted value
        expect(deps).is.containSubset([
            {
                name: { value: 'requests', position: { line: 0, column: 0 } },
                version: { value: '^2.28.1', position: { line: 3, column: 13 } }
            },
            {
                name: { value: 'flask', position: { line: 0, column: 0 } },
                version: { value: '^2.3.0', position: { line: 4, column: 10 } }
            }
        ]);
        expect(deps.length).to.equal(2);
    });

    /** Verifies that the "python" version constraint in Poetry tables is excluded. */
    test('tests python version constraint is excluded from Poetry dependencies', async () => {
        const deps = dependencyProvider.collect(
`[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.1"`);
        expect(deps.length).to.equal(1);
        expect(deps[0].name.value).to.equal('requests');
    });

    /** Verifies parsing of PEP 621 optional-dependencies groups. */
    test('tests [project.optional-dependencies] groups', async () => {
        // Given a pyproject.toml with optional-dependencies groups
        const deps = dependencyProvider.collect(
`[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black>=23.0",
]
docs = [
    "sphinx>=6.0",
]`);

        // Then dependencies from all groups are collected with correct positions
        expect(deps).is.containSubset([
            {
                name: { value: 'pytest', position: { line: 0, column: 0 } },
                version: { value: '7.0', position: { line: 3, column: 14 } }
            },
            {
                name: { value: 'black', position: { line: 0, column: 0 } },
                version: { value: '23.0', position: { line: 4, column: 13 } }
            },
            {
                name: { value: 'sphinx', position: { line: 0, column: 0 } },
                version: { value: '6.0', position: { line: 7, column: 14 } }
            }
        ]);
        expect(deps.length).to.equal(3);
    });

    /** Verifies parsing of Poetry inline table dependencies with version key. */
    test('tests Poetry inline table dependencies', async () => {
        const deps = dependencyProvider.collect(
`[tool.poetry.dependencies]
requests = { version = "^2.28.1", optional = true }`);
        expect(deps).is.containSubset([
            {
                name: { value: 'requests', position: { line: 0, column: 0 } },
                version: { value: '^2.28.1' }
            }
        ]);
        expect(deps.length).to.equal(1);
    });

    /** Verifies parsing of Poetry dependency group tables. */
    test('tests Poetry [tool.poetry.group.dev.dependencies]', async () => {
        // Given a pyproject.toml with Poetry dependency group
        const deps = dependencyProvider.collect(
`[tool.poetry.group.dev.dependencies]
pytest = "^7.0"
mypy = "^1.0"`);

        // Then dependencies are collected with positions inside the quoted values
        expect(deps).is.containSubset([
            {
                name: { value: 'pytest', position: { line: 0, column: 0 } },
                version: { value: '^7.0', position: { line: 2, column: 11 } }
            },
            {
                name: { value: 'mypy', position: { line: 0, column: 0 } },
                version: { value: '^1.0', position: { line: 3, column: 9 } }
            }
        ]);
        expect(deps.length).to.equal(2);
    });

    /** Verifies that TOML comments do not affect parsing. */
    test('tests TOML comments are handled correctly', async () => {
        const deps = dependencyProvider.collect(
`[project]
# This is a comment
dependencies = [
    # commented dependency
    "requests>=2.28.1", # inline comment
    "flask==2.3.0",
]`);
        expect(deps).is.containSubset([
            {
                name: { value: 'requests', position: { line: 0, column: 0 } },
                version: { value: '2.28.1' }
            },
            {
                name: { value: 'flask', position: { line: 0, column: 0 } },
                version: { value: '2.3.0' }
            }
        ]);
        expect(deps.length).to.equal(2);
    });

    /** Verifies that version positions (line/column) are accurate for inline diagnostics. */
    test('tests dependency positions are accurate for diagnostics placement', async () => {
        // Given a pyproject.toml with known positions
        const contents =
`[project]
dependencies = [
    "requests>=2.28.1",
]

[tool.poetry.dependencies]
flask = "^2.3.0"`;

        // When collecting dependencies
        const deps = dependencyProvider.collect(contents);

        // Then PEP 621 dependency position points to the version within the spec string
        const requestsDep = deps.find(d => d.name.value === 'requests');
        expect(requestsDep).to.not.be.undefined;
        expect(requestsDep!.version!.position.line).to.equal(3);
        expect(requestsDep!.version!.position.column).to.equal(16);

        // Then Poetry dependency position points inside the quoted string value
        const flaskDep = deps.find(d => d.name.value === 'flask');
        expect(flaskDep).to.not.be.undefined;
        expect(flaskDep!.version!.position.line).to.equal(7);
        expect(flaskDep!.version!.position.column).to.equal(10);
    });

    /** Verifies that dependencies without version specifiers are skipped. */
    test('tests PEP 621 dependencies without version specifiers are skipped', async () => {
        const deps = dependencyProvider.collect(
`[project]
dependencies = [
    "requests",
    "flask>=2.3.0",
]`);
        expect(deps.length).to.equal(1);
        expect(deps[0].name.value).to.equal('flask');
    });

    /** Verifies that package names are lowercased per Python packaging convention. */
    test('tests package names are lowercased', async () => {
        const deps = dependencyProvider.collect(
`[project]
dependencies = [
    "Flask>=2.3.0",
    "NumPy~=1.24",
]`);
        expect(deps[0].name.value).to.equal('flask');
        expect(deps[1].name.value).to.equal('numpy');
    });

    /** Verifies that PEP 621 dependencies with extras markers are parsed correctly. */
    test('tests PEP 621 dependencies with extras', async () => {
        const deps = dependencyProvider.collect(
`[project]
dependencies = [
    "requests[security]>=2.28.1",
]`);
        expect(deps.length).to.equal(1);
        expect(deps[0].name.value).to.equal('requests');
        expect(deps[0].version!.value).to.equal('2.28.1');
    });

    /** Verifies that a combined PEP 621 and Poetry file collects all dependencies. */
    test('tests mixed PEP 621 and Poetry sections', async () => {
        const deps = dependencyProvider.collect(
`[project]
dependencies = [
    "requests>=2.28.1",
]

[tool.poetry.dependencies]
flask = "^2.3.0"

[tool.poetry.group.test.dependencies]
pytest = "^7.0"`);
        expect(deps.length).to.equal(3);
        const names = deps.map(d => d.name.value);
        expect(names).to.include.members(['requests', 'flask', 'pytest']);
    });

    /** Verifies that a pyproject.toml with no dependency sections returns empty. */
    test('tests pyproject.toml with no dependency sections', async () => {
        const deps = dependencyProvider.collect(
`[project]
name = "my-project"
version = "1.0.0"

[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"`);
        expect(deps).is.eql([]);
    });

}).beforeEach(() => {
    dependencyProvider = new DependencyProvider();
});
