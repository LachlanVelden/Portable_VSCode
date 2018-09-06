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
const sessionTypes_1 = require("../../sessionTypes");
/**
 * Provider that manages progress notifier in the context of a
 * command.
 */
class ProgressNotifierUtil {
    constructor(sessionContext, notificationUtil, contextUtil, trace) {
        this.sessionContext = sessionContext;
        this.notificationUtil = notificationUtil;
        this.contextUtil = contextUtil;
        this.trace = trace;
    }
    create(options, task, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = ProgressNotifierUtil.correlationIndex++;
            this.trace.info(`Progress notifier opened: ${index}.`);
            // TODO: Update the below to work for clients that support `Notification` and those
            //       who don't.
            return yield this.notificationUtil.withProgress({ title: options.title, cancellable: true, location: 15 /* vscode.ProgressLocation.Notification */ }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                const stateCallback = (newState, previousState) => {
                    const message = this.generateMessage(sessionTypes_1.SessionState[newState]);
                    progress.report({ message });
                };
                const statusCallback = (newStatus, previousStatus) => {
                    const message = this.generateMessage(newStatus);
                    progress.report({ message });
                };
                this.sessionContext.addListener(sessionTypes_1.SessionEvents.StateChanged, stateCallback);
                this.sessionContext.addListener(sessionTypes_1.SessionEvents.StatusChanged, statusCallback);
                const unsubscribe = () => {
                    this.sessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, stateCallback);
                    this.sessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, statusCallback);
                };
                token.onCancellationRequested(() => {
                    this.trace.info(`Progress notifier cancelled: ${index}.`);
                    unsubscribe();
                });
                const result = yield task(cancellationToken);
                this.trace.info(`Progress notifier finished: ${index}.`);
                unsubscribe();
                return result;
            }), cancellationToken);
        });
    }
    generateMessage(status) {
        return status ? this.contextUtil.scrubPrefix(status)
            .match(ProgressNotifierUtil.statusTextGeneratorRegex)
            .slice(0, -1)
            .join(' ') : status;
    }
}
ProgressNotifierUtil.statusTextGeneratorRegex = /([A-Z]?[^A-Z]*)/g;
ProgressNotifierUtil.correlationIndex = 0;
exports.ProgressNotifierUtil = ProgressNotifierUtil;

//# sourceMappingURL=ProgressNotifierUtil.js.map
