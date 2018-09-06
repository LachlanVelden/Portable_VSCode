//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const events_1 = require("events");
const client_1 = require("./coediting/client");
const collaborators_1 = require("./workspace/collaborators");
const telemetry_1 = require("./telemetry/telemetry");
const telemetryStrings_1 = require("./telemetry/telemetryStrings");
const util_1 = require("./util");
const commands_1 = require("./commands");
const sessionTypes_1 = require("./sessionTypes");
var SessionAction;
(function (SessionAction) {
    SessionAction[SessionAction["AttemptSharing"] = 0] = "AttemptSharing";
    SessionAction[SessionAction["SharingError"] = 1] = "SharingError";
    SessionAction[SessionAction["SharingSuccess"] = 2] = "SharingSuccess";
    SessionAction[SessionAction["EndSharing"] = 3] = "EndSharing";
    SessionAction[SessionAction["Unjoin"] = 4] = "Unjoin";
    SessionAction[SessionAction["AttemptJoining"] = 5] = "AttemptJoining";
    SessionAction[SessionAction["JoiningError"] = 6] = "JoiningError";
    SessionAction[SessionAction["JoiningPendingReload"] = 7] = "JoiningPendingReload";
    SessionAction[SessionAction["JoiningSuccess"] = 8] = "JoiningSuccess";
    SessionAction[SessionAction["AttemptSignIn"] = 9] = "AttemptSignIn";
    SessionAction[SessionAction["AwaitExternalSignIn"] = 10] = "AwaitExternalSignIn";
    SessionAction[SessionAction["SignInError"] = 11] = "SignInError";
    SessionAction[SessionAction["SignInSuccess"] = 12] = "SignInSuccess";
    SessionAction[SessionAction["SignOut"] = 13] = "SignOut";
})(SessionAction = exports.SessionAction || (exports.SessionAction = {}));
// Description of the transitions of a FSM for a session
// TODO: refactor as a statechart
exports.sessionMachine = {
    [sessionTypes_1.SessionState.Initializing]: {
        [SessionAction.AttemptSignIn]: sessionTypes_1.SessionState.SigningIn,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.ExternallySigningIn]: {
        [SessionAction.AwaitExternalSignIn]: sessionTypes_1.SessionState.ExternallySigningIn,
        [SessionAction.AttemptSignIn]: sessionTypes_1.SessionState.SigningIn,
        [SessionAction.SignInSuccess]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.SignInError]: sessionTypes_1.SessionState.SignedOut,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.SigningIn]: {
        [SessionAction.AwaitExternalSignIn]: sessionTypes_1.SessionState.ExternallySigningIn,
        [SessionAction.SignInSuccess]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.SignInError]: sessionTypes_1.SessionState.SignedOut,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.SignedIn]: {
        [SessionAction.AttemptSharing]: sessionTypes_1.SessionState.SharingInProgress,
        [SessionAction.AttemptJoining]: sessionTypes_1.SessionState.JoiningInProgress,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.SignedOut]: {
        [SessionAction.AttemptSignIn]: sessionTypes_1.SessionState.SigningIn,
        [SessionAction.AwaitExternalSignIn]: sessionTypes_1.SessionState.ExternallySigningIn
    },
    [sessionTypes_1.SessionState.SharingInProgress]: {
        [SessionAction.SharingError]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.SharingSuccess]: sessionTypes_1.SessionState.Shared,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.Shared]: {
        [SessionAction.EndSharing]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.JoiningInProgress]: {
        [SessionAction.JoiningError]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.JoiningPendingReload]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.JoiningSuccess]: sessionTypes_1.SessionState.Joined,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    },
    [sessionTypes_1.SessionState.Joined]: {
        [SessionAction.Unjoin]: sessionTypes_1.SessionState.SignedIn,
        [SessionAction.SignOut]: sessionTypes_1.SessionState.SignedOut
    }
};
class SessionContext extends events_1.EventEmitter {
    constructor() {
        super();
        this.currentState = sessionTypes_1.SessionState.Initializing; // initial state
        this.currentStatus = undefined; // initial state
        // For telemetry
        // The maximum number of guests this conversation had at a time
        this.guestCountByIDE = {};
        this.distinctGuestCountByIDE = {};
        this.addListener(sessionTypes_1.SessionEvents.StateChanged, this.updateTelemetryContext);
    }
    get State() {
        return SessionContext.Instance.currentState;
    }
    transition(action) {
        const currentStateConfig = exports.sessionMachine[this.State];
        if (currentStateConfig) {
            const nextState = currentStateConfig[action];
            if (nextState !== undefined) {
                // Record & send transition telemetry
                this.sendTransitionTelemetry(nextState, action);
                // Transition to the determined next state
                SessionContext.Instance.setState(nextState);
                return SessionContext.Instance.State;
            }
            // No transition exists for the given action
            return undefined;
        }
        // No config for the given state exists in the machine
        return undefined;
    }
    point(action) {
        if (action !== undefined) {
            SessionContext.Instance.setStatus(action);
        }
    }
    initCoEditingContext(parameters) {
        if (!this.workspaceSessionInfo) {
            throw new Error('Failed to join a collaboration session. '
                + 'The owner is offline. Ask them to start the session and rejoin.');
        }
        let initCoauthoringTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetryStrings_1.TelemetryEventNames.INITIALIZE_COAUTHORING, true);
        initCoauthoringTelemetryEvent.addMeasure(telemetryStrings_1.TelemetryPropertyNames.NUM_OPEN_FILES, vscode.window.visibleTextEditors.length);
        this.userInfo = parameters.userInfo;
        this.collaboratorManager = new collaborators_1.CollaboratorManager(this.workspaceSessionInfo.sessions);
        this.collaboratorManager.addListener(collaborators_1.CollaboratorManager.collaboratorsChangedEvent, () => this.emit(collaborators_1.CollaboratorManager.collaboratorsChangedEvent));
        this.collaboratorManager.addListener(collaborators_1.CollaboratorManager.collaboratorsChangedEvent, () => { this.collaboratorsChanged(); });
        this.coeditingClient = new client_1.Client({
            sourceEventService: parameters.sourceEventService,
            clientID: this.workspaceSessionInfo.sessionNumber,
            isExpert: parameters.isExpert,
            fileService: parameters.fileSystemService,
            accessControlManager: parameters.accessControlManager,
        });
        parameters.statusBarController.registerClientListeners(this.coeditingClient);
        if (this.fileTreeExplorerProvider) {
            this.fileTreeExplorerProvider.registerClientListeners(this.coeditingClient);
        }
        if (this.activityBarProvider) {
            this.activityBarProvider.registerClientListeners(this.coeditingClient);
        }
        this.coeditingClient.init();
        initCoauthoringTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
    }
    collaboratorsChanged() {
        for (let ide of this.collaboratorManager.getIDEs()) {
            if (this.guestCountByIDE[ide] === undefined) {
                this.guestCountByIDE[ide] = 0;
            }
            if (this.distinctGuestCountByIDE[ide] === undefined) {
                this.distinctGuestCountByIDE[ide] = 0;
            }
            this.guestCountByIDE[ide] = Math.max(this.guestCountByIDE[ide], this.collaboratorManager.getCollaboratorCountByIDE(ide));
            this.distinctGuestCountByIDE[ide] = Math.max(this.distinctGuestCountByIDE[ide], this.collaboratorManager.getDistinctCollaboratorCountByIDE(ide));
        }
        SessionContext.Instance.emit(sessionTypes_1.SessionEvents.CollaboratorsChanged);
    }
    disposeCoEditingContext() {
        this.workspaceSessionInfo = null;
        // Null checks in case there was an error while joining / sharing and the initialization did not fully complete
        if (this.collaboratorManager) {
            this.collaboratorManager.dispose();
            this.collaboratorManager = null;
        }
        if (this.coeditingClient) {
            this.coeditingClient.dispose();
            this.coeditingClient = null;
        }
    }
    setState(newState) {
        const previousState = SessionContext.Instance.currentState;
        SessionContext.Instance.currentState = newState;
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.stateCommandContext, sessionTypes_1.SessionState[newState]);
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.isCollaboratingCommandContext, (newState === sessionTypes_1.SessionState.Shared) || (newState === sessionTypes_1.SessionState.Joined));
        if (newState !== sessionTypes_1.SessionState.Joined && newState !== sessionTypes_1.SessionState.Shared) {
            // Disposal needs to happen synchronously, so we can't use the StateChanged event
            this.disposeCoEditingContext();
            this.ServersShared = false;
            this.HasSharedTerminals = false;
            this.IsReadOnly = false;
        }
        SessionContext.Instance.emit(sessionTypes_1.SessionEvents.StateChanged, newState, previousState);
    }
    setStatus(newStatus) {
        const previousStatus = SessionContext.Instance.currentStatus;
        SessionContext.Instance.currentStatus = newStatus;
        SessionContext.Instance.emit(sessionTypes_1.SessionEvents.StatusChanged, newStatus, previousStatus);
    }
    get ServersShared() {
        return SessionContext.Instance.serversShared;
    }
    set ServersShared(serversShared) {
        SessionContext.Instance.serversShared = serversShared;
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.isServerSharedCommandContext, serversShared);
    }
    get HasSharedTerminals() {
        return SessionContext.Instance.hasSharedTerminals;
    }
    set HasSharedTerminals(hasSharedTerminals) {
        SessionContext.Instance.hasSharedTerminals = hasSharedTerminals;
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.hasSharedTerminalsCommandContext, hasSharedTerminals);
    }
    get SupportSharedTerminals() {
        return SessionContext.Instance.supportSharedTerminals;
    }
    set SupportSharedTerminals(supportSharedTerminals) {
        SessionContext.Instance.supportSharedTerminals = supportSharedTerminals;
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.supportSharedTerminalsCommandContext, supportSharedTerminals);
    }
    get SupportSummonParticipants() {
        return SessionContext.Instance.supportSummonParticipants;
    }
    set SupportSummonParticipants(supportSummonParticipants) {
        SessionContext.Instance.supportSummonParticipants = supportSummonParticipants;
        util_1.ExtensionUtil.setCommandContext(commands_1.Commands.supportSummonParticipantsCommandContext, supportSummonParticipants);
    }
    get EnableVerticalScrolling() {
        return SessionContext.Instance.enableVerticalScrolling;
    }
    set EnableVerticalScrolling(enableVerticalScrolling) {
        SessionContext.Instance.enableVerticalScrolling = enableVerticalScrolling;
    }
    get IsSignedIn() {
        return SessionContext.Instance.IsCollaborating
            || [sessionTypes_1.SessionState.SignedIn,
                sessionTypes_1.SessionState.SharingInProgress,
                sessionTypes_1.SessionState.JoiningInProgress].indexOf(SessionContext.Instance.State) >= 0;
    }
    get IsCollaborating() {
        return [sessionTypes_1.SessionState.Shared,
            sessionTypes_1.SessionState.Joined].indexOf(SessionContext.Instance.State) >= 0;
    }
    get IsStartingCollaboration() {
        return [sessionTypes_1.SessionState.JoiningInProgress,
            sessionTypes_1.SessionState.SharingInProgress].indexOf(SessionContext.Instance.State) >= 0;
    }
    get IsReadOnly() {
        return SessionContext.Instance.isReadOnly;
    }
    set IsReadOnly(isReadOnly) {
        const previousReadOnly = SessionContext.Instance.isReadOnly;
        if (isReadOnly !== previousReadOnly) {
            if (isReadOnly) {
                telemetry_1.Instance.addContextProperty(telemetryStrings_1.TelemetryPropertyNames.IS_READONLY_SESSION, true /* value */, false /* isPII */);
            }
            else {
                telemetry_1.Instance.removeContextProperty(telemetryStrings_1.TelemetryPropertyNames.IS_READONLY_SESSION);
            }
            SessionContext.Instance.isReadOnly = isReadOnly;
            SessionContext.Instance.emit(sessionTypes_1.SessionEvents.ReadOnlyChanged, isReadOnly, previousReadOnly);
        }
    }
    get HasCollaborators() {
        return SessionContext.Instance.hasCollaborators;
    }
    set HasCollaborators(hasCollaborators) {
        const previousHasCollaborators = SessionContext.Instance.hasCollaborators;
        if (hasCollaborators !== previousHasCollaborators) {
            SessionContext.Instance.hasCollaborators = hasCollaborators;
            util_1.ExtensionUtil.setCommandContext(commands_1.Commands.hasCollaboratorsCommandContext, hasCollaborators);
            SessionContext.Instance.emit(sessionTypes_1.SessionEvents.HasCollaboratorsChanged, hasCollaborators, previousHasCollaborators);
        }
    }
    static get Instance() {
        if (!SessionContext.singleton) {
            SessionContext.singleton = new SessionContext();
        }
        return SessionContext.singleton;
    }
    sendTransitionTelemetry(nextState, fromAction) {
        telemetry_1.Instance.sendTransition(sessionTypes_1.SessionState[SessionContext.Instance.State], sessionTypes_1.SessionState[nextState], SessionAction[fromAction]);
    }
    updateTelemetryContext(newState, previousState) {
        let wasCollaborating = [sessionTypes_1.SessionState.Shared, sessionTypes_1.SessionState.Joined].indexOf(previousState) >= 0;
        if (SessionContext.Instance.IsCollaborating) {
            if (SessionContext.Instance.workspaceSessionInfo) {
                let isOwner = (newState === sessionTypes_1.SessionState.Shared);
                telemetry_1.Instance.startSession(isOwner);
            }
        }
        else if (wasCollaborating) {
            telemetry_1.Instance.endSession(this.guestCountByIDE, this.distinctGuestCountByIDE);
        }
    }
    dispose() {
        if (SessionContext.Instance.IsCollaborating) {
            telemetry_1.Instance.endSession(this.guestCountByIDE, this.distinctGuestCountByIDE);
        }
    }
}
exports.SessionContextClass = SessionContext;
// Most importers only need the singleton instance.
const sessionContextInstance = SessionContext.Instance;
exports.SessionContext = sessionContextInstance;

//# sourceMappingURL=session.js.map
