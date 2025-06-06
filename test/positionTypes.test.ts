'use strict';

import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

import { IPosition, IPositionedString, IPositionedContext } from '../src/positionTypes';
import { Position, Range } from 'vscode';

suite('Position Types tests', () => {
  suite('IPosition Interface', () => {
    test('should have properties line and column', () => {
      const position: IPosition = { line: 1, column: 5 };
      expect(position).to.have.property('line');
      expect(position).to.have.property('column');
    });
  });

  suite('IPositionedString Interface', () => {
    test('should have properties value and position', () => {
      const positionedString: IPositionedString = { value: 'test', position: { line: 1, column: 5 } };
      expect(positionedString).to.have.property('value');
      expect(positionedString).to.have.property('position');
    });
  });

  suite('IPositionedContext Interface', () => {
    test('should have properties value and range', () => {
      // Import Range from 'vscode-languageserver' to mock the range object
      const rangeMock = new Range(new Position(1, 0), new Position(1, 5));
      const positionedContext: IPositionedContext = { value: 'test', range: rangeMock };
      expect(positionedContext).to.have.property('value');
      expect(positionedContext).to.have.property('range');
    });
  });
});