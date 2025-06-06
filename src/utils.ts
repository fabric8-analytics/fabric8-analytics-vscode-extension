'use strict';

import { settingNameMappings } from './constants';

/**
 * Applies setting name mappings to a given message.
 * This function replaces occurrences of keys in the `settingNameMappings` object
 * with their corresponding values in the provided message.
 * @param message - The message to which setting name mappings will be applied.
 * @returns The modified message with setting name mappings applied.
 */
export function applySettingNameMappings(message: string): string {
    let modifiedMessage = message;

    Object.keys(settingNameMappings).forEach(key => {
        const regex = new RegExp(key, 'g');
        modifiedMessage = modifiedMessage.replace(regex, settingNameMappings[key]);
    });

    return modifiedMessage;
}

export function buildErrorMessage(error: Error): string {
    let message = error.message;
    while (error.cause) {
        message = `${message}: ${(error.cause as Error).message}`;
        error = error.cause as Error;
    }
    return message;
}

/**
 * Checks if the specified keys are defined within the provided object.
 * @param obj - The object to check for key definitions.
 * @param keys - The keys to check for within the object.
 * @returns A boolean indicating whether all specified keys are defined within the object.
 */
export function isDefined(obj: any, ...keys: string[]): boolean {
    for (const key of keys) {
        if (!obj || !obj[key]) {
            return false;
        }
        obj = obj[key];
    }
    return true;
}