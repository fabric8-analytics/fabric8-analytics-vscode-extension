/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { parseTOML, type AST } from 'toml-eslint-parser';
import { IDependencyProvider, EcosystemDependencyResolver, Dependency, LicenseFieldPosition } from '../dependencyAnalysis/collector';
import { CARGO } from '../constants';

function keyName(part: AST.TOMLBare | AST.TOMLQuoted): string {
  return 'name' in part ? part.name : part.value;
}

/**
 * Process entries found in the Cargo.toml file.
 * Uses toml-eslint-parser for a full AST with source positions.
 *
 * Handles:
 *   [dependencies]
 *   serde = "1.0"
 *   tokio = { version = "1.0", features = ["full"] }
 *
 *   [dependencies.reqwest]
 *   version = "0.11"
 *
 *   [workspace.dependencies]
 *   serde = "1.0"
 *
 *   [target.'cfg(windows)'.dependencies]
 *   winapi = "0.3"
 *
 * Dev/build dependencies ([dev-dependencies], [build-dependencies]) are excluded.
 * Member crate entries with { workspace = true } are skipped (no version to underline).
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {

  constructor() {
    super(CARGO);
  }

  private parseToml(contents: string): AST.TOMLProgram {
    return parseTOML(contents);
  }

  /**
   * Extracts a version string value and its source location from a TOMLKeyValue.
   * Handles both simple string values and inline tables with a "version" key.
   */
  private extractVersion(kv: AST.TOMLKeyValue): { value: string; loc: AST.SourceLocation } | null {
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
   * Converts a TOML AST value location to a 1-based position suitable for diagnostics.
   * The TOML parser loc is 1-based line, 0-based column; the value loc
   * includes the opening quote, so we add 2 to the column (+1 skip quote, +1 for 1-based).
   */
  private toVersionPosition(loc: AST.SourceLocation): { line: number; column: number } {
    return { line: loc.start.line, column: loc.start.column + 2 };
  }

  /**
   * Returns the index of "dependencies" in the resolved key, or -1 if not found.
   * Also returns -1 if any segment is "dev-dependencies" or "build-dependencies".
   *
   * This allows matching any table whose key ends with "dependencies", including:
   *   [dependencies]                              -> ["dependencies"]                           idx=0
   *   [workspace.dependencies]                    -> ["workspace", "dependencies"]              idx=1
   *   [target.'cfg(windows)'.dependencies]        -> ["target", "cfg(windows)", "dependencies"] idx=2
   */
  private depsIndex(resolvedKey: (string | number)[]): number {
    if (resolvedKey.some(k => k === 'dev-dependencies' || k === 'build-dependencies')) {
      return -1;
    }
    return resolvedKey.lastIndexOf('dependencies');
  }

  /**
   * Checks whether a resolved key represents a flat dependencies table
   */
  private isFlatDepsTable(resolvedKey: (string | number)[]): boolean {
    const idx = this.depsIndex(resolvedKey);
    return idx >= 0 && idx === resolvedKey.length - 1;
  }

  /**
   * If the resolved key represents a dotted dependency table (one segment after
   * "dependencies"), returns the dependency name. Otherwise returns null.
   *   [dependencies.reqwest]                          => "reqwest"
   *   [workspace.dependencies.reqwest]                => "reqwest"
   *   [target.'cfg(windows)'.dependencies.winreg]     => "winreg"
   */
  private dottedDepName(resolvedKey: (string | number)[]): string | null {
    const idx = this.depsIndex(resolvedKey);
    if (idx >= 0 && idx === resolvedKey.length - 2) {
      return String(resolvedKey[idx + 1]);
    }
    return null;
  }

  /**
   * Resolves the real crate name for a dependency. Cargo allows local renaming
   * via the `package` key (e.g. `my_serde = { version = "1.0", package = "serde" }`).
   * When present, `package` holds the real crate name on crates.io; otherwise the
   * local key name is the real name.
   */
  private resolvePackageName(localName: string, kvs: AST.TOMLKeyValue[]): string {
    const pkgKv = kvs.find(kv => keyName(kv.key.keys[0]) === 'package');
    if (pkgKv && pkgKv.value.type === 'TOMLValue' && pkgKv.value.kind === 'string') {
      return String(pkgKv.value.value);
    }
    return localName;
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
        if (this.isFlatDepsTable(node.resolvedKey)) {
          for (const kv of node.body) {
            const localName = keyName(kv.key.keys[0]);
            const version = this.extractVersion(kv);
            if (!version) { continue; }

            const inlineKvs = kv.value.type === 'TOMLInlineTable' ? kv.value.body : [];
            const depName = this.resolvePackageName(localName, inlineKvs);
            const dep = new Dependency({ value: depName, position: { line: 0, column: 0 } });
            dep.version = { value: version.value, position: this.toVersionPosition(version.loc) };
            dependencies.push(dep);
          }
        } else {
          const localName = this.dottedDepName(node.resolvedKey);
          if (localName) {
            const versionKv = node.body.find(kv => keyName(kv.key.keys[0]) === 'version');
            if (versionKv && versionKv.value.type === 'TOMLValue' && versionKv.value.kind === 'string') {
              const depName = this.resolvePackageName(localName, node.body);
              const dep = new Dependency({ value: depName, position: { line: 0, column: 0 } });
              dep.version = {
                value: String(versionKv.value.value),
                position: this.toVersionPosition(versionKv.value.loc),
              };
              dependencies.push(dep);
            }
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Extracts license field position from Cargo.toml for diagnostic underlining.
   */
  extractLicensePosition(contents: string): LicenseFieldPosition | undefined {
    let ast: AST.TOMLProgram;
    try {
      ast = this.parseToml(contents);
    } catch {
      return undefined;
    }

    const topLevel = ast.body[0];

    for (const node of topLevel.body) {
      if (node.type === 'TOMLTable') {
        if (node.resolvedKey.length === 1 && node.resolvedKey[0] === 'package') {
          const licenseKv = node.body.find(kv => keyName(kv.key.keys[0]) === 'license');
          if (licenseKv && licenseKv.value.type === 'TOMLValue' && licenseKv.value.kind === 'string') {
            return {
              value: String(licenseKv.value.value),
              position: this.toVersionPosition(licenseKv.value.loc),
            };
          }
        }
      }
    }

    return undefined;
  }
}
