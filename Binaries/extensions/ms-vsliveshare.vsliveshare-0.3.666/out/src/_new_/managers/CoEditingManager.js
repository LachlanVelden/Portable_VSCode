"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CoEditingManager {
    constructor(authenticationProvider, sessionContext, sourceEventService, fileService, statusBarController, accessControlManager) {
        this.authenticationProvider = authenticationProvider;
        this.sessionContext = sessionContext;
        this.sourceEventService = sourceEventService;
        this.fileService = fileService;
        this.statusBarController = statusBarController;
        this.accessControlManager = accessControlManager;
    }
    async init() {
        this.sessionContext.initCoEditingContext({
            sourceEventService: this.sourceEventService,
            userInfo: this.authenticationProvider.getCurrentUser(),
            statusBarController: this.statusBarController,
            fileSystemService: this.fileService,
            isExpert: false,
            accessControlManager: this.accessControlManager,
        });
    }
    async dispose() {
    }
}
exports.CoEditingManager = CoEditingManager;

//# sourceMappingURL=CoEditingManager.js.map
