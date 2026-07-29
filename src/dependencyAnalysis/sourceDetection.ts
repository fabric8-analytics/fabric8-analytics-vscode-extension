/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

/** Checks whether the source identifier indicates a Red Hat or RHLW source. */
function isRedHatSource(sourceId: string): boolean {
  const s = sourceId.toLowerCase();
  return s.includes('redhat') || s.includes('rhlw');
}

/** Checks whether the source identifier indicates an RHLW (Red Hat Lightwell) source. */
function isRhlwSource(sourceId: string): boolean {
  return sourceId.toLowerCase().includes('rhlw');
}

export { isRedHatSource, isRhlwSource };
