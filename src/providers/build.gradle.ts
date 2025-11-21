/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Position, Range } from 'vscode';
import { VERSION_PLACEHOLDER, GRADLE } from '../constants';
import { IDependencyProvider, EcosystemDependencyResolver, Dependency } from '../dependencyAnalysis/collector';

/**
 * Process entries found in the build.gradle file.
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {
  private args: Map<string, string> = new Map<string, string>();

  /**
   * Regular expression for matching inline comments.
   */
  COMMENT_REGEX: RegExp = /\/\*[\s\S]*?\*\//g;

  /**
   * Regular expression for locating key-value pairs in a string with colons as separators.
   */
  FIND_KEY_VALUE_PAIRS_WITH_COLON_REGEX: RegExp = /\b(\w+)\s*:\s*(['"])(.*?)\2/g;

  /**
   * Regular expression for locating key-value pairs in a string with equals signs as separators.
   */
  FIND_KEY_VALUE_PAIRS_WITH_EQUALS_REGEX: RegExp = /\b(\w+)\s*=\s*(['"])(.*?)\2/;

  /**
   * Regular expression for matching key value pairs.
   */
  SPLIT_KEY_VALUE_PAIRS_WITH_COLON_REGEX: RegExp = /\s*:\s*/;

  /**
   * Regular expression for matching strings enclosed in double or single quotes.
   */
  BETWEEN_QUOTES_REGEX: RegExp = /(['"])(.*?)\1/;

  /**
   * Regular expression for matching open brackets in string.
   */
  OPEN_BRACKETS_REGEX: RegExp = /{/g;

  /**
   * Regular expression for matching close brackets in string.
   */
  CLOSE_BRACKETS_REGEX: RegExp = /}/g;

  /**
   * Name of scope holding manifest dependencies.
   */
  DEPENDENCIES_SCOPE: string = 'dependencies';

  /**
   * Name of scope holding manifest arguments.
   */
  ARGS_SCOPE: string = 'ext';

  constructor() {
    super(GRADLE); // set ecosystem to 'gradle'
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
   * Replaces placeholders in a string with values from an args map.
   * @param str - The string containing placeholders.
   * @returns The string with placeholders replaced by corresponding values from the args map.
   * @private
   */
  private replaceArgsInString(str: string): string {
    this.args.forEach((value, key) => {
      const regexWithBraces = new RegExp(`\\$\\{${key}\\}`, 'g');
      const regexWithoutBraces = new RegExp(`\\$${key}\\b`, 'g');

      str = str
        .replace(regexWithBraces, value)
        .replace(regexWithoutBraces, value);
    });
    return str;
  }

  /**
   * Parses a line from the file and extracts dependency information.
   * @param line - The line to parse for dependency information.
   * @param cleanLine - The line to parse for dependency information cleaned of comments.
   * @param index - The index of the line in the file.
   * @returns An Dependency object representing the parsed dependency or null if no dependency is found.
   */
  private parseLine(line: string, cleanLine: string, index: number): Dependency | null {
    const myClassObj = { group: '', name: '', version: '' };
    let depData: string;

    const keyValuePairs = cleanLine.match(this.FIND_KEY_VALUE_PAIRS_WITH_COLON_REGEX);
    if (keyValuePairs) {
      // extract data from dependency in Map format
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split(this.SPLIT_KEY_VALUE_PAIRS_WITH_COLON_REGEX);
        const match = value.match(this.BETWEEN_QUOTES_REGEX);
        if (!match) { return; }

        const valueData = match[2];
        switch (key) {
          case 'group':
            myClassObj.group = valueData;
            break;
          case 'name':
            myClassObj.name = valueData;
            break;
          case 'version':
            myClassObj.version = valueData;
            break;
        }
      });
    } else {
      // extract data from dependency in String format
      const match = cleanLine.match(this.BETWEEN_QUOTES_REGEX);
      if (!match) { return null; }

      depData = match[2];
      const depDataList = depData.split(':');
      myClassObj.group = depDataList[0];
      myClassObj.name = depDataList[1] || '';
      myClassObj.version = depDataList[2] || '';
    }

    // ignore dependencies missing minimal requirements
    if (myClassObj.group === '' || myClassObj.name === '') { return null; }

    // determine dependency name
    let depName: string = `${myClassObj.group}/${myClassObj.name}`;
    if (depName.includes('$')) {
      depName = this.replaceArgsInString(depName);
    }

    // Calculate position for the dependency name (group:artifact)
    // For Gradle, we place diagnostics on the dependency string in the file
    let namePosition = { line: index + 1, column: 0 };
    if (keyValuePairs) {
      // For map format like: group: "log4j", name: "log4j"
      // Find the start of the group value
      const groupMatch = line.match(/group\s*:\s*(['"])(.*?)\1/);
      if (groupMatch) {
        const groupStr = groupMatch[0];
        const groupValue = groupMatch[2];
        const groupStart = line.indexOf(groupStr);
        const valueStart = groupStr.indexOf(groupValue);
        namePosition = { line: index + 1, column: groupStart + valueStart + 1 };
      }
    } else {
      // For string format like: "log4j:log4j:1.2.3"
      // Find the start of the group:artifact part inside the quotes
      const match = line.match(this.BETWEEN_QUOTES_REGEX);
      if (match) {
        const fullMatch = match[0]; // e.g., '"log4j:log4j:1.2.3"'
        const quotePos = line.indexOf(fullMatch);
        namePosition = { line: index + 1, column: quotePos + 2 }; // +1 to skip the opening quote
      }
    }
    const dep = new Dependency({ value: depName, position: namePosition });

    // determine dependency version
    const depVersion: string = myClassObj.version;
    if (depVersion) {
      dep.version = { value: depVersion.includes('$') ? this.replaceArgsInString(depVersion) : depVersion, position: { line: index + 1, column: line.indexOf(depVersion) + 1 } };
    } else {
      // if version is not specified, generate placeholder template
      if (keyValuePairs) {
        const quotedName = `"${myClassObj.name}"`;
        dep.context = {
          value: `name: ${quotedName}, version: "${VERSION_PLACEHOLDER}"`, range: new Range(
            new Position(index + 1, line.indexOf(`name: ${quotedName}`) + 1),
            new Position(index + 1, line.indexOf(`name: ${quotedName}`) + `name: ${quotedName}`.length + 1),
          )
        };
      } else {
        // invariant: if keyValuePairs is null, then depData is set
        depData = depData!;
        dep.context = {
          value: `${depData}:${VERSION_PLACEHOLDER}`, range: new Range(
            new Position(index + 1, line.indexOf(depData) + 1),
            new Position(index + 1, line.indexOf(depData) + depData.length + 1)
          )
        };
      }
    }
    return dep;
  }

  /**
   * Extracts dependencies from lines parsed from the file.
   * @param lines - An array of strings representing lines from the file.
   * @returns An array of Dependency objects representing extracted dependencies.
   */
  private extractDependenciesFromLines(lines: string[]): Dependency[] {
    let isSingleDependency: boolean = false;
    let isDependencyBlock: boolean = false;
    let isSingleArgument: boolean = false;
    let isArgumentBlock: boolean = false;
    let innerDepScopeBracketsCount: number = 0;
    return lines.reduce((dependencies: Dependency[], line: string, index: number) => {

      const cleanLine = line.split('//')[0].replace(this.COMMENT_REGEX, '').trim(); // Remove comments
      if (!cleanLine) { return dependencies; } // Skip empty lines
      const parsedLine = cleanLine.includes('$') ? this.replaceArgsInString(cleanLine) : cleanLine;
      const countOpenBrackets = (parsedLine.match(this.OPEN_BRACKETS_REGEX) || []).length;
      const countCloseBrackets = (parsedLine.match(this.CLOSE_BRACKETS_REGEX) || []).length;
      const updateInnerDepScopeBracketsCounter = () => {
        innerDepScopeBracketsCount += countOpenBrackets;
        innerDepScopeBracketsCount -= countCloseBrackets;
      };

      if (isDependencyBlock) {
        updateInnerDepScopeBracketsCounter();
      }

      if (isSingleDependency) {
        if (parsedLine.startsWith('{')) {
          updateInnerDepScopeBracketsCounter();
          isDependencyBlock = true;
        }
        isSingleDependency = false;
      }

      if (parsedLine.includes(this.DEPENDENCIES_SCOPE)) {
        updateInnerDepScopeBracketsCounter();

        if (innerDepScopeBracketsCount > 0) {
          isDependencyBlock = true;
        }

        if (innerDepScopeBracketsCount === 0) {
          isSingleDependency = true;
        }
      }

      if (isSingleDependency || isDependencyBlock) {
        if (innerDepScopeBracketsCount === 0) {
          isDependencyBlock = false;
        }

        if (!this.BETWEEN_QUOTES_REGEX.test(parsedLine)) {
          return dependencies;
        }

        const parsedDependency = this.parseLine(line, cleanLine, index);
        if (parsedDependency) {
          dependencies.push(parsedDependency);
        }
        return dependencies;
      }

      if (isSingleArgument) {
        if (parsedLine.startsWith('{')) {
          isArgumentBlock = true;
        }
        isSingleArgument = false;
      }

      if (parsedLine.includes(this.ARGS_SCOPE)) {
        if (parsedLine.includes('{')) {
          isArgumentBlock = true;
        } else {
          isSingleArgument = true;
        }
      }

      if (isSingleArgument || isArgumentBlock) {
        if (parsedLine.includes('}')) {
          isArgumentBlock = false;
        }

        const argDataMatch = parsedLine.match(this.FIND_KEY_VALUE_PAIRS_WITH_EQUALS_REGEX);
        if (argDataMatch) {
          this.args.set(argDataMatch[1].trim(), argDataMatch[3].trim());
        }
      }

      return dependencies;
    }, []);
  }

  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest content to collect dependencies from.
   * @returns A Promise resolving to an array of Dependency objects representing collected dependencies.
   */
  collect(contents: string): Dependency[] {
    const lines: string[] = this.parseTxtDoc(contents);
    return this.extractDependenciesFromLines(lines);
  }
}
