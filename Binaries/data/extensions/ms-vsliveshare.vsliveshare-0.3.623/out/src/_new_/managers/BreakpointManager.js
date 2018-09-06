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
const breakpointManager_1 = require("../../debugger/breakpointManager");
class BreakpointManager {
    constructor(sourceEventService) {
        this.sourceEventService = sourceEventService;
    }
    init(isSharing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (breakpointManager_1.BreakpointManager.hasVSCodeSupport()) {
                this.breakpointManager = new breakpointManager_1.BreakpointManager(isSharing, this.sourceEventService);
                yield this.breakpointManager.initialize();
            }
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.breakpointManager) {
                yield this.breakpointManager.dispose();
            }
        });
    }
}
exports.BreakpointManager = BreakpointManager;

//# sourceMappingURL=BreakpointManager.js.map
