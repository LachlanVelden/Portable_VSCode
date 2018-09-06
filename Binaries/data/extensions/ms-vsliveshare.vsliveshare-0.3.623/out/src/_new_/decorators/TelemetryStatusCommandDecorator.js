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
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const Dependencies_1 = require("../Dependencies");
function telemetryStatusCommandDecorator() {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new TelemetryStatusCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.sessionContext(), Dependencies_1.dependencies.contextUtil()));
}
exports.telemetryStatusCommandDecorator = telemetryStatusCommandDecorator;
/**
 * Adds telemetry marktimes based on session state and status updates.
 */
class TelemetryStatusCommandDecorator {
    constructor(command, next, sessionContext, contextUtil) {
        this.command = command;
        this.next = next;
        this.sessionContext = sessionContext;
        this.contextUtil = contextUtil;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const stateCallback = (newState, previousState) => {
                context.trace.info(`SessionContext: State update from "${sessionTypes_1.SessionState[previousState]}" to "${sessionTypes_1.SessionState[newState]}".`);
                // TODO: Need to scrub the state
                context.telemetryEvent.markTime(`liveshare.SessionState${sessionTypes_1.SessionState[newState]}`);
            };
            const statusCallback = (newStatus, previousStatus) => {
                previousStatus = this.contextUtil.scrubPrefix(previousStatus);
                newStatus = this.contextUtil.scrubPrefix(newStatus);
                context.trace.info(`SessionContext: Status update from "${previousStatus}" to "${newStatus}".`);
                context.telemetryEvent.markTime(`liveshare.SessionStatus${newStatus}`);
            };
            try {
                this.sessionContext.addListener(sessionTypes_1.SessionEvents.StateChanged, stateCallback);
                this.sessionContext.addListener(sessionTypes_1.SessionEvents.StatusChanged, statusCallback);
                return yield this.next.invoke(options, context);
            }
            finally {
                this.sessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, stateCallback);
                this.sessionContext.removeListener(sessionTypes_1.SessionEvents.StatusChanged, statusCallback);
            }
        });
    }
}
exports.TelemetryStatusCommandDecorator = TelemetryStatusCommandDecorator;

//# sourceMappingURL=TelemetryStatusCommandDecorator.js.map
