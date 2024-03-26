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