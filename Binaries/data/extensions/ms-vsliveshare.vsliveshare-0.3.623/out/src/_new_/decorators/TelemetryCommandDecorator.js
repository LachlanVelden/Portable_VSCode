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
const telemetry_1 = require("../../telemetry/telemetry");
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const TelemetryUtil_1 = require("../util/TelemetryUtil");
const Dependencies_1 = require("../Dependencies");
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
function telemetryCommandDecorator(telemetryEventName, telemetryFaultEventName, telemetryTitle, telemetryEventVersion) {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new TelemetryCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.telemetry(), telemetryEventName, telemetryFaultEventName, telemetryTitle, telemetryEventVersion));
}
exports.telemetryCommandDecorator = telemetryCommandDecorator;
/**
 * Instrumentation `commandHandler` that automatically sets up any
 * default telemetry and tracing for a given command.
 */
class TelemetryCommandDecorator {
    constructor(command, next, telemetry, telemetryEventName, telemetryFaultEventName, telemetryTitle, telemetryEventVersion) {
        this.command = command;
        this.next = next;
        this.telemetry = telemetry;
        this.telemetryEventName = telemetryEventName;
        this.telemetryFaultEventName = telemetryFaultEventName;
        this.telemetryTitle = telemetryTitle;
        this.telemetryEventVersion = telemetryEventVersion;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            let error = undefined;
            let telemetryEvent = this.telemetry.startTimedEvent(this.telemetryEventName);
            let telemetryResult = undefined;
            let telemetryMessage = undefined;
            context.telemetryEvent = telemetryEvent;
            this.telemetry.setCorrelationEvent(telemetryEvent);
            telemetryEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.COMMAND_TEXT, context.commandText);
            telemetryEvent.addMeasure(telemetryStrings_1.TelemetryPropertyNames.TELEMETRY_EVENT_VERSION, this.telemetryEventVersion);
            try {
                result = yield this.next.invoke(options, context);
            }
            catch (e) {
                telemetryResult = TelemetryUtil_1.TelemetryUtil.DeriveTelemetryResult(e);
                telemetryMessage = TelemetryUtil_1.TelemetryUtil.BuildTelemetryMessage(this.telemetryTitle, telemetryResult, e.message);
                this.telemetry.sendFault(this.telemetryFaultEventName, TelemetryUtil_1.TelemetryUtil.MapTelemetryResultToFaultType(telemetryResult), telemetryMessage, e);
                error = e;
                throw e;
            }
            finally {
                telemetryMessage = telemetryMessage || TelemetryUtil_1.TelemetryUtil.BuildTelemetryMessage(this.telemetryTitle, telemetry_1.TelemetryResult.Success);
                const duration = telemetryEvent.end(telemetryResult, telemetryMessage);
                context.trace.traceEvent(TelemetryUtil_1.TelemetryUtil.MapTelemetryResultToTraceEventType(telemetryResult), 0, `Command: ${telemetryMessage} (${duration}ms)`);
                // noting that we have logged the error. We will check this up stream
                if (error) {
                    error.hasRecorded = true;
                }
            }
            return result;
        });
    }
}
exports.TelemetryCommandDecorator = TelemetryCommandDecorator;

//# sourceMappingURL=TelemetryCommandDecorator.js.map
