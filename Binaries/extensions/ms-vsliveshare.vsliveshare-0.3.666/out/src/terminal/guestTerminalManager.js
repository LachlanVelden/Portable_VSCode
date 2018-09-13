//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util = require("../util");
const session_1 = require("../session");
const traceSource_1 = require("../tracing/traceSource");
const terminalWorkerProvider_1 = require("./terminalWorkerProvider");
const terminalManagerBase_1 = require("./terminalManagerBase");
class GuestTerminalManager extends terminalManagerBase_1.TerminalManagerBase {
    constructor(terminalService) {
        super(terminalService);
        this.terminalProvider = new terminalWorkerProvider_1.TerminalWorkerProvider(this.terminalService);
        this.trace = traceSource_1.traceSource.withName('GuestTerminalManager');
        this.subscriptions.push(this.terminalService.onTerminalStarted(this.onHostTerminalStarted, this), this.terminalService.onTerminalStopped(this.onHostTerminalStopped, this), util.ExtensionUtil.registerCommand('liveshare.listSharedTerminals', this.listSharedTerminals, this), util.ExtensionUtil.registerCommand('liveshare.openTerminalFromFileTreeExplorer', this.openTerminalCommandHandler, this), util.ExtensionUtil.registerCommand('liveshare.openTerminalFromActivityBar', this.openTerminalCommandHandler, this));
        this.deferredInit = this.deferredInit
            .then(() => this.openSharedTerminalsOnJoin())
            .catch(reason => {
            this.trace.error(reason.message);
        });
    }
    async openSharedTerminalsOnJoin() {
        try {
            const terminals = await this.updateSessionContext();
            await Promise.all(terminals.map(value => this.terminalProvider.createTerminal(value, null, this.trace), this));
        }
        catch (_a) {
            session_1.SessionContext.HasSharedTerminals = false;
        }
    }
    /**
     * Implements "Access Shared Terminal" UI command
     */
    async listSharedTerminals() {
        const terminals = await this.getRunningTerminalsAsync();
        if (terminals.length === 0) {
            await vscode.window.showInformationMessage('No terminals are currently shared in the collaboration session.', { modal: false });
            return;
        }
        let index = -1;
        if (terminals.length === 1) {
            index = 0;
        }
        else {
            const items = terminals.map((t, i) => `${i + 1}: ${t.options.name}`);
            const selection = await vscode.window.showQuickPick(items, { placeHolder: 'Select shared terminal to open' });
            if (!selection) {
                return;
            }
            index = items.indexOf(selection);
        }
        if (index >= 0) {
            await this.terminalProvider.createTerminal(terminals[index], null, this.trace);
        }
    }
    async onHostTerminalStarted(event) {
        await this.updateSessionContext();
        await this.terminalProvider.createTerminal(event.terminal, null, this.trace);
    }
    async onHostTerminalStopped() {
        await this.updateSessionContext();
    }
    async updateSessionContext() {
        try {
            const terminals = await this.getRunningTerminalsAsync();
            session_1.SessionContext.HasSharedTerminals = terminals.length > 0;
            return terminals;
        }
        catch (e) {
            this.trace.error('Checking for shared terminals failed: ' + e);
        }
    }
    async getRunningTerminalsAsync() {
        try {
            return await this.terminalService.getRunningTerminalsAsync();
        }
        catch (e) {
            if (e.code === -32601) {
                // Other side doesn't have terminal service
                return [];
            }
            throw e;
        }
    }
}
exports.GuestTerminalManager = GuestTerminalManager;

//# sourceMappingURL=guestTerminalManager.js.map
