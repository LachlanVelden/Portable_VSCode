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
const child_process = require("child_process");
class AuthenticationFindCodeUtilLinux {
    constructor(notificationUtil, trace) {
        this.notificationUtil = notificationUtil;
        this.trace = trace;
    }
    findLoginCode(instanceId, cancellationToken) {
        const findLoginCodePromise = new Promise((resolve, reject) => {
            const findLoginCodeInterval = setInterval(() => {
                child_process.exec(`xprop -id $(xprop -root 32x '\t$0' _NET_ACTIVE_WINDOW | cut -f 2) WM_NAME`, (err, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                    if (err || stderr) {
                        // xprop not supported in this Linux distro
                        this.trace.error(err ? err.message : stderr);
                        const userCode = yield this.notificationUtil.showInputBox({
                            prompt: 'Sign in via the external browser, then paste the user code here.',
                            ignoreFocusOut: true,
                        }, cancellationToken);
                        return resolve(userCode);
                    }
                    const match = stdout.match(AuthenticationFindCodeUtilLinux.userCodeWithExtensionIdRegex);
                    if (match && match.length >= 3) {
                        const [_, userCode, extensionId] = match;
                        if (extensionId === instanceId) {
                            return resolve(userCode);
                        }
                    }
                }));
            }, 500);
            cancellationToken.onCancellationRequested(() => {
                clearInterval(findLoginCodeInterval);
            });
        });
        return findLoginCodePromise;
    }
}
AuthenticationFindCodeUtilLinux.userCodeWithExtensionIdRegex = /\[((?:[a-z]{4}\-){3}(?:[a-z]{4}){1}):([a-z0-9-]*)\]/i;
exports.AuthenticationFindCodeUtilLinux = AuthenticationFindCodeUtilLinux;

//# sourceMappingURL=AuthenticationFindCodeUtilLinux.js.map
