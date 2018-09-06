"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * Helper functions for working with VS Code workspaces.
 */
class WorkspaceEnvironmentUtil {
    currentRootPath() {
        return vscode.workspace.rootPath;
    }
}
exports.WorkspaceEnvironmentUtil = WorkspaceEnvironmentUtil;

//# sourceMappingURL=WorkspaceEnvironmentUtil.js.map
