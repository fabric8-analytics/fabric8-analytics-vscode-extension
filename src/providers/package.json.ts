/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as jsonAst from 'json-to-ast';
import { IDependencyProvider, EcosystemDependencyResolver, Dependency, LicenseFieldPosition } from '../dependencyAnalysis/collector';
import { NPM } from '../constants';

/**
 * Process entries found in the package.json file.
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {
  classes: string[] = ['dependencies'];

  constructor() {
    super(NPM); // set ecosystem to 'npm'
  }

  /**
   * Parses the provided manifest content into a JSON AST.
   * @param contents - The manifest content to parse.
   * @returns The parsed JSON AST.
   */
  private parseJson(contents: string): jsonAst.ObjectNode {
    return jsonAst(contents || '{}') as jsonAst.ObjectNode;
  }

  /**
   * Maps dependencies from the parsed JSON AST to Dependency objects.
   * @param jsonAst - The parsed JSON AST to map dependencies from.
   * @returns An array of Dependency objects representing the dependencies.
   */
  private mapDependencies(ast: jsonAst.ObjectNode): Dependency[] {
    return ast.children
      .filter(c => this.classes.includes(c.key.value))
      .flatMap(c => (c.value as jsonAst.ObjectNode).children)
      .map(c => {
        // TODO: why would c.key.loc be undefined?
        const dep = new Dependency({ value: c.key.value, position: { line: c.key.loc!.start.line, column: c.key.loc!.start.column + 1 } });
        dep.version = { value: (c.value as jsonAst.LiteralNode).value as string, position: { line: c.value.loc!.start.line, column: c.value.loc!.start.column + 1 } };
        return dep;
      });
  }

  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest content to collect dependencies from.
   * @returns A Promise resolving to an array of Dependency objects representing collected dependencies.
   */
  collect(contents: string): Dependency[] {
    let ast: jsonAst.ObjectNode;

    try {
      ast = this.parseJson(contents);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return [];
      }
      throw err;
    }

    return this.mapDependencies(ast);
  }

  /**
   * Extracts license field POSITION from package.json for diagnostic underlining.
   * NOTE: License detection/comparison is handled by trustify-da-javascript-client.
   * @param contents - The package.json content to parse.
   * @returns The license field position, or undefined if not found.
   */
  extractLicensePosition(contents: string): LicenseFieldPosition | undefined {
    let ast: jsonAst.ObjectNode;

    try {
      ast = this.parseJson(contents);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return undefined;
      }
      throw err;
    }

    // Find the "license" field in the root object
    const licenseNode = ast.children.find(c => c.key.value === 'license');

    if (licenseNode && licenseNode.value.type === 'Literal') {
      return {
        value: licenseNode.value.value as string,
        position: {
          line: licenseNode.value.loc!.start.line,
          column: licenseNode.value.loc!.start.column
        }
      };
    }

    return undefined;
  }
}
