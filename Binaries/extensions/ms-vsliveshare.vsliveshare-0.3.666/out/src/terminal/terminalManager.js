//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../session");
const sessionTypes_1 = require("../sessionTypes");
const hostTerminalManager_1 = require("./hostTerminalManager");
const guestTerminalManager_1 = require("./guestTerminalManager");
let hostTerminalManager;
let guestTerminalManager;
/**
 * Activates a terminal manager based on the current collaboration session state.
 *
 * @param terminalService Instance of a terminal service client.
 */
function enableTerminalManager(terminalService) {
    session_1.SessionContext.on(sessionTypes_1.SessionEvents.StateChanged, (newState) => {
        switch (newState) {
            case sessionTypes_1.SessionState.Shared:
                enableHostTerminalManager(terminalService);
                break;
            case sessionTypes_1.SessionState.Joined:
                enableGuestTerminalManager(terminalService);
                break;
            default:
                break;
        }
    });
}
exports.enableTerminalManager = enableTerminalManager;
/**
 * Activates a host terminal manager that controls how terminal windows are shared within a collaboration session.
 * The manager will disengage automatically when a session state changes to not shared.
 *
 * @param terminalService Instance of a terminal service client.
 */
function enableHostTerminalManager(terminalService) {
    if (session_1.SessionContext.State !== sessionTypes_1.SessionState.Shared) {
        throw new Error('Not currently hosting a collaboration session.');
    }
    if (!hostTerminalManager) {
        hostTerminalManager = new hostTerminalManager_1.HostTerminalManager(terminalService);
        session_1.SessionContext.on(sessionTypes_1.SessionEvents.StateChanged, async (newState, previousState) => handleSessionStateChanged(newState, previousState));
        async function handleSessionStateChanged(newState, previousState) {
            if (newState !== sessionTypes_1.SessionState.Shared) {
                session_1.SessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, handleSessionStateChanged);
                if (hostTerminalManager) {
                    await hostTerminalManager.dispose();
                    hostTerminalManager = undefined;
                }
            }
        }
    }
}
/**
 * Activates a guest terminal manager that controls shared terminal windows in a guest session.
 * The manager will disengage automatically when a session state changes to not joined.
 *
 * @param terminalService Instance of a terminal service client.
 */
function enableGuestTerminalManager(terminalService) {
    if (session_1.SessionContext.State !== sessionTypes_1.SessionState.Joined) {
        throw new Error('Not currently joined in a collaboration session.');
    }
    if (!guestTerminalManager) {
        guestTerminalManager = new guestTerminalManager_1.GuestTerminalManager(terminalService);
        session_1.SessionContext.on(sessionTypes_1.SessionEvents.StateChanged, async (newState, previousState) => handleSessionStateChanged(newState, previousState));
        async function handleSessionStateChanged(newState, previousState) {
            if (newState !== sessionTypes_1.SessionState.Joined) {
                session_1.SessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, handleSessionStateChanged);
                if (guestTerminalManager) {
                    await guestTerminalManager.dispose();
                    guestTerminalManager = undefined;
                }
            }
        }
    }
}

//# sourceMappingURL=terminalManager.js.map
