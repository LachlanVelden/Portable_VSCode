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
const vscode = require("vscode");
const session_1 = require("../session");
class AccessControlManager {
    constructor(accessControlService, fileSystemManager) {
        this.accessControlService = accessControlService;
        this.fileSystemManager = fileSystemManager;
        this.accessControl = {};
    }
    get isReadOnly() {
        return !!this.accessControl.isReadOnly;
    }
    joinCollaboration() {
        return __awaiter(this, void 0, void 0, function* () {
            this.accessControl = (yield this.accessControlService.getAccessControlAsync()) || {};
            this.accessControlService.onAccessControlChanged(this.accessControlChanged, this);
            session_1.SessionContext.IsReadOnly = this.isReadOnly;
            if (this.isReadOnly) {
                yield vscode.workspace.getConfiguration('files').update('autoSave', 'off', false);
            }
            this.fileSystemManager.registerFileSystemProvider(this.isReadOnly);
        });
    }
    accessControlChanged(e) {
        const oldReadOnly = this.isReadOnly;
        this.accessControl = e.accessControl || {};
        const isReadOnly = this.isReadOnly;
        if (oldReadOnly !== isReadOnly) {
            session_1.SessionContext.IsReadOnly = isReadOnly;
            vscode.workspace.getConfiguration('files').update('autoSave', isReadOnly ? 'off' : undefined, false);
            this.fileSystemManager.registerFileSystemProvider(isReadOnly);
        }
        // TODO: Figure out how to update opened documents, VSCode doesn't update their read-only status properly.
        // See https://github.com/Microsoft/vscode/issues/53256
    }
}
exports.AccessControlManager = AccessControlManager;

//# sourceMappingURL=accessControlManager.js.map
