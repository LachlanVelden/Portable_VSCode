"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShareDebugManager {
    constructor(shareDebugManager) {
        this.shareDebugManager = shareDebugManager;
    }
    init() {
        return this.shareDebugManager.setShareState(true);
    }
    dispose() {
        return undefined;
    }
}
exports.ShareDebugManager = ShareDebugManager;

//# sourceMappingURL=ShareDebugManager.js.map
