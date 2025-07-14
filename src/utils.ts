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

/**
 * Builds a message from an error to be displayed in a popup notification to a user.
 * This should ideally be terse and direct users to the logs in the Output channel
 * to get more in-depth information such as stdout/stderr.
 * @param error the error to render
 * @returns rendered notification message
 */
export function buildNotificationErrorMessage(error: Error): string {
  let message = error.message;
  while (error.cause) {
    if (Object.hasOwn(error.cause, 'stdout')) {
      message = `${message}, please check the Output panel for more details.`;
    } else {
      message = `${message}: ${(error.cause as Error).message}`;
    }
    error = error.cause as Error;
  }
  return message;
}

/**
 * Builds a message from an error to be displayed in the Output tab channel
 * (via DepOutputChannel). This should include more information than shown in 
 * the popup notification.
 * @param error the error to render
 * @returns rendered log message
 */
export function buildLogErrorMessage(error: Error): string {
  let message = error.message;
  let execErr: (Error & { stderr: string, stdout: string }) | null = null;
  while (error.cause) {
    if (Object.hasOwn(error.cause, 'stdout')) {
      execErr = error.cause as (Error & { stderr: string, stdout: string });
    }
    message = `${message}: ${(error.cause as Error).message}`;
    error = error.cause as Error;
  }

  if (execErr) {
    message += `\nSTDOUT:\n${execErr.stdout.trim() || '<none>'}\n\nSTDERR:\n${execErr.stderr.trim() || '<none>'}`;
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