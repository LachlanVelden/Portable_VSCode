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
const vsls = require("../../contracts/VSLS");
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const Dependencies_1 = require("../Dependencies");
function authenticationCommandDecorator(statusPostAuth, authAttemptMax) {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new AuthenticationCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.sessionContext(), Dependencies_1.dependencies.authenticationFlow(), Dependencies_1.dependencies.authenticationProvider(), statusPostAuth, authAttemptMax));
}
exports.authenticationCommandDecorator = authenticationCommandDecorator;
/**
 * When a command fails do to auth, automatically retry.
 */
class AuthenticationCommandDecorator {
    constructor(command, next, sessionContext, authenticationFlow, authenticationProvider, statusPostAuth, authAttemptMax = 1) {
        this.command = command;
        this.next = next;
        this.sessionContext = sessionContext;
        this.authenticationFlow = authenticationFlow;
        this.authenticationProvider = authenticationProvider;
        this.statusPostAuth = statusPostAuth;
        this.authAttemptMax = authAttemptMax;
        this.authAttemptCount = 0;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            try {
                // Record number of attempts
                context.telemetryEvent.addMeasure(telemetryStrings_1.TelemetryPropertyNames.COMMAND_AUTH_RETRY_COUNT, this.authAttemptCount);
                // Record the fact that a blocking auth operation has occurred
                if (!this.authenticationProvider.isAuthenticated()) {
                    context.telemetryEvent.addPropertyIfNotExists(telemetryStrings_1.TelemetryPropertyNames.COMMAND_DID_AUTH, true);
                }
                // Check to see if we are already logged in. Note if its the first time
                // this call will attempt to login using cached credentials.
                if (!(yield this.authenticationFlow.attemptAuthenticationCheckFlow(undefined, true, context.cancellationToken))) {
                    // Record the fact that a blocking auth operation has occurred
                    context.telemetryEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.COMMAND_DID_AUTH_FULL, true);
                    // Since we aren't logged in, we will open a browser and wait for the
                    // user code to be returned.
                    yield this.authenticationFlow.attemptLoginFlow(undefined, false, context.cancellationToken);
                }
                // Ensure that we set the state post auth back to something that the
                // core command is happy with.
                if (this.statusPostAuth !== undefined) {
                    this.sessionContext.transition(this.statusPostAuth);
                }
                // At this point we should be logged in (given that auth fail will throw
                // an error and be caught below) and then call next middleware, might
                // result in a AuthRequired error
                result = yield this.next.invoke(options, context);
            }
            catch (error) {
                // Case 1: We get to the point of calling the service but the service says
                //         we aren't currently authed
                let httpException = error;
                if (httpException.code === vsls.ErrorCodes.UnauthorizedHttpStatusCode) {
                    // Case 1.1: We have retries left and we should try going around again.
                    if (this.authAttemptCount++ < this.authAttemptMax) {
                        context.trace.info(`AuthRetry: About to retry, attempt ${this.authAttemptCount}.`);
                        // Clear cache for next call around.
                        yield this.authenticationProvider.clearCache();
                        // Invoke this auth middleware again with context set to clear
                        // out any stored/cache auth info.
                        result = yield this.invoke(options, context);
                        // Case 1.2: We have no more retries left and we are simply bubbling up
                        //           auth error the agent sent us.
                    }
                    else {
                        context.trace.info('AuthRetry: No authentication fail retries left.');
                        throw error;
                    }
                    // Case 2: They tried signing in and the a valid user profile wasn't returned or
                    //         that process threw an exception.
                    // Case 3: Something else flower in the invoke chain threw an unrelated auth error.
                }
                else {
                    throw error;
                }
            }
            return result;
        });
    }
}
exports.AuthenticationCommandDecorator = AuthenticationCommandDecorator;

//# sourceMappingURL=AuthenticationCommandDecorator.js.map
