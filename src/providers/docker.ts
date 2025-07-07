/* --------------------------------------------------------------------------------------------
 * Copyright (c) Red Hat
 * Licensed under the Apache-2.0 License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { IImageProvider, IImage, Image } from '../imageAnalysis/collector';

/**
 * Process entries found in Dockerfile or Containerfile files.
 */
export class ImageProvider implements IImageProvider {

  args: Map<string, string> = new Map<string, string>();

  /**
   * Regular expression for matching 'FROM' statements.
   */
  FROM_REGEX: RegExp = /^\s*FROM\s+(.*)/;

  /**
   * Regular expression for matching 'ARG' statements.
   */
  ARG_REGEX: RegExp = /^\s*ARG\s+(.*)/;

  /**
   * Regular expression for matching platform information in 'FROM' statements.
   */
  PLATFORM_REGEX: RegExp = /--platform=([^\s]+)/g;

  /**
   * Regular expression for matching 'AS' statements in 'FROM' statements.
   */
  AS_REGEX: RegExp = /\s+AS\s+\S+/gi;

  /**
   * Parses the provided string as an array of lines.
   * @param contents - The string content to parse into lines.
   * @returns An array of strings representing lines from the provided content.
   * @private
   */
  private parseTxtDoc(contents: string): string[] {
    return contents.split('\n');
  }

  /**
   * Replaces placeholders in a string with values from a args map.
   * @param imageData - The string containing placeholders.
   * @returns The string with placeholders replaced by corresponding values from the args map.
   * @private
   */
  private replaceArgsInString(imageData: string): string {
    return imageData.replace(/(\$\{([^{}]+)\}|\$([^{}]+))/g, (match, fullMatch, key1, key2) => {
      const key = key1 || key2;
      const value = this.args.get(key) || '';
      return value;
    });
  }

  /**
   * Parses a line from the file and extracts image information.
   * @param line - The line to parse for image information.
   * @param index - The index of the line in the file.
   * @returns An IImage object representing the parsed image or null if no image is found.
   * @private
   */
  private parseLine(line: string, index: number): IImage | undefined {
    const argMatch = line.match(this.ARG_REGEX);
    if (argMatch) {
      const argData = argMatch[1].trim().split('=');
      this.args.set(argData[0], argData[1]);
    }

    const imageMatch = line.match(this.FROM_REGEX);
    if (imageMatch) {
      let imageData = imageMatch[1];
      imageData = this.replaceArgsInString(imageData);
      imageData = imageData.replace(this.PLATFORM_REGEX, '');
      imageData = imageData.replace(this.AS_REGEX, '');
      imageData = imageData.trim();

      if (imageData === 'scratch') {
        return;
      }

      const image = new Image({ value: imageData, position: { line: index + 1, column: 0 } }, line);

      const platformMatch = line.match(this.PLATFORM_REGEX);
      if (platformMatch) {
        image.platform = platformMatch[0].split('=')[1];
      }

      return image;
    }
    return;
  }

  /**
   * Extracts images from lines parsed from the file.
   * @param lines - An array of strings representing lines from the file.
   * @returns An array of IImage objects representing extracted images.
   * @private
   */
  private extractImagesFromLines(lines: string[]): IImage[] {
    return lines.reduce((images: IImage[], line: string, index: number) => {
      const parsedImage = this.parseLine(line, index);
      if (parsedImage) {
        images.push(parsedImage);
      }
      return images;
    }, []);
  }

  /**
   * Collects images from the provided image file contents.
   * @param contents - The image file content to collect images from.
   * @returns A Promise resolving to an array of IImage objects representing collected images.
   */
  collect(contents: string): IImage[] {
    const lines: string[] = this.parseTxtDoc(contents);
    return this.extractImagesFromLines(lines);
  }
}
