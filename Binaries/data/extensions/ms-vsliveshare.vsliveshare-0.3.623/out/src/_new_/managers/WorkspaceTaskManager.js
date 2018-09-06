"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkspaceTaskService = require("../../tasks/workspaceTaskService");
class WorkspaceTaskManager {
    constructor(rpcClient, workspaceService, workspaceAccessControlManager) {
        this.rpcClient = rpcClient;
        this.workspaceService = workspaceService;
        this.workspaceAccessControlManager = workspaceAccessControlManager;
    }
    init() {
        return WorkspaceTaskService.enable(this.rpcClient, this.workspaceService, this.workspaceAccessControlManager);
    }
    dispose() {
        return WorkspaceTaskService.disable();
    }
}
exports.WorkspaceTaskManager = WorkspaceTaskManager;

//# sourceMappingURL=WorkspaceTaskManager.js.map
