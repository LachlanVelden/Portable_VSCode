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
const collaborators_1 = require("../../workspace/collaborators");
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
class GuestTrackerManager {
    constructor(sessionContext, telemetry, notificationUtil, browserUtil, trace) {
        this.sessionContext = sessionContext;
        this.telemetry = telemetry;
        this.notificationUtil = notificationUtil;
        this.browserUtil = browserUtil;
        this.trace = trace;
        this.alreadyDisposed = false;
        this.peopleDidJoin = false;
        this.registerUser = () => {
            this.peopleDidJoin = true;
        };
    }
    shouldShow() {
        return !this.peopleDidJoin;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.alreadyDisposed = false;
            this.sessionContext.addListener(collaborators_1.CollaboratorManager.collaboratorsChangedEvent, this.registerUser);
            this.telemetryEvent = this.telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.ZEROUSER_SESSION);
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionContext.removeListener(collaborators_1.CollaboratorManager.collaboratorsChangedEvent, this.registerUser);
            const shouldShow = this.shouldShow();
            if (!this.alreadyDisposed && shouldShow) {
                try {
                    const reason = yield this.showNotification(this.telemetryEvent);
                }
                catch (e) {
                    this.trace.error('Error in disposing `GuestTrackerManager`: ' + e);
                }
            }
            this.alreadyDisposed = true;
            this.peopleDidJoin = false;
            this.telemetryEvent = null;
        });
    }
    showNotification(telemetryEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                placeHolder: 'Did your Live Share collaboration session work well?',
                ignoreFocusOut: false,
            };
            const values = [
                { label: 'Yep!', description: 'I’m just testing it out, and plan to use it again.', id: 1 },
                { label: 'Nope!', description: 'No guests were able to successfully join.', id: 2 },
                { label: 'Nope!', description: 'I wasn’t sure what to do after sharing.', id: 3 },
                { label: 'Nope!', description: 'I ran into an issue and would like to report it', id: 4 }
            ];
            const result = yield this.notificationUtil.showQuickPick(values, options);
            const reason = result ? `${result.label} ${result.description}` : 'Ignored';
            telemetryEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.ZEROUSER_SESSION_REASON, reason);
            telemetryEvent.send();
            if (result.id === GuestTrackerManager.OTHER_ID) {
                this.browserUtil.openBrowser('http://aka.ms/vsls/share-issue');
            }
        });
    }
}
GuestTrackerManager.OTHER_ID = 4;
exports.GuestTrackerManager = GuestTrackerManager;

//# sourceMappingURL=GuestTrackerManager.js.map
