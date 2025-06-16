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

// eslint-disable-next-line @typescript-eslint/naming-convention
type Require<T, K extends readonly PropertyKey[]> = K extends readonly [infer H, ...infer R]
    ? H extends keyof T
    ? R extends readonly PropertyKey[]
    ? R['length'] extends 0
    ? T & Required<Pick<T, H>>
    : T & { [P in H]-?: Require<NonNullable<T[P]>, R> }
    : never
    : never
    : T;

/**
 * Checks if the specified keys are defined within the provided object.
 * @param obj - The object to check for key definitions.
 * @param keys - The keys to check for within the object.
 * @returns A boolean indicating whether all specified keys are defined within the object.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function isDefined<T, K extends readonly PropertyKey[]>(obj: T, ...path: K): obj is Require<T, K> {
    return path.reduce((o, k) => o?.[k], obj as any) !== undefined;
}