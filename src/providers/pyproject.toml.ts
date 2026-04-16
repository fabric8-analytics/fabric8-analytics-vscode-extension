/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { parseTOML, type AST } from 'toml-eslint-parser';
import { PYPI } from '../constants';
import { IDependencyProvider, EcosystemDependencyResolver, Dependency } from '../dependencyAnalysis/collector';

/**
 * Returns the string name of a TOML key part (bare or quoted).
 */
function keyName(part: AST.TOMLBare | AST.TOMLQuoted): string {
  return 'name' in part ? part.name : part.value;
}

/**
 * Parses a PEP 508 dependency string (e.g. "requests>=2.28.1") into name and version specifier.
 * Returns null if no version specifier is present.
 */
function parsePep508(spec: string): { name: string; version: string } | null {
  // Match package name followed by optional extras, then a version operator and version
  const match = spec.match(/^([A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?)(\[.*?\])?\s*(~=|===?|[><!]=?)\s*(.+?)(\s*[,;].*)?$/);
  if (!match) { return null; }
  return { name: match[1].toLowerCase(), version: match[5].trim() };
}

/**
 * Process entries found in pyproject.toml files.
 * Uses toml-eslint-parser for a full AST with source positions.
 *
 * Handles:
 *   [project]
 *   dependencies = ["requests>=2.28.1"]        (PEP 621)
 *
 *   [project.optional-dependencies]
 *   dev = ["pytest>=7.0"]                       (PEP 621 extras)
 *
 *   [tool.poetry.dependencies]
 *   requests = "^2.28.1"                        (Poetry string)
 *   requests = { version = "^2.28.1" }          (Poetry inline table)
 *
 *   [tool.poetry.group.<name>.dependencies]
 *   pytest = "^7.0"                             (Poetry dependency groups)
 *
 * The "python" entry in Poetry dependency tables is excluded (it specifies
 * the Python version constraint, not a PyPI package).
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {

  constructor() {
    super(PYPI);
  }

  private parseToml(contents: string): AST.TOMLProgram {
    return parseTOML(contents);
  }

  /**
   * Converts a TOML AST value location to a 1-based position suitable for diagnostics.
   * The TOML parser loc is 1-based line, 0-based column; the value loc
   * includes the opening quote, so we add 2 to the column (+1 skip quote, +1 for 1-based).
   */
  private toValuePosition(loc: AST.SourceLocation): { line: number; column: number } {
    return { line: loc.start.line, column: loc.start.column + 2 };
  }

  /**
   * Extracts a version string and its source location from a Poetry-style TOML key-value.
   * Handles both simple string values (requests = "^2.28.1") and inline tables
   * (requests = { version = "^2.28.1" }).
   */
  private extractPoetryVersion(kv: AST.TOMLKeyValue): { value: string; loc: AST.SourceLocation } | null {
    if (kv.value.type === 'TOMLValue' && kv.value.kind === 'string') {
      return { value: String(kv.value.value), loc: kv.value.loc };
    }

    if (kv.value.type === 'TOMLInlineTable') {
      const versionKv = kv.value.body
        .find(inner => keyName(inner.key.keys[0]) === 'version');
      if (versionKv && versionKv.value.type === 'TOMLValue' && versionKv.value.kind === 'string') {
        return { value: String(versionKv.value.value), loc: versionKv.value.loc };
      }
    }

    return null;
  }

  /**
   * Collects dependencies from PEP 621 array entries (e.g. dependencies = ["requests>=2.28.1"]).
   * Each array element is a PEP 508 dependency string.
   */
  private collectPep621Array(arrayNode: AST.TOMLArray): Dependency[] {
    const deps: Dependency[] = [];
    for (const element of arrayNode.elements) {
      if (element.type === 'TOMLValue' && element.kind === 'string') {
        const specString = String(element.value);
        const parsed = parsePep508(specString);
        if (!parsed) { continue; }
        // Find the version offset within the spec string so the diagnostic
        // underlines the version, not the entire dependency specifier.
        const versionOffset = specString.lastIndexOf(parsed.version);
        if (versionOffset < 0) { continue; }
        const dep = new Dependency({ value: parsed.name, position: { line: 0, column: 0 } });
        dep.version = {
          value: parsed.version,
          position: {
            line: element.loc.start.line,
            column: element.loc.start.column + 2 + versionOffset,
          },
        };
        deps.push(dep);
      }
    }
    return deps;
  }

  /**
   * Collects dependencies from a Poetry-style dependency table where each
   * key-value pair represents a package (e.g. requests = "^2.28.1").
   * Excludes the "python" entry which specifies the interpreter version constraint.
   */
  private collectPoetryTable(kvs: AST.TOMLKeyValue[]): Dependency[] {
    const deps: Dependency[] = [];
    for (const kv of kvs) {
      const localName = keyName(kv.key.keys[0]);
      if (localName === 'python') { continue; }
      const version = this.extractPoetryVersion(kv);
      if (!version) { continue; }
      const dep = new Dependency({ value: localName.toLowerCase(), position: { line: 0, column: 0 } });
      dep.version = { value: version.value, position: this.toValuePosition(version.loc) };
      deps.push(dep);
    }
    return deps;
  }

  /**
   * Checks whether a resolved key matches a specific key path.
   */
  private keyPathEquals(resolvedKey: (string | number)[], ...expected: string[]): boolean {
    if (resolvedKey.length !== expected.length) { return false; }
    return expected.every((seg, i) => resolvedKey[i] === seg);
  }

  /**
   * Checks whether a resolved key matches a Poetry dependency group table:
   * [tool.poetry.group.<name>.dependencies]
   */
  private isPoetryGroupDepsTable(resolvedKey: (string | number)[]): boolean {
    return resolvedKey.length === 5
      && resolvedKey[0] === 'tool'
      && resolvedKey[1] === 'poetry'
      && resolvedKey[2] === 'group'
      && resolvedKey[4] === 'dependencies';
  }

  collect(contents: string): Dependency[] {
    let ast: AST.TOMLProgram;
    try {
      ast = this.parseToml(contents);
    } catch {
      return [];
    }

    const dependencies: Dependency[] = [];
    const topLevel = ast.body[0];

    for (const node of topLevel.body) {
      if (node.type === 'TOMLTable') {
        // [project] — look for "dependencies" key-value with an array value
        if (this.keyPathEquals(node.resolvedKey, 'project')) {
          for (const kv of node.body) {
            if (keyName(kv.key.keys[0]) === 'dependencies' && kv.value.type === 'TOMLArray') {
              dependencies.push(...this.collectPep621Array(kv.value));
            }
          }
        }

        // [project.optional-dependencies] — each key maps to an array of PEP 508 strings
        if (this.keyPathEquals(node.resolvedKey, 'project', 'optional-dependencies')) {
          for (const kv of node.body) {
            if (kv.value.type === 'TOMLArray') {
              dependencies.push(...this.collectPep621Array(kv.value));
            }
          }
        }

        // [tool.poetry.dependencies] — Poetry-style key-value pairs
        if (this.keyPathEquals(node.resolvedKey, 'tool', 'poetry', 'dependencies')) {
          dependencies.push(...this.collectPoetryTable(node.body));
        }

        // [tool.poetry.group.<name>.dependencies] — Poetry dependency groups
        if (this.isPoetryGroupDepsTable(node.resolvedKey)) {
          dependencies.push(...this.collectPoetryTable(node.body));
        }
      }
    }

    return dependencies;
  }
}
