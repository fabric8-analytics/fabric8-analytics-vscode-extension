/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { IDependencyProvider, EcosystemDependencyResolver, IDependency, Dependency } from '../dependencyAnalysis/collector';
import { GOLANG } from '../constants';

/* Please note :: There is an issue with the usage of semverRegex Node.js package in this code.
 * Often times it fails to recognize versions that contain an added suffix, usually including extra details such as a timestamp and a commit hash.
 * At the moment, using regex directly to extract versions inclusively. */

/**
 * Executes a regular expression pattern match for Semantic Versioning (SemVer) within a given string.
 * @param str - The string to search for a Semantic Versioning pattern.
 * @returns An array of matched results for the Semantic Versioning pattern.
 */
export function semVerRegExp(str: string): RegExpExecArray | null {
  const regExp = /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/ig;
  return regExp.exec(str);
}

/**
 * Process entries found in the go.mod file.
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {
  replacementMap: Map<string, IDependency> = new Map<string, IDependency>();

  constructor() {
    super(GOLANG); // set ecosystem to 'golang'
  }

  /**
   * Parses the provided string as an array of lines.
   * @param contents - The string content to parse into lines.
   * @returns An array of strings representing lines from the provided content.
   */
  static parseTxtDoc(contents: string): string[] {
    return contents.split('\n');
  }

  /**
   * Cleans the given string by removing specific characters and words, 
   * such as 'require' and 'replace', parentheses, and consecutive spaces from the provided string.
   * Additionally, trims any leading or trailing whitespace.
   * @param line - The string to be cleaned.
   * @returns The cleaned string.
   */
  static clean(line: string): string {
    return line.replace(/require|replace|\(|\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts dependency data from the provided line.
   * @param line - The line to extract dependency data from.
   * @returns An object containing dependency data, or null if no matching version is found.
   */
  static getDependencyData(line: string): { name: string, version: string | null, index: number | null } | null {
    const versionMatches = semVerRegExp(line);
    if (versionMatches && versionMatches.length > 0) {
      const depName = DependencyProvider.clean(line).split(' ')[0];
      return { name: depName, version: versionMatches[0], index: versionMatches.index };
    }
    return null;
  }

  /**
   * Registers a replacement dependency in the replacement map.
   * @param line - The line containing the replacement statement.
   * @param index - The index of the line in the file.
   */
  private registerReplacement(line: string, index: number) {
    const lineData: string[] = line.split('=>');

    let originalDepData = DependencyProvider.getDependencyData(lineData[0]);
    const replacementDepData = DependencyProvider.getDependencyData(lineData[1]);

    if (!originalDepData) { originalDepData = { name: DependencyProvider.clean(lineData[0]), version: null, index: null }; }
    if (!replacementDepData) { return; }

    const replaceDependency = new Dependency({ value: replacementDepData.name, position: { line: 0, column: 0 } });
    replaceDependency.version = { value: 'v' + replacementDepData.version, position: { line: index + 1, column: (line.lastIndexOf(lineData[1]) + (replacementDepData?.index ?? 0)) } };

    this.replacementMap.set(originalDepData.name + (originalDepData.version ? ('@v' + originalDepData.version) : ''), replaceDependency);
  }

  /**
   * Parses a line from the file and extracts dependency information.
   * @param line - The line to parse for dependency information.
   * @param index - The index of the line in the file.
   * @returns An IDependency object representing the parsed dependency or null if no dependency is found.
   */
  private parseLine(line: string, index: number): IDependency | null {
    line = line.split('//')[0]; // Remove comments
    if (!DependencyProvider.clean(line)) { return null; } // Skip lines without dependencies

    if (line.includes('=>')) {
      // stash replacement dependencies for replacement
      this.registerReplacement(line, index);
      return null;
    }

    const depData = DependencyProvider.getDependencyData(line);
    if (!depData) { return null; }

    const dep = new Dependency({ value: depData.name, position: { line: 0, column: 0 } });
    // invariant: if depData is not null, depData.index should be set
    // TODO: confirm regex wont parse of depData.index would be set to null
    dep.version = { value: 'v' + depData.version, position: { line: index + 1, column: depData.index! } };
    return dep;
  }

  /**
   * Applies replacement dependency from replacement map to the provided dependency.
   * @param dep - The dependency to be checked and replaced if necessary.
   * @returns The replaced dependency or the original one if no replacement is found.
   */
  private applyReplaceMap(dep: IDependency): IDependency {
    // invariant: dep.version should be non-null if invariant in parseLine holds.
    // TODO: can we improve the typings around all this a la Required<T>
    return this.replacementMap.get(dep.name.value + '@' + dep.version!.value) || this.replacementMap.get(dep.name.value) || dep;
  }

  /**
   * Extracts dependencies from lines parsed from the file.
   * @param lines - An array of strings representing lines from the file.
   * @returns An array of IDependency objects representing extracted dependencies.
   */
  private extractDependenciesFromLines(lines: string[]): IDependency[] {
    let isExcluded: boolean = false;
    const goModDeps: IDependency[] = lines.reduce((dependencies: IDependency[], line: string, index: number) => {
      // ignore excluded dependency lines and scopes
      if (line.includes('exclude')) {
        if (line.includes('(')) {
          isExcluded = true;
        }
        return dependencies;
      }
      if (isExcluded) {
        if (line.includes(')')) {
          isExcluded = false;
        }
        return dependencies;
      }

      const parsedDependency = this.parseLine(line, index);
      if (parsedDependency) {
        dependencies.push(parsedDependency);
      }

      return dependencies;
    }, []);

    return goModDeps.map(goModDep => this.applyReplaceMap(goModDep));
  }

  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest content to collect dependencies from.
   * @returns A Promise resolving to an array of IDependency objects representing collected dependencies.
   */
  collect(contents: string): IDependency[] {
    const lines: string[] = DependencyProvider.parseTxtDoc(contents);
    return this.extractDependenciesFromLines(lines);
  }
}
