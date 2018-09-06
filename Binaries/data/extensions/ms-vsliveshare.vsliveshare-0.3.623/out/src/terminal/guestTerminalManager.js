//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
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
    openSharedTerminalsOnJoin() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const terminals = yield this.updateSessionContext();
                yield Promise.all(terminals.map(value => this.terminalProvider.createTerminal(value, null, this.trace), this));
            }
            catch (_a) {
                session_1.SessionContext.HasSharedTerminals = false;
            }
        });
    }
    /**
     * Implements "Access Shared Terminal" UI command
     */
    listSharedTerminals() {
        return __awaiter(this, void 0, void 0, function* () {
            const terminals = yield this.getRunningTerminalsAsync();
            if (terminals.length === 0) {
                yield vscode.window.showInformationMessage('No terminals are currently shared in the collaboration session.', { modal: false });
                return;
            }
            let index = -1;
            if (terminals.length === 1) {
                index = 0;
            }
            else {
                const items = terminals.map((t, i) => `${i + 1}: ${t.options.name}`);
                const selection = yield vscode.window.showQuickPick(items, { placeHolder: 'Select shared terminal to open' });
                if (!selection) {
                    return;
                }
                index = items.indexOf(selection);
            }
            if (index >= 0) {
                yield this.terminalProvider.createTerminal(terminals[index], null, this.trace);
            }
        });
    }
    onHostTerminalStarted(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateSessionContext();
            yield this.terminalProvider.createTerminal(event.terminal, null, this.trace);
        });
    }
    onHostTerminalStopped() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateSessionContext();
        });
    }
    updateSessionContext() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const terminals = yield this.getRunningTerminalsAsync();
                session_1.SessionContext.HasSharedTerminals = terminals.length > 0;
                return terminals;
            }
            catch (e) {
                this.trace.error('Checking for shared terminals failed: ' + e);
            }
        });
    }
    getRunningTerminalsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.terminalService.getRunningTerminalsAsync();
            }
            catch (e) {
                if (e.code === -32601) {
                    // Other side doesn't have terminal service
                    return [];
                }
                throw e;
            }
        });
    }
}
exports.GuestTerminalManager = GuestTerminalManager;

//# sourceMappingURL=guestTerminalManager.js.map
