"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JoinBreakpointManager {
    constructor(builder) {
        this.builder = builder;
    }
    init() {
        return this.builder.init(true);
    }
    dispose() {
        return this.builder.dispose();
    }
}
exports.JoinBreakpointManager = JoinBreakpointManager;

//# sourceMappingURL=JoinBreakpointManager.js.map
