/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { PYPI } from '../constants';
import { IDependencyProvider, EcosystemDependencyResolver, IDependency, Dependency } from '../dependencyAnalysis/collector';

/**
 * Process entries found in the requirements.txt file.
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {
  constructor() {
    super(PYPI); // set ecosystem to 'pypi'
  }

  /**
   * Parses the provided string as an array of lines.
   * @param contents - The string content to parse into lines.
   * @returns An array of strings representing lines from the provided content.
   */
  private parseTxtDoc(contents: string): string[] {
    return contents.split('\n');
  }

  /**
   * Parses a line from the file and extracts dependency information.
   * @param line - The line to parse for dependency information.
   * @param index - The index of the line in the file.
   * @returns An IDependency object representing the parsed dependency or null if no dependency is found.
   */
  private parseLine(line: string, index: number): IDependency | null {
    line = line.split('#')[0]; // Remove comments
    if (!line.trim()) { return null; } // Skip empty lines

    const lineData: string[] = line.split(/[==,>=,<=]+/);
    if (lineData.length !== 2) { return null; } // Skip invalid lines

    const depName: string = lineData[0].trim().toLowerCase();
    const depVersion: string = lineData[1].trim();

    const dep = new Dependency({ value: depName, position: { line: 0, column: 0 } });
    dep.version = { value: depVersion, position: { line: index + 1, column: line.indexOf(depVersion) + 1 } };
    return dep;
  }

  /**
   * Extracts dependencies from lines parsed from the file.
   * @param lines - An array of strings representing lines from the file.
   * @returns An array of IDependency objects representing extracted dependencies.
   */
  private extractDependenciesFromLines(lines: string[]): IDependency[] {
    return lines.reduce((dependencies: IDependency[], line: string, index: number) => {
      const parsedDependency = this.parseLine(line, index);
      if (parsedDependency) {
        dependencies.push(parsedDependency);
      }
      return dependencies;
    }, []);
  }

  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest content to collect dependencies from.
   * @returns A Promise resolving to an array of IDependency objects representing collected dependencies.
   */
  collect(contents: string): IDependency[] {
    const lines: string[] = this.parseTxtDoc(contents);
    return this.extractDependenciesFromLines(lines);
  }
}
