/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Range } from 'vscode';

/**
 * Represents a position inside the manifest file with line and column information.
 */
export interface IPosition {
  line: number;
  column: number;
}

/**
 * Represents a string value with associated position information.
 */
export interface IPositionedString {
  value: string;
  position: IPosition;
}

/**
 * Represents a context with a string value and its associated range.
 */
export interface IPositionedContext {
  value: string;
  range: Range;
}

