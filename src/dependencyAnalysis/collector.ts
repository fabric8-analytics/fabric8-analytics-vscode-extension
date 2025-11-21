/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { IPositionedString, IPositionedContext, IPosition } from '../positionTypes';
import { isDefined } from '../utils';
import { ecosystemNameMappings, GRADLE } from '../constants';
import { Position, Range } from 'vscode';

export class Dependency {
  public version: IPositionedString | undefined;
  public context: IPositionedContext | undefined;

  constructor(public name: IPositionedString) { }
}

/**
 * Represents a map of dependencies using dependency name as key for easy retrieval of associated details.
 */
export class DependencyMap {
  mapper: Map<string, Dependency>;
  constructor(deps: Dependency[]) {
    this.mapper = new Map(deps.map(d => {
      return [d.name.value, d];
    }));
  }

  /**
   * Retrieves a dependency by its unique name key.
   * @param key - The unique name key for the desired dependency.
   * @returns The dependency object linked to the specified unique name key.
   */
  public get(key: string): Dependency | undefined {
    return this.mapper.get(key);
  }
}

/**
 * Represents an interface for providing ecosystem-specific dependencies.
 */
export interface IDependencyProvider {
  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest contents to collect dependencies from.
   * @returns A Promise resolving to an array of dependencies.
   */
  collect(contents: string): Dependency[];

  /**
   * Resolves a dependency reference to its actual name in the ecosystem.
   * @param ref - The reference string to resolve.
   * @returns The resolved name of the dependency.
   */
  resolveDependencyFromReference(ref: string): string;

  /**
   * Gets the name of the providers ecosystem.
   * @returns The name of the providers ecosystem.
   */
  getEcosystem(): string;
}

/**
 * Represents a resolver for ecosystem-specific dependencies.
 */
export class EcosystemDependencyResolver {
  private ecosystem: string;

  constructor(ecosystem: string) {
    this.ecosystem = ecosystem;
  }

  /**
   * Resolves a dependency reference in a specified ecosystem to its name and version string.
   * @param ref - The reference string to resolve.
   * @returns The resolved name of the dependency.
   */
  resolveDependencyFromReference(ref: string): string {
    return ref.replace(`pkg:${ecosystemNameMappings[this.ecosystem]}/`, '');
  }

  /**
   * Gets the name of the ecosystem this provider is configured for.
   * @returns The name of the ecosystem.
   */
  getEcosystem(): string {
    return this.ecosystem;
  }
}

/**
 * Retrieves the range of a dependency version or context within a text document.
 * @param dep - The dependency object containing version and context information.
 * @param ecosystem - The ecosystem of the dependency (optional).
 * @returns The range within the text document that represents the dependency.
 */
export function getRange(dep: Dependency, ecosystem?: string): Range {
  if (ecosystem === GRADLE) {
    // For Gradle, use the dependency name range instead of version
    const pos: IPosition = dep.name.position;
    const length = dep.name.value.length;
    return new Range(new Position(pos.line - 1, pos.column - 1), new Position(pos.line - 1, pos.column + length - 1));
  }
  if (isDefined(dep, 'version', 'position')) {
    const pos: IPosition = dep.version.position;
    const length = dep.version.value.length;
    return new Range(new Position(pos.line - 1, pos.column - 1), new Position(pos.line - 1, pos.column + length - 1));
  } else {
    return dep.context!.range;
  }
}