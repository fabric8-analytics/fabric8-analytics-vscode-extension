'use strict';

import { settingNameMappings } from './constants';

export function applySettingNameMappings(message: string): string {
    let modifiedMessage = message;

    Object.keys(settingNameMappings).forEach(key => {
        const regex = new RegExp(key, 'g');
        modifiedMessage = modifiedMessage.replace(regex, settingNameMappings[key]);
    });

    return modifiedMessage;
}