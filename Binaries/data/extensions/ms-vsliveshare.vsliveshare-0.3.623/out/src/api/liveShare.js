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
//
// Entrypoint and type definitions for Live Share for VS Code extension API
//
const path = require("path");
const vscode = require("vscode");
/**
 * Extension ID of the Live Share extension for VS Code.
 */
exports.extensionId = 'ms-vsliveshare.vsliveshare';
/**
 * Entrypoint for access to the Live Share API.
 *
 * @returns an instance of the Live Share API, or `null` if the Live Share extension
 * is not installed or failed to activate.
 *
 * @example To access the Live Share API from another extension:
 *
 *     import * as vsls from 'vsls/vscode';
 *     const liveshare = await vsls.getApiAsync();
 */
function getApi() {
    return __awaiter(this, void 0, void 0, function* () {
        const liveshareExtension = vscode.extensions.getExtension(exports.extensionId);
        if (!liveshareExtension) {
            // The extension is not installed.
            return null;
        }
        const extensionApi = liveshareExtension.isActive ?
            liveshareExtension.exports : yield liveshareExtension.activate();
        if (!extensionApi) {
            // The extensibility API is not enabled.
            return null;
        }
        const liveShareApiVersion = require(path.join(__dirname, 'package.json')).version;
        // Support deprecated function name to preserve compatibility with older versions of VSLS.
        if (!extensionApi.getApi)
            return extensionApi.getApiAsync(liveShareApiVersion);
        return extensionApi.getApi(liveShareApiVersion);
    });
}
exports.getApi = getApi;
/** @deprecated */
function getApiAsync() { return getApi(); }
exports.getApiAsync = getApiAsync;
var Role;
(function (Role) {
    Role[Role["None"] = 0] = "None";
    Role[Role["Host"] = 1] = "Host";
    Role[Role["Guest"] = 2] = "Guest";
})(Role = exports.Role || (exports.Role = {}));
/** This is just a placeholder for a richer access control model to be added later. */
var Access;
(function (Access) {
    Access[Access["None"] = 0] = "None";
    Access[Access["ReadOnly"] = 1] = "ReadOnly";
    Access[Access["ReadWrite"] = 3] = "ReadWrite";
    Access[Access["Owner"] = 255] = "Owner";
})(Access = exports.Access || (exports.Access = {}));

//# sourceMappingURL=liveShare.js.map