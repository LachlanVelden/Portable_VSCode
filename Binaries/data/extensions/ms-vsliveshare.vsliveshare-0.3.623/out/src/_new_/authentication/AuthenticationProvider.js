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
const config_1 = require("../../config");
/**
 * Provider which tracks whether the user is currently logged in or not.
 */
class AuthenticationProvider {
    constructor(authService, sessionContext, authenticationFindCodeUtil, configUtil) {
        this.authService = authService;
        this.sessionContext = sessionContext;
        this.authenticationFindCodeUtil = authenticationFindCodeUtil;
        this.configUtil = configUtil;
        this.shouldClearCache = false;
    }
    getLoginUri(cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.currentLoginUri || (this.currentLoginUri = yield this.authService.getLoginUriAsync());
        });
    }
    isAuthenticated() {
        return !!this.sessionContext.userInfo;
    }
    attemptDefaultLogin(options, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this.shouldClearCache = false;
            this.sessionContext.userInfo = yield this.authService.loginWithCachedTokenAsync({
                accountId: this.configUtil.get(config_1.Key.account),
                providerName: this.configUtil.get(config_1.Key.accountProvider),
            }, undefined, // TODO: pass options through once auth service refactored
            cancellationToken);
            return !!this.sessionContext.userInfo;
        });
    }
    attemptLogin(userCode, options, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this.shouldClearCache = false;
            this.sessionContext.userInfo = yield this.authService.loginAsync({ code: userCode }, {
                cache: true,
                cacheDefault: true
            }, // TODO: pass options through once auth service refactored
            cancellationToken);
            return !!this.sessionContext.userInfo;
        });
    }
    findLoginCode(instanceId, cancellationToken) {
        return this.authenticationFindCodeUtil.findLoginCode(instanceId, cancellationToken);
    }
    clearCache(cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionContext.userInfo = undefined;
            this.shouldClearCache = true;
            return undefined;
        });
    }
    getCurrentUser() {
        return this.sessionContext.userInfo;
    }
}
exports.AuthenticationProvider = AuthenticationProvider;

//# sourceMappingURL=AuthenticationProvider.js.map
