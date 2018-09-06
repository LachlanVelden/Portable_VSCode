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
const session_1 = require("../session");
class TerminalManagerBase {
    constructor(terminalService) {
        this.terminalService = terminalService;
        this.subscriptions = [];
        this.deferredInit = Promise.resolve();
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.deferredInit;
            this.subscriptions.forEach(d => d.dispose());
            this.terminalProvider.dispose();
            session_1.SessionContext.HasSharedTerminals = false;
        });
    }
    openTerminalCommandHandler(terminalPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            const terminals = yield this.terminalService.getRunningTerminalsAsync();
            for (let terminal of terminals) {
                if (terminal.id === terminalPayload.id) {
                    yield this.terminalProvider.createTerminal(terminal, null, this.trace);
                    break;
                }
            }
        });
    }
}
exports.TerminalManagerBase = TerminalManagerBase;

//# sourceMappingURL=terminalManagerBase.js.map
