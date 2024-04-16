'use strict';

import * as fs from 'fs';
import * as vscode from 'vscode';

import { globalConfig } from './config';
import { imageAnalysisService } from './exhortServices';
import { StatusMessages, Titles } from './constants';
import { updateCurrentWebviewPanel } from './rhda';

/**
 * Represents options for image analysis.
 */
interface IOptions {
    RHDA_TOKEN: string;
    RHDA_SOURCE: string;
    EXHORT_SYFT_PATH: string;
    EXHORT_SYFT_CONFIG_PATH: string;
    EXHORT_SKOPEO_PATH: string;
    EXHORT_SKOPEO_CONFIG_PATH: string;
    EXHORT_DOCKER_PATH: string;
    EXHORT_PODMAN_PATH: string;
    EXHORT_IMAGE_PLATFORM: string;
}

/**
 * Represents a reference to an image.
 */
interface IImageRef {
    image: string;
    platform: string;
}

/**
 * Represents the result of an image analysis.
 */
interface IImageAnalysis {
    options: IOptions;
    args: Map<string, string>;
    images: IImageRef[];
    imageAnalysisReportHtml: string;

    /**
     * Parses the provided file and returns its contents as an array of lines.
     * @param filePath - The path to the file to parse.
     * @returns An array of strings representing the lines of the file.
     */
    parseTxtDoc(filePath: string): string[];

    /**
     * Collects image references from the provided lines of text.
     * @param lines - The lines of text to process.
     * @returns An array of image references.
     */
    collectImages(lines: string[]): IImageRef[];

    /**
     * Runs the image analysis process.
     */
    runImageAnalysis(): Promise<void>;
}

/**
 * Represents an analysis of Docker images.
 */
class DockerImageAnalysis implements IImageAnalysis {
    options: IOptions = {
        'RHDA_TOKEN': globalConfig.telemetryId,
        'RHDA_SOURCE': globalConfig.utmSource,
        'EXHORT_SYFT_PATH': globalConfig.exhortSyftPath,
        'EXHORT_SYFT_CONFIG_PATH': globalConfig.exhortSyftConfigPath,
        'EXHORT_SKOPEO_PATH': globalConfig.exhortSkopeoPath,
        'EXHORT_SKOPEO_CONFIG_PATH': globalConfig.exhortSkopeoConfigPath,
        'EXHORT_DOCKER_PATH': globalConfig.exhortDockerPath,
        'EXHORT_PODMAN_PATH': globalConfig.exhortPodmanPath,
        'EXHORT_IMAGE_PLATFORM': globalConfig.exhortImagePlatform,
    };
    args: Map<string, string> = new Map<string, string>();
    images: IImageRef[] = [];
    imageAnalysisReportHtml: string = '';

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

    constructor(filePath: string) {
        const lines = this.parseTxtDoc(filePath);

        this.images = this.collectImages(lines);
    }

    parseTxtDoc(filePath: string): string[] {
        try {
            const contentBuffer = fs.readFileSync(filePath);

            const contentString = contentBuffer.toString('utf-8');

            return contentString.split('\n');
        } catch (err) {
            updateCurrentWebviewPanel('error');
            throw (err);
        }
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
     * @returns An IImage object representing the parsed image or null if no image is found.
     * @private
     */
    private parseLine(line: string): IImageRef | null {
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

            let platformData = '';
            const platformMatch = line.match(this.PLATFORM_REGEX);
            if (platformMatch) {
                platformData = platformMatch[0].split('=')[1];
            }

            return { image: imageData, platform: platformData };
        }
        return;
    }

    collectImages(lines: string[]): IImageRef[] {
        return lines.reduce((images: IImageRef[], line: string) => {
            const parsedImage = this.parseLine(line);
            if (parsedImage) {
                images.push(parsedImage);
            }
            return images;
        }, []);
    }

    async runImageAnalysis() {
        try {
            return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: Titles.EXT_TITLE }, async p => {
                return new Promise<void>(async (resolve, reject) => {
                    p.report({
                        message: StatusMessages.WIN_ANALYZING_DEPENDENCIES
                    });

                    // execute image analysis
                    await imageAnalysisService(this.images, this.options)
                        .then(async (resp) => {
                            p.report({
                                message: StatusMessages.WIN_GENERATING_DEPENDENCIES
                            });

                            updateCurrentWebviewPanel(resp);

                            p.report({
                                message: StatusMessages.WIN_SUCCESS_DEPENDENCY_ANALYSIS
                            });

                            this.imageAnalysisReportHtml = resp;

                            resolve();
                        })
                        .catch(err => {
                            p.report({
                                message: StatusMessages.WIN_FAILURE_DEPENDENCY_ANALYSIS
                            });

                            reject(err);
                        });
                });
            });
        } catch (err) {
            updateCurrentWebviewPanel('error');
            throw (err);
        }
    }
}

/**
 * Performs RHDA image analysis on provided image file.
 * @param filePath - The path to the image file to analyze.
 * @returns A Promise resolving to an Analysis Report HTML.
 */
async function executeDockerImageAnalysis(filePath: string): Promise<string> {
    try {
        const dockerImageAnalysis = new DockerImageAnalysis(filePath);
        await dockerImageAnalysis.runImageAnalysis();
        return dockerImageAnalysis.imageAnalysisReportHtml;
    } catch (error) {
        throw (error);
    }
}

export { executeDockerImageAnalysis, IImageRef, IOptions };