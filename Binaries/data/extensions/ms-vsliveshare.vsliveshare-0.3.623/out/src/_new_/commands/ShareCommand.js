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
const vscode = require("vscode");
const util = require("../../util"); // TODO: Need to make injectable
const config_1 = require("../../config");
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
const session_1 = require("../../session");
const sessionTypes_1 = require("../../sessionTypes");
const UserError_1 = require("../abstractions/UserError");
const ErrorNotificationCommandDecorator_1 = require("../decorators/ErrorNotificationCommandDecorator");
const TelemetryCommandDecorator_1 = require("../decorators/TelemetryCommandDecorator");
const TelemetryStatusCommandDecorator_1 = require("../decorators/TelemetryStatusCommandDecorator");
const SessionStateTransitionsCommandDecorator_1 = require("../decorators/SessionStateTransitionsCommandDecorator");
const AuthenticationCommandDecorator_1 = require("../decorators/AuthenticationCommandDecorator");
const ValidationCommandDecorator_1 = require("../decorators/ValidationCommandDecorator");
const ProgressCommandDecorator_1 = require("../decorators/ProgressCommandDecorator");
const liveShare_1 = require("../../api/liveShare");
function builder(dependencies) {
    return new ShareCommand(dependencies.workspaceService(), dependencies.sessionContext(), dependencies.workspaceFirewallUtil(), dependencies.workspaceEnvironmentUtil(), dependencies.workspacePromptsUtil(), dependencies.configUtil(), dependencies.coEditingManager(), dependencies.shareDebugManager(), dependencies.lspServerManager(), dependencies.workspaceTaskManager(), dependencies.workspaceCommandManager(), dependencies.shareBreakpointManager(), dependencies.guestTrackerManager(), dependencies.workspaceAccessControlManager());
}
exports.builder = builder;
/**
 * Share `command` that sets up a workspace which guests can connect to.
 */
let ShareCommand = class ShareCommand {
    constructor(workspaceService, sessionContext, workspaceFirewallUtil, workspaceEnvironmentUtil, workspacePromptsUtil, configUtil, coEditingManager, shareDebugManager, lspServerManager, workspaceTaskManager, workspaceCommandManager, shareBreakpointManager, guestTrackerManager, workspaceAccessControlManager) {
        this.workspaceService = workspaceService;
        this.sessionContext = sessionContext;
        this.workspaceFirewallUtil = workspaceFirewallUtil;
        this.workspaceEnvironmentUtil = workspaceEnvironmentUtil;
        this.workspacePromptsUtil = workspacePromptsUtil;
        this.configUtil = configUtil;
        this.workspaceAccessControlManager = workspaceAccessControlManager;
        this.postSetupManagers = [];
        // TODO: Probably could setup outside of this instance so
        //       that the command doesn't have to
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_COMMAND_COMPLETE, instance: workspaceCommandManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_COEDITING_COMPLETE, instance: coEditingManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_LSP_COMPLETE, instance: lspServerManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_BREAKPOINT_COMPLETE, instance: shareBreakpointManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_TASK_COMPLETE, instance: workspaceTaskManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_DEBUGGING_COMPLETE, instance: shareDebugManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_BREAKPOINT_COMPLETE, instance: guestTrackerManager });
        this.postSetupManagers.push({ status: telemetryStrings_1.TelemetryPropertyNames.INIT_ACCESS_CONTROL_COMPLETE, instance: workspaceAccessControlManager });
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let sessionInfo;
            // Start sharing if not shared
            if (this.sessionContext.State !== sessionTypes_1.SessionState.Shared) {
                sessionInfo = yield this.shareWorkspace(context.cancellationToken);
                // Pull out ambient workspace
            }
            else {
                sessionInfo = this.sessionContext.workspaceSessionInfo;
            }
            // Set session read-only if requested.
            if (options && options.access === liveShare_1.Access.ReadOnly) {
                this.workspaceAccessControlManager.setReadOnly(true);
            }
            // Show invitation link
            if (!(options && options.suppressNotification)) {
                this.workspacePromptsUtil.showInvitationLink();
            }
            // Return URL when we have one
            if (sessionInfo) {
                vscode.workspace.saveAll(false);
                return vscode.Uri.parse(sessionInfo.joinUri);
                // If no workspace was found return null
            }
            else {
                context.trace.info('Share was not successful due to null "SessionContext.workspaceSessionInfo".');
                return null;
            }
        });
    }
    shareWorkspace(cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Firewall check is going into the agent
            if (!(yield this.workspaceFirewallUtil.performFirewallCheckAsync())) {
                throw new UserError_1.UserError('Firewall check failed.', 'error.BlockActionShareFailed');
            }
            this.sessionContext.point(telemetryStrings_1.TelemetryPropertyNames.FIREWALL_CHECK_COMPLETE);
            // Agent call to share workspace
            this.sessionContext.point(telemetryStrings_1.TelemetryPropertyNames.SHARE_WORKSPACE_STARTING);
            const shareInfo = this.buildShareInfo();
            const workspaceSessionInfo = yield this.workspaceService.shareWorkspaceAsync(shareInfo, cancellationToken);
            if (!workspaceSessionInfo) {
                throw new Error('Failed to create a collaboration session. An error occurred while sending the request.');
            }
            this.sessionContext.point(telemetryStrings_1.TelemetryPropertyNames.SHARE_WORKSPACE_COMPLETE);
            // Persist `workspaceSessionInfo` into session context
            this.sessionContext.workspaceSessionInfo = workspaceSessionInfo;
            // Setup various managers
            this.postSetupManagers.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                yield x.instance.init();
                this.sessionContext.point(x.status);
            }));
            return workspaceSessionInfo;
        });
    }
    buildShareInfo() {
        const currentRootPath = this.workspaceEnvironmentUtil.currentRootPath();
        return {
            rootDirectories: [currentRootPath],
            name: util.PathUtil.getWorkspaceName(currentRootPath),
            connectionMode: this.configUtil.get(config_1.Key.connectionMode)
        };
    }
    validate(options, context) {
        const sessionContext = this.sessionContext;
        if (sessionContext.State === sessionTypes_1.SessionState.Joined) {
            // TODO: Switch to using error code
            throw new Error('Already joined a collaboration session.');
        }
        else if (!vscode.workspace.rootPath) {
            // TODO: Switch to using error code
            throw new UserError_1.UserError('You must open a folder or workspace before you can start a session.');
        }
    }
};
ShareCommand = __decorate([
    ErrorNotificationCommandDecorator_1.errorNotificationCommandDecorator(telemetryStrings_1.TelemetryEventNames.SHARE_FAULT),
    TelemetryCommandDecorator_1.telemetryCommandDecorator(telemetryStrings_1.TelemetryEventNames.SHARE_WORKSPACE, telemetryStrings_1.TelemetryEventNames.SHARE_FAULT, 'Share', 1),
    TelemetryStatusCommandDecorator_1.telemetryStatusCommandDecorator(),
    ValidationCommandDecorator_1.validationCommandDecorator(),
    ProgressCommandDecorator_1.progressCommandDecorator('Sharing Workspace'),
    SessionStateTransitionsCommandDecorator_1.sessionStateTransitionsCommandDecorator(session_1.SessionAction.AttemptSharing, session_1.SessionAction.SharingSuccess, session_1.SessionAction.SharingError),
    AuthenticationCommandDecorator_1.authenticationCommandDecorator(session_1.SessionAction.AttemptSharing)
], ShareCommand);
exports.ShareCommand = ShareCommand;

//# sourceMappingURL=ShareCommand.js.map
