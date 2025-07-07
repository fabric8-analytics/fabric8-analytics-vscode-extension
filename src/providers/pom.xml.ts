/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { IDependencyProvider, EcosystemDependencyResolver, IDependency, Dependency } from '../dependencyAnalysis/collector';
import { parse, DocumentCstNode } from '@xml-tools/parser';
import { buildAst, accept, XMLElement, XMLDocument } from '@xml-tools/ast';
import { VERSION_PLACEHOLDER, MAVEN } from '../constants';
import { Position, Range } from 'vscode';

/**
 * Process entries found in the pom.xml file.
 */
export class DependencyProvider extends EcosystemDependencyResolver implements IDependencyProvider {

  constructor() {
    super(MAVEN); // set ecosystem to 'maven'
  }

  /**
   * Parses the provided XML string into an XMLDocument AST.
   * @param contents - The XML content to parse.
   * @returns The parsed XMLDocument AST.
   */
  private parseXml(contents: string): XMLDocument {
    const { cst, tokenVector } = parse(contents);
    return buildAst(cst as DocumentCstNode, tokenVector);
  }

  /**
   * Retrieves the root elements of a specified root element within the given XMLDocument.
   * @param document - The XMLDocument to search within.
   * @param rootElementName - The name of the root element to search for.
   * @returns An array of found XMLElements representing the root nodes.
   */
  private findRootNodes(document: XMLDocument, rootElementName: string): XMLElement[] {
    const properties: XMLElement[] = [];
    const propertiesElement = {
      visitXMLElement: (node: XMLElement) => {
        if (node.name === rootElementName) {
          properties.push(node);
        }
      },
    };
    accept(document, propertiesElement);
    return properties;
  }

  /**
   * Retrieves XML dependencies from the provided XMLDocument.
   * @param xmlAst - The XMLDocument AST to extract dependencies from.
   * @returns An array of XMLElements representing XML dependencies.
   */
  private getXMLDependencies(xmlAst: XMLDocument): XMLElement[] {
    const validElementNames = ['groupId', 'artifactId'];

    return this.findRootNodes(xmlAst, 'dependencies')
      .filter(e => {
        const parentElement = e.parent as XMLElement | undefined;
        return parentElement?.name !== 'dependencyManagement';
      }) //must not be a dependency under dependencyManagement
      .map(node => node.subElements)
      .flat(1)
      .filter(e => e.name === 'dependency')
      .filter(e => e.subElements.filter(elm => validElementNames.includes(elm.name ?? '')).length === validElementNames.length); // must include all validElementNames
  }

  /**
   * Maps XML dependencies to IDependency objects.
   * @param deps - The XML dependencies to map.
   * @returns An array of IDependency objects representing mapped dependencies.
   */
  private mapDependencies(deps: XMLElement[]): IDependency[] {

    /**
     * Define a class representing a dependency parsed from the pom.xml file
     */
    class PomDependency {
      public groupId: XMLElement;
      public artifactId: XMLElement;
      public version: XMLElement | undefined;

      constructor(public element: XMLElement) {
        // TODO: error check instead of null assert
        this.groupId = element.subElements.find(e => e.name === 'groupId')!;
        this.artifactId = element.subElements.find(e => e.name === 'artifactId')!;
        this.version = element.subElements.find(e => e.name === 'version');
      }

      /**
       * Verifies the validity of the parsed dependency by ensuring the existence and non-emptiness of the groupId and artifactId elements.
       * @returns A boolean indicating the validity of the parsed dependency.
       */
      isValid(): boolean {
        return [this.groupId, this.artifactId].find(e => !e.textContents[0]?.text) === undefined;
      }

    }

    /**
     * Converts a valid PomDependency into an IDependency object.
     * @param d - A PomDependency instance.
     * @returns An IDependency object derived from the PomDependency.
     */
    function toDependency(d: PomDependency): Dependency {
      const dep: Dependency = new Dependency(
        {
          value: `${d.groupId.textContents[0].text}/${d.artifactId.textContents[0].text}`,
          position: { line: d.element.position.startLine, column: d.element.position.startColumn }
        },
      );

      if (d.version && d.version.textContents.length > 0) {
        const versionVal = d.version.textContents[0];
        dep.version = {
          value: d.version.textContents[0].text ?? '',
          position: { line: versionVal.position.startLine, column: versionVal.position.startColumn },
        };
      } else {
        dep.context = {
          value: dependencyTemplate(d.element), range: new Range(
            new Position(d.element.position.startLine - 1, d.element.position.startColumn - 1),
            new Position(d.element.position.endLine - 1, d.element.position.endColumn),
          ),
        };
      }

      return dep;
    }

    /**
     * Generates a dependency template for missing version information.
     * @param dep - A XMLElement representing the dependency.
     * @returns A string representing a dependency template with a placeholder for the version.
     */
    function dependencyTemplate(dep: XMLElement): string {
      let template = '<dependency>';
      let idx = 0;
      const margin = dep.textContents[idx].text;

      dep.subElements.forEach(e => {
        if (e.name !== 'version') {
          template += `${dep.textContents[idx++].text}<${e.name}>${e.textContents[0].text}</${e.name}>`;
        }
      });

      template += `${margin}<version>${VERSION_PLACEHOLDER}</version>`;
      template += `${dep.textContents[idx].text}</dependency>`;

      return template;
    }

    return deps
      .filter(elm => !elm.subElements.find(subElm => (subElm.name === 'scope' && subElm.textContents[0]?.text === 'test')))
      .map(usableElm => new PomDependency(usableElm))
      .filter(pomDep => pomDep.isValid())
      .map(validPomDep => toDependency(validPomDep));
  }

  /**
   * Collects dependencies from the provided manifest contents.
   * @param contents - The manifest content to collect dependencies from.
   * @returns A Promise resolving to an array of IDependency objects representing collected dependencies.
   */
  collect(contents: string): IDependency[] {
    const xmlAst: XMLDocument = this.parseXml(contents);
    const deps = this.getXMLDependencies(xmlAst);
    return this.mapDependencies(deps);
  }

}
