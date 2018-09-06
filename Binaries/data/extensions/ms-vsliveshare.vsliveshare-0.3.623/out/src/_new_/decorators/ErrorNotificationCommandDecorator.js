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
const UserError_1 = require("../abstractions/UserError");
const CancellationError_1 = require("../abstractions/CancellationError");
const NonBlockingError_1 = require("../abstractions/NonBlockingError");
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const Dependencies_1 = require("../Dependencies");
function errorNotificationCommandDecorator(telemetryFaultEventName) {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new ErrorNotificationCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.stringUtil(), Dependencies_1.dependencies.notificationUtil(), Dependencies_1.dependencies.telemetry(), telemetryFaultEventName));
}
exports.errorNotificationCommandDecorator = errorNotificationCommandDecorator;
/**
 * Error Notification `commandHandler` that converts exceptions into the correct
 * notification toast in the client.
 */
class ErrorNotificationCommandDecorator {
    constructor(command, next, stringUtil, notificationUtil, telemetry, telemetryFaultEventName) {
        this.command = command;
        this.next = next;
        this.stringUtil = stringUtil;
        this.notificationUtil = notificationUtil;
        this.telemetry = telemetry;
        this.telemetryFaultEventName = telemetryFaultEventName;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            try {
                result = yield this.next.invoke(options, context);
            }
            catch (error) {
                try {
                    let message = error.message;
                    if (error.code) {
                        message = this.stringUtil.getErrorString(error.code);
                    }
                    if (error instanceof UserError_1.UserError
                        || error instanceof CancellationError_1.CancellationError) {
                        this.notificationUtil.showInformationMessage(message);
                    }
                    else if (!(error instanceof NonBlockingError_1.NonBlockingError)) {
                        yield this.notificationUtil.showErrorMessage(message);
                    }
                    // if the error has been recorded, swallow the exception
                    if (error.hasRecorded) {
                        error = undefined;
                    }
                }
                catch (e) {
                    // if the above block triggered an error we want to know
                    error = e;
                }
                // at this this point we will know about any errors that hasn't been
                // recorded - anything thats happened up stream of `TelemetryCommandMiddleware`
                if (error && !error.hasRecorded) {
                    const errorMessage = `Unhandled exception (decorator): ${error.message}`;
                    context.trace.error(errorMessage);
                    this.telemetry.sendFault(this.telemetryFaultEventName, telemetry_1.FaultType.Error, errorMessage, error);
                }
            }
            return result;
        });
    }
}
exports.ErrorNotificationCommandDecorator = ErrorNotificationCommandDecorator;

//# sourceMappingURL=ErrorNotificationCommandDecorator.js.map
