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
const config = require("../config");
const traceSource_1 = require("../tracing/traceSource");
/**
 * Settings that are used during LiveShare collab sessions, to set on the workspace file.
 */
const baseWorkspaceSettings = {
    'files.hotExit': 'off',
    // disable task auto-detect for built-in providers
    'typescript.tsc.autoDetect': 'off',
    'jake.autoDetect': 'off',
    'grunt.autoDetect': 'off',
    'gulp.autoDetect': 'off',
    'npm.autoDetect': 'off',
    // This setting allows guests to set breakpoints in any file within the workspace they
    // are joining, without requiring them to install the respective language extensions.
    'debug.allowBreakpointsEverywhere': true
};
let pendingFolderUpdates;
function beginFolderUpdate() {
    if (!pendingFolderUpdates) {
        pendingFolderUpdates = new Promise((resolve) => {
            const handler = vscode.workspace.onDidChangeWorkspaceFolders((e) => {
                handler.dispose();
                pendingFolderUpdates = null;
                resolve();
            });
        });
    }
    return pendingFolderUpdates;
}
function waitForPendingFolderUpdatesToFinish() {
    if (pendingFolderUpdates) {
        return pendingFolderUpdates;
    }
    return Promise.resolve();
}
function ensureWorkspaceName(workspaceSessionInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!workspaceSessionInfo || (vscode.workspace.workspaceFolders[0].name === workspaceSessionInfo.name)) {
            return;
        }
        // Add all folders in one operation rather than individually for
        // the best experience. However, when doing this you can't
        // perform any more update folder operations till this one
        // completes, hence ensuring the name waiting for the event.
        yield waitForPendingFolderUpdatesToFinish();
        beginFolderUpdate();
        // update workspace name
        vscode.workspace.updateWorkspaceFolders(0, 1, {
            uri: vscode.workspace.workspaceFolders[0].uri,
            name: workspaceSessionInfo.name
        });
    });
}
class JoinUtilities {
    static addAdditionalRootsFromFileServiceToWorkspace(fileService, workspaceSessionInfo) {
        // Start the folder update. Note, we don't want to _wait_ for these
        // folders to complete, nor for the list roots call to complete befpre
        // returning. So we start them and handle them in a promise after.
        ensureWorkspaceName(workspaceSessionInfo);
        // Becuase only one folder change can be inflight at a time, but we don't
        // want to wait to start the call to the list roots, so also start that
        // and then wait on _all_ of them to process them.
        const workspaceNameUpdate = waitForPendingFolderUpdatesToFinish();
        let listRoots = Promise.resolve([]);
        if (config.featureFlags.multiRootWorkspaceVSCode) {
            // If multitroots are only, actually do the call instead of
            // completing with an empty array.
            listRoots = fileService.listRootsAsync({ enableMultipleRoots: true });
        }
        Promise.all([workspaceNameUpdate, listRoots]).then((result) => __awaiter(this, void 0, void 0, function* () {
            // second result from promise all contains the listed roots, if any
            let roots = result[1];
            if (roots.length < 2) {
                ensureWorkspaceName(workspaceSessionInfo);
                return;
            }
            // We already added the first root (it's what we opened
            // with), so we only need the other roots.
            roots = roots.slice(1);
            // Convert the paths into URIs
            const workspaceFolders = roots.map((root, index) => {
                return {
                    uri: vscode.Uri.parse(`${config.get(config.Key.scheme)}:${root.path}`),
                    name: root.friendlyName || `Workspace ${index + 1}`,
                };
            });
            yield waitForPendingFolderUpdatesToFinish();
            beginFolderUpdate();
            ensureWorkspaceName(workspaceSessionInfo);
            const didAddFolders = vscode.workspace.updateWorkspaceFolders(1, 0, ...workspaceFolders);
            if (!didAddFolders) {
                traceSource_1.traceSource.error('Unable to add non-primary workspace folders');
            }
        }));
    }
    /**
     * Function to restore LiveShare workspace without a reload.
     * @param workspaceid Workspace id string.
     * @param workspaceName Worksapce name string, if present.
     * @returns void
     */
    static restoreLiveshareWorkspaceState(workspaceid, workspaceName = 'Loading file tree...') {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = vscode.workspace.getConfiguration();
            yield settings.update('vsliveshare.join.reload.workspaceId', workspaceid, vscode.ConfigurationTarget.Workspace);
            for (let settingName of Object.keys(baseWorkspaceSettings)) {
                try {
                    yield settings.update(settingName, baseWorkspaceSettings[settingName], vscode.ConfigurationTarget.Workspace);
                }
                catch (e) {
                    traceSource_1.traceSource.info(`[workspace restoration]: Failed to set the "${settingName}" setting on the workspace.`);
                }
            }
            let primaryWorkspaceRoot = `${config.get(config.Key.scheme)}:/`;
            yield waitForPendingFolderUpdatesToFinish();
            beginFolderUpdate();
            const didAddFolder = vscode.workspace.updateWorkspaceFolders(0, null, {
                uri: vscode.Uri.parse(primaryWorkspaceRoot),
                name: workspaceName
            });
            return;
        });
    }
    /**
     * Function to checfk if the VSCode instance loaded in context of LiveShare workspace that does not have folders.
     * @param workspace VSCode workspace to check on.
     * @returns boolean Whether the workspace is LiveShare workspace with no folders.
     */
    static isBrokenLiveshareWorkspaceFile(workspace) {
        const isNameMatch = (workspace.name === 'Visual Studio Live Share (Workspace)');
        const isEmptyFolders = workspace.workspaceFolders && (workspace.workspaceFolders.length === 0);
        return isNameMatch && isEmptyFolders;
    }
    static getBaseWorkspaceSettings() {
        return Object.assign({}, baseWorkspaceSettings);
    }
}
exports.JoinUtilities = JoinUtilities;

//# sourceMappingURL=joinUtilities.js.map
