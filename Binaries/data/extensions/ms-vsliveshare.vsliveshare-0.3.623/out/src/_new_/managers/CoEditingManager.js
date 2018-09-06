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
class CoEditingManager {
    constructor(authenticationProvider, sessionContext, sourceEventService, fileService, statusBarController, accessControlManager) {
        this.authenticationProvider = authenticationProvider;
        this.sessionContext = sessionContext;
        this.sourceEventService = sourceEventService;
        this.fileService = fileService;
        this.statusBarController = statusBarController;
        this.accessControlManager = accessControlManager;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionContext.initCoEditingContext({
                sourceEventService: this.sourceEventService,
                userInfo: this.authenticationProvider.getCurrentUser(),
                statusBarController: this.statusBarController,
                fileSystemService: this.fileService,
                isExpert: false,
                accessControlManager: this.accessControlManager,
            });
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.CoEditingManager = CoEditingManager;

//# sourceMappingURL=CoEditingManager.js.map
