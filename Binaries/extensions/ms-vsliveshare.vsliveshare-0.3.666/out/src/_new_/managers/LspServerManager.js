"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lspServer = require("../../languageService/lspServer");
class LspServerManager {
    constructor(workspaceService, workspaceAccessControlManager) {
        this.workspaceService = workspaceService;
        this.workspaceAccessControlManager = workspaceAccessControlManager;
    }
    init() {
        return lspServer.activateAsync(this.workspaceService, this.workspaceAccessControlManager);
    }
    dispose() {
        return lspServer.dispose();
    }
    setupHandlers(languageServerProvider) {
        lspServer.setupHandlers(languageServerProvider, this.workspaceAccessControlManager);
    }
}
exports.LspServerManager = LspServerManager;

//# sourceMappingURL=LspServerManager.js.map
