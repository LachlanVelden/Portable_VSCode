"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var JoinCommand_1;
const path = require("path");
const vscode = require("vscode");
const url = require("url");
const os = require("os");
const fse = require("fs-extra");
const configCore = require("../../config"); // TODO: Need to make injectable
const session_1 = require("../../session");
const sessionTypes_1 = require("../../sessionTypes");
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
const workspaceManager_1 = require("../../workspace/workspaceManager");
const ErrorNotificationCommandDecorator_1 = require("../decorators/ErrorNotificationCommandDecorator");
const TelemetryCommandDecorator_1 = require("../decorators/TelemetryCommandDecorator");
const TelemetryStatusCommandDecorator_1 = require("../decorators/TelemetryStatusCommandDecorator");
const SessionStateTransitionsCommandDecorator_1 = require("../decorators/SessionStateTransitionsCommandDecorator");
const AuthenticationCommandDecorator_1 = require("../decorators/AuthenticationCommandDecorator");
function builder(dependencies) {
    return new JoinCommand(dependencies.workspaceService(), dependencies.notificationUtil(), dependencies.clipboardUtil());
}
exports.builder = builder;
/**
 * Options that the Join command supports.
 */
class JoinCommandOptions {
    constructor() {
        // DISCUSSION POINT: Should `promptForCollaborationLink` and `collaborationLink`
        //                   mutually exclusive?
        //                   Probably should express which strategy one wants to use.
        this.promptForCollaborationLink = true;
        this.collaborationLink = null;
    }
}
exports.JoinCommandOptions = JoinCommandOptions;
// TODO: Still need to convert over.
/**
 * Join `command` that triggers an updates to the current workspace so
 * that the user can join a workspace.
 */
let JoinCommand = JoinCommand_1 = class JoinCommand {
    // NOTE: Note sure what doing with these yet.
    // public progressTitle = 'Join Workspace';
    // public isCancellable = true;
    // public vsCodeCommand = 'liveshare.join';
    constructor(workspaceService, notificationUtil, clipboardUtil) {
        this.workspaceService = workspaceService;
        this.notificationUtil = notificationUtil;
        this.clipboardUtil = clipboardUtil;
    }
    invoke() {
        return __awaiter(this, void 0, void 0, function* () {
            // OPTIONS
            let options = new JoinCommandOptions();
            options.promptForCollaborationLink = true;
            options.collaborationLink = null;
            // OPTIONS
            // VALIDATION
            if (session_1.SessionContext.State === sessionTypes_1.SessionState.Joined) {
                throw new Error('Already joined a collaboration session.');
            }
            else if (session_1.SessionContext.State === sessionTypes_1.SessionState.Shared) {
                throw new Error('Already hosting a collaboration session.');
            }
            // VALIDATION
            const joinCollaborationLink = yield this.fetchJoinLink(options);
            this.telemetryEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.JOIN_WITH_LINK, true);
            // NOTE: Client commands shouldn't worry about user info/auth
            // const userInfo = await this.signIn({ openLoginPage: true });
            // if (!userInfo) {
            //     joinEvent.end(TelemetryResult.Cancel, 'Join canceled - sign-in failed or was cancelled.');
            //     // Sign-in failed or was cancelled.
            //     return;
            // }
            // joinEvent.markTime(TelemetryPropertyNames.SIGN_IN_COMPLETE);
            // SessionContext.userInfo = userInfo;
            const workspaceInfo = yield this.getWorkspaceFromLink(joinCollaborationLink);
            if (!workspaceInfo) {
                return false;
            }
            //telemetryEvent.markTime(TelemetryPropertyNames.GET_WORKSPACE_COMPLETE);
            session_1.SessionContext.point(telemetryStrings_1.TelemetryPropertyNames.GET_WORKSPACE_COMPLETE);
            const isNewWindow = this.determineShouldOpenNewWindow(workspaceInfo.id, options);
            const workspaceFolder = yield this.getAndValidateWorkspaceFolder(isNewWindow, workspaceInfo);
            const workspaceFilePath = this.getWorkspaceFilePath(workspaceFolder);
            // TODO: Only need to persist settings if we are reloading the workspace
            //       which may not be the case if we can prevent reload in the case of
            //       a blank workspace.
            const workspaceUri = yield this.persistWorkspaceSettings(workspaceFolder, workspaceFilePath, this.telemetryEvent.getCorrelationId(), workspaceInfo);
            // TODO: confirm that this isn't blocking
            // TODO: need to abstract command, easier testing
            vscode.commands.executeCommand('vscode.openFolder', workspaceUri, isNewWindow);
            return true;
        });
    }
    fetchJoinLink(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let joinCollaborationLink;
            if (options.promptForCollaborationLink) {
                let clipboardValue = '';
                try {
                    clipboardValue = this.clipboardUtil.pasteFromClipboard().trim();
                }
                catch (e) {
                    // do not pull value from clipboard
                }
                // TODO: This will now count towards join time, need to deal with this
                joinCollaborationLink = yield this.notificationUtil.showInputBox({
                    prompt: 'Enter a link to the workspace to join',
                    ignoreFocusOut: true,
                    value: JoinCommand_1.joinLinkRegex.test(clipboardValue) ? clipboardValue : ''
                });
                if (!joinCollaborationLink) {
                    // The user cancelled out of the input dialog.
                    return;
                }
            }
            else if (options.collaborationLink) {
                joinCollaborationLink = options.collaborationLink;
            }
            if (!joinCollaborationLink) {
                throw new Error('Collaboration Link not provided');
            }
            joinCollaborationLink = joinCollaborationLink.trim();
            return joinCollaborationLink;
        });
    }
    getWorkspaceFromLink(joinCollaborationLink) {
        return __awaiter(this, void 0, void 0, function* () {
            const linkMatch = JoinCommand_1.joinLinkRegex.exec(joinCollaborationLink);
            const cascadeMatch = JoinCommand_1.cascadeLinkRegex.exec(joinCollaborationLink);
            if (!linkMatch && !cascadeMatch) {
                throw new Error('The specified value isn’t a valid Live Share URL. Please check the link provided by the host and try again.');
            }
            const workspaceId = (linkMatch && linkMatch[1]) || (cascadeMatch && cascadeMatch[1]);
            const workspace = yield this.workspaceService.getWorkspaceAsync(workspaceId);
            if (!workspace || !workspace.joinUri) {
                // No workspace or joinUri found - handle the error from the caller
                return undefined;
            }
            if (cascadeMatch) {
                // protocol handler links are currently not validated
                return workspace;
            }
            const { hostname: linkHostname } = url.parse(joinCollaborationLink);
            const { hostname: workspaceHostname } = url.parse(workspace.joinUri);
            if (linkHostname !== workspaceHostname) {
                throw new Error('The specified hostname isn’t a valid Live Share URL. Please check the link provided by the host and try again.');
            }
            return workspace;
        });
    }
    determineShouldOpenNewWindow(workspaceId, options) {
        // If we have an indication that we're attempting join the same session,
        // from a session we'd left, but hadn't been able to close the workspace
        // then force opening in a new window. See leaveCollaboration for more.
        // TODO: need to abstract command, easier testing
        const hadOpenedId = vscode.workspace.getConfiguration().get(JoinCommand_1.joinWorkspaceHadOpenedIdSettingName);
        return configCore.get(configCore.Key.joinInNewWindow) || (hadOpenedId === workspaceId) || (options && options.newWindow);
    }
    getAndValidateWorkspaceFolder(isNewWindow, workspaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let workspaceFolder = path.join(os.tmpdir(), `tmp-${workspaceInfo.id}`);
            if (isNewWindow) {
                workspaceFolder += `_${Date.now()}`;
            }
            yield fse.ensureDir(workspaceFolder);
            // NOTE: Shouldn't need to explicitly catch here any more
            // try {
            //     await fse.ensureDir(workspaceFolder);
            // } catch (e) {
            //     const telemetryMessage = 'Join failed on workspace folder creation ' + e.code;
            //     Telemetry.sendJoinFault(FaultType.Error, telemetryMessage, e);
            //     throw e;
            // }
            return workspaceFolder;
        });
    }
    getWorkspaceFilePath(workspaceFolder) {
        return path.join(workspaceFolder, `${configCore.get(configCore.Key.name)}.code-workspace`);
    }
    persistWorkspaceSettings(workspaceFolder, workspaceFilePath, correlationId, workspaceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceDefinition = new workspaceManager_1.WorkspaceDefinition();
            const cascadeFolder = { 'uri': JoinCommand_1.cascadeLauncherScheme + '/', name: (workspaceInfo.name || 'Loading file tree...') };
            workspaceDefinition.folders.push(cascadeFolder);
            // settings
            workspaceDefinition.settings[JoinCommand_1.joinWorkspaceIdSettingName] = workspaceInfo.id;
            workspaceDefinition.settings[JoinCommand_1.joinWorkspaceIdFolderSettingName] = workspaceFolder;
            workspaceDefinition.settings['files.hotExit'] = 'off';
            // disable task auto-detect for built-in providers
            workspaceDefinition.settings['typescript.tsc.autoDetect'] = 'off';
            workspaceDefinition.settings['jake.autoDetect'] = 'off';
            workspaceDefinition.settings['grunt.autoDetect'] = 'off';
            workspaceDefinition.settings['gulp.autoDetect'] = 'off';
            workspaceDefinition.settings['npm.autoDetect'] = 'off';
            // This setting allows guests to set breakpoints in any file within the workspace they
            // are joining, without requiring them to install the respective language extensions.
            workspaceDefinition.settings['debug.allowBreakpointsEverywhere'] = true;
            yield workspaceManager_1.WorkspaceManager.createWorkspace(workspaceFilePath, workspaceDefinition);
            yield configCore.save(configCore.Key.joinWorkspaceLocalPath, workspaceFilePath, true, true);
            yield configCore.save(configCore.Key.joinEventCorrelationId, correlationId, true, true);
            yield configCore.save(configCore.Key.workspaceReloadTime, Date.now(), true);
            // TODO!!!! Save the command that we want to run when the reload happens
            // TODO!!!! Saev the ID of the named pipe so we can reconnect to agent
            // TODO: need to abstract command, easier testing
            return vscode.Uri.file(workspaceFilePath);
        });
    }
};
JoinCommand.joinLinkRegex = /^https?:\/\/.*\/join\/?\?([0-9A-Z]+)$/i;
JoinCommand.cascadeLauncherScheme = `${configCore.get(configCore.Key.scheme)}:`;
JoinCommand.cascadeLinkRegex = new RegExp(`${JoinCommand_1.cascadeLauncherScheme}\?.*join.*workspaceId=([0-9A-Z-]+)`, 'i');
JoinCommand.joinWorkspaceIdSettingName = 'vsliveshare.join.reload.workspaceId';
JoinCommand.joinWorkspaceHadOpenedIdSettingName = 'vsliveshare.join.reload.hadOpenedworkspaceId';
JoinCommand.joinWorkspaceIdFolderSettingName = 'vsliveshare.join.reload.workspaceFolder';
JoinCommand = JoinCommand_1 = __decorate([
    ErrorNotificationCommandDecorator_1.errorNotificationCommandDecorator(telemetryStrings_1.TelemetryEventNames.JOIN_FAULT),
    TelemetryCommandDecorator_1.telemetryCommandDecorator(telemetryStrings_1.TelemetryEventNames.JOIN_WORKSPACE, telemetryStrings_1.TelemetryEventNames.JOIN_FAULT, 'Join', 1),
    TelemetryStatusCommandDecorator_1.telemetryStatusCommandDecorator(),
    SessionStateTransitionsCommandDecorator_1.sessionStateTransitionsCommandDecorator(session_1.SessionAction.AttemptJoining, session_1.SessionAction.JoiningPendingReload, session_1.SessionAction.JoiningError),
    AuthenticationCommandDecorator_1.authenticationCommandDecorator()
], JoinCommand);
exports.JoinCommand = JoinCommand;

//# sourceMappingURL=JoinCommand.js.map
