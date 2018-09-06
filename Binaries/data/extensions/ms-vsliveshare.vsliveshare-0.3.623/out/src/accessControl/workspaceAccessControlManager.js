"use strict";
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
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
const vscode = require("vscode");
const vsls = require("../contracts/VSLS");
const util_1 = require("../util");
const session_1 = require("../session");
const sessionTypes_1 = require("../sessionTypes");
const config = require("../config");
const semaphore_async_await_1 = require("semaphore-async-await");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
const restrictedOperation_1 = require("./restrictedOperation");
const telemetry_1 = require("../telemetry/telemetry");
const telemetryStrings_1 = require("../telemetry/telemetryStrings");
class WorkspaceAccessControlManager {
    constructor(workspaceAccessControlService, workspaceUserService) {
        this.workspaceAccessControlService = workspaceAccessControlService;
        this.workspaceUserService = workspaceUserService;
        this.guestNameSemaphore = new semaphore_async_await_1.default(1);
        this.guestNameCounts = new Map();
    }
    isSessionReadOnly(sessionNumberOrContext, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sessionNumberOrContext && typeof sessionNumberOrContext === 'object') {
                sessionNumberOrContext = typeof sessionNumberOrContext.GuestSessionId !== 'undefined' ? sessionNumberOrContext.GuestSessionId :
                    typeof sessionNumberOrContext.context === 'object' ? sessionNumberOrContext.context.GuestSessionId :
                        undefined;
            }
            if (typeof sessionNumberOrContext !== 'string') {
                return false;
            }
            if (!this.workspaceAccessControl) {
                yield this.init();
            }
            const accessControl = this.workspaceAccessControl.userAccessControl[sessionNumberOrContext] || this.workspaceAccessControl.defaultAccessControl || {};
            return !!accessControl.isReadOnly;
        });
    }
    canPerformOperation(context, operation, sendTelemetry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!operation) {
                return true;
            }
            if (!operation.enabledInReadOnlySession && (yield this.isSessionReadOnly(context))) {
                if (sendTelemetry) {
                    this.sendRejectedOperationTelemetry(operation, restrictedOperation_1.RestrictedOperationRejectionReason.RejectedInReadOnlySession);
                }
                return false;
            }
            if (operation.isEnabled && operation.isEnabled() !== true) {
                if (sendTelemetry) {
                    this.sendRejectedOperationTelemetry(operation, restrictedOperation_1.RestrictedOperationRejectionReason.DisabledByHost);
                }
                return false;
            }
            return true;
        });
    }
    verifyThrowCanPerformOperation(context, operation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.canPerformOperation(context, operation, true /* sendTelemetry */)) {
                return;
            }
            if (!operation.enabledInReadOnlySession && (yield this.isSessionReadOnly(context))) {
                throw new vscode_jsonrpc_1.ResponseError(vsls.ErrorCodes.OperationRejectedInReadOnlySession, 'This operation is not allowed in read-only collaboration session.');
            }
            if (operation.isEnabled) {
                const error = operation.isEnabled();
                if (error && typeof error === 'object') {
                    throw new vscode_jsonrpc_1.ResponseError(error.errorCode, error.errorMessage);
                }
            }
            throw new vscode_jsonrpc_1.ResponseError(vsls.ErrorCodes.OperationRejected, 'Insufficient access rights to perform this operation.');
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.workspaceAccessControl = (yield this.workspaceAccessControlService.getAccessControlAsync()) || {};
            this.accessControlChangedEvent = this.workspaceAccessControlService.onAccessControlChanged(this.workspaceAccessControl_onAccessControlChanged, this);
        });
    }
    dispose() {
        return Promise.resolve();
    }
    endCollaboration() {
        this.guestNameCounts.clear();
        if (this.accessControlChangedEvent) {
            this.accessControlChangedEvent.dispose();
            this.accessControlChangedEvent = undefined;
        }
        this.workspaceAccessControl = undefined;
    }
    setReadOnly(isReadOnly) {
        return __awaiter(this, void 0, void 0, function* () {
            let workspaceAccessControl = (yield this.workspaceAccessControlService.getAccessControlAsync()) || {};
            workspaceAccessControl.defaultAccessControl = workspaceAccessControl.defaultAccessControl || {};
            if (!!workspaceAccessControl.defaultAccessControl.isReadOnly !== isReadOnly) {
                if (session_1.SessionContext.HasCollaborators) {
                    yield vscode.window.showErrorMessage('Cannot change read-only status of the collaboration session when there are participants joined.', { modal: true });
                    return;
                }
                workspaceAccessControl.defaultAccessControl.isReadOnly = isReadOnly;
                yield this.workspaceAccessControlService.setAccessControlAsync(workspaceAccessControl);
            }
        });
    }
    onWorkspaceSessionChanged(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e.changeType === vsls.WorkspaceSessionChangeType.Joined && session_1.SessionContext.State === sessionTypes_1.SessionState.Shared) {
                const sessionNumber = e.sessionNumber;
                const approval = yield this.approveGuest(sessionNumber, e);
                if (typeof approval === 'boolean') {
                    yield this.workspaceUserService.acceptOrRejectGuestAsync(sessionNumber, approval);
                }
                else {
                    yield this.workspaceUserService.rejectGuestAsync(sessionNumber, approval.errorCode || vsls.ErrorCodes.CollaborationSessionGuestRejectedWithSpecificReason, approval.errorMessage);
                }
            }
            if (e.changeType === vsls.WorkspaceSessionChangeType.Unjoined && session_1.SessionContext.State === sessionTypes_1.SessionState.Shared) {
                yield this.showGuestLeftNotification(e);
            }
        });
    }
    sendRejectedOperationTelemetry(operation, reason) {
        new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.REJECT_RESTRICTED_OPERATION)
            .addProperty(telemetryStrings_1.TelemetryPropertyNames.OPERATION_NAME, operation.name)
            .addProperty(telemetryStrings_1.TelemetryPropertyNames.REJECTION_REASON, reason)
            .send();
    }
    approveGuest(sessionNumber, e) {
        return __awaiter(this, void 0, void 0, function* () {
            const guestCapabilities = e.userProfile.clientCapabilities || {};
            if (session_1.SessionContext.IsReadOnly && (!guestCapabilities.extensionReadOnlySupport || !guestCapabilities.clientReadOnlySupport)) {
                // In read-only mode reject guests who do not support it.
                if (!guestCapabilities.extensionReadOnlySupport && !guestCapabilities.clientReadOnlySupport) {
                    return { errorMessage: 'Your VS Live Share extension does not support read-only collaboration session. Please update the extension.' };
                }
                if (!guestCapabilities.clientReadOnlySupport) {
                    const appName = e.applicationName === 'VisualStudio' ? 'Visual Studio' :
                        e.applicationName === 'VSCode' ? 'VS Code' :
                            undefined;
                    return { errorMessage: `Your ${appName || 'client'} does not support read-only collaboration session. Please update ${appName || 'the client'}.` };
                }
                return { errorMessage: 'Read-only support is disabled. To join a read-only collaboration session, please enable the read-only support feature.' };
            }
            if (!config.featureFlags.guestApproval) {
                return true;
            }
            const guestDisplayName = yield this.getGuestDisplayName(e.userProfile);
            if (config.get(config.Key.guestApprovalRequired)) {
                return yield this.waitForHostToAcceptGuest(sessionNumber, guestDisplayName);
            }
            // Do not await on the notification to allow guest to join right away
            // The host can later kick them off
            this.showJoinNotification(sessionNumber, guestDisplayName);
            return true;
        });
    }
    waitForHostToAcceptGuest(sessionNumber, guestDisplayName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.workspaceUserService.fireProgressUpdatedToGuestAsync(vsls.WorkspaceProgress.WaitingForHost, sessionNumber);
            let message = `${guestDisplayName}` + util_1.ExtensionUtil.getString('notification.AcceptRejectGuest');
            let selection = yield vscode.window.showInformationMessage(message, ...[util_1.ExtensionUtil.getString('notification.Accept'), util_1.ExtensionUtil.getString('notification.Reject')]);
            yield this.workspaceUserService.fireProgressUpdatedToGuestAsync(vsls.WorkspaceProgress.DoneWaitingForHost, sessionNumber);
            return selection === util_1.ExtensionUtil.getString('notification.Accept');
        });
    }
    showJoinNotification(sessionNumber, guestDisplayName) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = `${guestDisplayName}` + util_1.ExtensionUtil.getString('notification.InformGuestJoined');
            let selection = yield vscode.window.showInformationMessage(message, ...[util_1.ExtensionUtil.getString('notification.Remove')]);
            if (selection === util_1.ExtensionUtil.getString('notification.Remove') && session_1.SessionContext.State === sessionTypes_1.SessionState.Shared) {
                yield this.workspaceUserService.removeUserAsync(sessionNumber);
            }
        });
    }
    showGuestLeftNotification(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let nameAndEmail = this.getNameAndEmail(e.userProfile);
            switch (e.disconnectedReason) {
                case vsls.WorkspaceDisconnectedReason.NetworkDisconnected:
                    {
                        let message = `${nameAndEmail}` + util_1.ExtensionUtil.getString('notification.GuestDisconnected');
                        yield vscode.window.showInformationMessage(message);
                        break;
                    }
                case vsls.WorkspaceDisconnectedReason.Requested:
                    {
                        let message = `${nameAndEmail}` + util_1.ExtensionUtil.getString('notification.GuestLeft');
                        yield vscode.window.showInformationMessage(message);
                        break;
                    }
                case vsls.WorkspaceDisconnectedReason.UserRemoved:
                default:
                    break;
            }
        });
    }
    getGuestDisplayName(userProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            let nameAndEmail = this.getNameAndEmail(userProfile);
            yield this.guestNameSemaphore.acquire();
            try {
                if (this.guestNameCounts.has(nameAndEmail)) {
                    let newCount = this.guestNameCounts
                        .set(nameAndEmail, this.guestNameCounts.get(nameAndEmail) + 1)
                        .get(nameAndEmail);
                    return `${nameAndEmail} (${newCount})`;
                }
                else {
                    this.guestNameCounts.set(nameAndEmail, 0);
                    return nameAndEmail;
                }
            }
            finally {
                this.guestNameSemaphore.release();
            }
        });
    }
    getNameAndEmail(userProfile) {
        let name = userProfile.name;
        let email = userProfile.email;
        return name ? `${name} (${email})` : email;
    }
    workspaceAccessControl_onAccessControlChanged(e) {
        this.workspaceAccessControl = e.accessControl || {};
        this.workspaceAccessControl.defaultAccessControl = this.workspaceAccessControl.defaultAccessControl || {};
        session_1.SessionContext.IsReadOnly = this.workspaceAccessControl.defaultAccessControl.isReadOnly;
    }
}
exports.WorkspaceAccessControlManager = WorkspaceAccessControlManager;

//# sourceMappingURL=workspaceAccessControlManager.js.map
