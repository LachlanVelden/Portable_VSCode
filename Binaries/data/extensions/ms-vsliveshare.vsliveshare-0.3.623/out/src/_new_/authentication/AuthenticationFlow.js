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
const uuid4 = require("uuid/v4");
const session_1 = require("../../session");
const UserError_1 = require("../abstractions/UserError");
/**
 * Attempts to step through the login workflow.
 */
class AuthenticationFlow {
    constructor(authenticationProvider, sessionContext, browserUtil, trace) {
        this.authenticationProvider = authenticationProvider;
        this.sessionContext = sessionContext;
        this.browserUtil = browserUtil;
        this.trace = trace;
        this.isWarm = false;
    }
    attemptAuthenticationCheckFlow(options, suppressException, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            let isAuthenticated = false;
            let error;
            try {
                isAuthenticated = yield this.attemptAuthenticationCheckFlowCore(options, cancellationToken);
            }
            catch (e) {
                // Store error so we don't have to duplicate the below non success
                // logic below.
                error = e;
            }
            if (!isAuthenticated) {
                if (error) {
                    this.sessionContext.transition(session_1.SessionAction.SignInError);
                    if (!suppressException) {
                        throw error;
                    }
                    else {
                        this.trace.error(`Suppressed Exception (AuthenticationFlow.attemptAuthenticationCheckFlow): ${error.message}`);
                    }
                }
                else {
                    this.sessionContext.transition(session_1.SessionAction.SignOut);
                }
            }
            else {
                this.sessionContext.transition(session_1.SessionAction.SignInSuccess);
            }
            return isAuthenticated;
        });
    }
    attemptLoginFlow(options, suppressException, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            let isSuccess = false;
            let error;
            try {
                isSuccess = yield this.attemptLoginFlowCore(options, cancellationToken);
            }
            catch (e) {
                // Store error so we don't have to duplicate the below non success
                // logic below.
                error = e;
            }
            // Dealing with the case where we either didn't get a profile or something
            // else in the above threw.
            if (!isSuccess) {
                this.sessionContext.transition(session_1.SessionAction.SignInError);
                const errorMessage = (error && error.message) || 'The user code is invalid or expired. Try signing in again.';
                if (!suppressException) {
                    // Signal to the system that login failed
                    throw error || new UserError_1.UserError(errorMessage);
                }
                else {
                    this.trace.error(`Suppressed Exception (AuthenticationFlow.attemptLoginFlow): ${errorMessage}`);
                }
            }
            else {
                this.sessionContext.transition(session_1.SessionAction.SignInSuccess);
            }
        });
    }
    attemptAuthenticationCheckFlowCore(options, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check with the auth provider what it thinks the current state is.
            const isAuthenticated = this.authenticationProvider.isAuthenticated();
            if (!this.isWarm && !isAuthenticated) {
                this.sessionContext.transition(session_1.SessionAction.AttemptSignIn);
                // Warm lets us know if we have already tried default login before.
                this.isWarm = true;
                // Attempt to login using the default/stored credentials if we can.
                return this.authenticationProvider.attemptDefaultLogin(options, cancellationToken);
            }
            return isAuthenticated;
        });
    }
    attemptLoginFlowCore(options, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const instanceId = uuid4();
            const baseLoginUri = yield this.authenticationProvider.getLoginUri(cancellationToken);
            const loginUri = `${baseLoginUri}?extensionId=${instanceId}`;
            // Open browser to allow user to go through oAuth flow.
            // TODO: instead of opening browser open web view... that means we wont need
            //       to prompt user to tell them that we are opening auth tab.
            this.browserUtil.openBrowser(loginUri);
            this.sessionContext.transition(session_1.SessionAction.AwaitExternalSignIn);
            // Pause execution whilst we wait for external code to return.
            const userCode = yield this.authenticationProvider.findLoginCode(instanceId, cancellationToken);
            this.sessionContext.transition(session_1.SessionAction.AttemptSignIn);
            // Attempt to login with the returned user code.
            return yield this.authenticationProvider.attemptLogin(userCode, options, cancellationToken);
        });
    }
}
exports.AuthenticationFlow = AuthenticationFlow;

//# sourceMappingURL=AuthenticationFlow.js.map
