'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../session");
class TerminalManagerBase {
    constructor(terminalService) {
        this.terminalService = terminalService;
        this.subscriptions = [];
        this.deferredInit = Promise.resolve();
    }
    async dispose() {
        await this.deferredInit;
        this.subscriptions.forEach(d => d.dispose());
        this.terminalProvider.dispose();
        session_1.SessionContext.HasSharedTerminals = false;
    }
    async openTerminalCommandHandler(terminalPayload) {
        const terminals = await this.terminalService.getRunningTerminalsAsync();
        for (let terminal of terminals) {
            if (terminal.id === terminalPayload.id) {
                await this.terminalProvider.createTerminal(terminal, null, this.trace);
                break;
            }
        }
    }
}
exports.TerminalManagerBase = TerminalManagerBase;

//# sourceMappingURL=terminalManagerBase.js.map
