//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
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
    async joinCollaboration() {
        this.accessControl = await this.accessControlService.getAccessControlAsync() || {};
        this.accessControlService.onAccessControlChanged(this.accessControlChanged, this);
        session_1.SessionContext.IsReadOnly = this.isReadOnly;
        this.fileSystemManager.registerFileSystemProvider(this.isReadOnly);
    }
    accessControlChanged(e) {
        const oldReadOnly = this.isReadOnly;
        this.accessControl = e.accessControl || {};
        const isReadOnly = this.isReadOnly;
        if (oldReadOnly !== isReadOnly) {
            session_1.SessionContext.IsReadOnly = isReadOnly;
            this.fileSystemManager.registerFileSystemProvider(isReadOnly);
        }
        // TODO: Figure out how to update opened documents, VSCode doesn't update their read-only status properly.
        // See https://github.com/Microsoft/vscode/issues/53256
    }
}
exports.AccessControlManager = AccessControlManager;

//# sourceMappingURL=accessControlManager.js.map
