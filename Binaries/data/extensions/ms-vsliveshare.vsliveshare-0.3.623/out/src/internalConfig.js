//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const url = require("url");
const path = require("path");
const fs = require("fs-extra");
const traceSource_1 = require("./tracing/traceSource");
const config_1 = require("./config");
const internalSettingsFilePath = path.join(__dirname, '..', '..', 'internalSettings.json');
const modifiedInternalSettingsFilePath = process.env.VSLS_SETTINGS_FILE ||
    path.join(__dirname, '..', '..', 'modifiedInternalSettings.json');
function getModifiedInternalSettings() {
    let settings = {};
    let modifiedInternalSettingsFileContent;
    try {
        modifiedInternalSettingsFileContent = fs.readFileSync(modifiedInternalSettingsFilePath, { encoding: 'utf-8' });
    }
    catch (e) { /* Missing file */ }
    if (modifiedInternalSettingsFileContent) {
        try {
            settings = JSON.parse(modifiedInternalSettingsFileContent);
        }
        catch (e) {
            // Don't show the "What's New" toast in the case of a corrupted modifiedInternalSettings.json.
            settings.whatsNewUri = '';
            traceSource_1.traceSource.info('Failed to parse modifiedInternalSettings.json');
        }
    }
    return settings;
}
const unmodifiedInternalSettings = JSON.parse(fs.readFileSync(internalSettingsFilePath, { encoding: 'utf-8' }));
const modifiedInternalSettings = getModifiedInternalSettings();
const internalSettings = Object.assign({}, unmodifiedInternalSettings, modifiedInternalSettings);
class InternalConfig {
    constructor() {
        this.internalSettings = internalSettings;
        this.modifiedInternalSettings = modifiedInternalSettings;
        this.userSettings = {};
    }
    static get Instance() {
        if (!InternalConfig.singleton) {
            InternalConfig.singleton = new InternalConfig();
        }
        return InternalConfig.singleton;
    }
    initAsync(context, userSettingsKeyString) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.get('isInternal') === 'undefined') {
                this.save('isInternal', isInternal(), false);
            }
            if (typeof this.get('canCollectPII') === 'undefined') {
                this.save('canCollectPII', canCollectPII(), false);
            }
            if (typeof this.get('progressShareCommandEnabled') === 'undefined') {
                this.save('progressShareCommandEnabled', progressShareCommandEnabled(this), false);
            }
            traceSource_1.TraceFormat.disableObfuscation = this.get('canCollectPII');
            let userSettingsFilePath = path.join(os.homedir(), internalSettings[userSettingsKeyString]);
            //Check that the file exists
            try {
                yield fs.access(userSettingsFilePath);
            }
            catch (e) {
                traceSource_1.traceSource.info('Did not find user settings at ' + traceSource_1.TraceFormat.formatPath(userSettingsFilePath));
                return;
            }
            try {
                this.userSettings = yield fs.readJson(userSettingsFilePath);
            }
            catch (e) {
                traceSource_1.traceSource.info('User settings are not valid JSON');
                return;
            }
            //In case this setting has changed after reading user settings
            traceSource_1.TraceFormat.disableObfuscation = this.get('isInternal');
        });
    }
    saveInternalSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.writeJson(modifiedInternalSettingsFilePath, this.modifiedInternalSettings, { spaces: '\t' });
        });
    }
    get(keyString) {
        return (typeof this.userSettings[keyString] !== 'undefined' ?
            this.userSettings[keyString] : this.internalSettings[keyString]);
    }
    getUserSettings() {
        return Object.assign(this.internalSettings, this.userSettings);
    }
    save(keyString, value, delaySaveToDisk) {
        this.internalSettings[keyString] = value;
        this.modifiedInternalSettings[keyString] = value;
        if (!delaySaveToDisk) {
            return this.saveInternalSettings();
        }
    }
    getUri(keyString) {
        let value = this.get(keyString);
        if (!value) {
            return null;
        }
        try {
            return url.parse(value);
        }
        catch (e) {
            return null;
        }
    }
}
const internalConfigInstance = InternalConfig.Instance;
exports.InternalConfig = internalConfigInstance;
const canCollectPIIDomains = [
    'redmond.corp.microsoft.com',
    'northamerica.corp.microsoft.com',
    'fareast.corp.microsoft.com',
    'ntdev.corp.microsoft.com',
    'wingroup.corp.microsoft.com',
    'southpacific.corp.microsoft.com',
    'wingroup.windeploy.ntdev.microsoft.com',
    'ddnet.microsoft.com'
];
function canCollectPII() {
    let userDomain = process.env.USERDNSDOMAIN ? process.env.USERDNSDOMAIN.toLowerCase() : '';
    return canCollectPIIDomains.indexOf(userDomain) >= 0;
}
function isInternal() {
    let userDomain = process.env.USERDNSDOMAIN ? process.env.USERDNSDOMAIN.toLowerCase() : '';
    return userDomain.endsWith('microsoft.com');
}
function progressShareCommandEnabled(config) {
    return typeof config.get(config_1.Key[config_1.Key.teamStatus]) !== 'undefined';
}

//# sourceMappingURL=internalConfig.js.map
