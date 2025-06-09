/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { IPositionedString, IPosition } from '../positionTypes';
import { Position, Range } from 'vscode';
import { parseImageReference } from '../exhortServices';
/**
 * Represents an image specification.
 */
export interface IImage {
  name: IPositionedString;
  line: string;
  platform: string | undefined;
}

/**
 * Represents an image and implements the IImage interface.
 */
export class Image implements IImage {
  public platform: string | undefined;

  constructor(
    public name: IPositionedString,
    public line: string
  ) { }
}

/**
 * Represents an interface for providing ecosystem-specific images.
 */
export interface IImageProvider {

  /**
   * Collects images from the provided image file contents.
   * @param contents - The image file contents to collect images from.
   * @returns A Promise resolving to an array of images.
   */
  collect(contents: string): IImage[];
}

/**
 * Represents a map of arrays of images using the shared image name as the key for easy retrieval of associated details.
 */
export class ImageMap {
  mapper: Map<string, IImage[]>;

  /**
   * Creates an instance of ImageMap.
   * @param images - The array of images to initialize the map with.
   */
  constructor(images: IImage[]) {
    // exhort API gives us the analysis results as a map of purl to data, so we need
    // to store the keys as purl's here too.
    this.mapper = new Map();
    images.forEach(image => {
      // TODO: would be nice to collapse IImage and IImageRef
      const parsedImageRef = parseImageReference({
        image: image.name.value,
        platform: image.platform,
      });
      if (this.mapper.has(parsedImageRef.getPackageURL().toString())) {
        this.mapper.get(parsedImageRef.getPackageURL().toString())!.push(image);
      } else {
        this.mapper.set(parsedImageRef.getPackageURL().toString(), [image]);
      }
    });
  }

  /**
   * Retrieves an array of images by their unique name key.
   * @param key - The unique name key for the desired images.
   * @returns The array of images linked to the specified unique name key.
   */
  public get(key: string): IImage[] {
    const images: IImage[] = [];
    if (this.mapper.has(key)) {
      images.push(...this.mapper.get(key) ?? []);
    }

    // Check if the key includes ":latest"
    if (key.includes(':latest')) {
      const keyWithoutLatest = key.replace(':latest', '');
      if (this.mapper.has(keyWithoutLatest)) {
        images.push(...this.mapper.get(keyWithoutLatest) ?? []);
      }
    }

    return images;
  }
}

/**
 * Retrieves the range of an image within a image document.
 * @param img - The image object image position information.
 * @returns The range within the image document that represents the image.
 */
export function getRange(img: IImage): Range {
  const pos: IPosition = img.name.position;
  const length = img.line.length;

  return new Range(new Position(pos.line - 1, pos.column), new Position(pos.line - 1, pos.column + length));
}