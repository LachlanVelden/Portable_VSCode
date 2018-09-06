"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
const browserSignIn_1 = require("./browserSignIn");
const quickinput_1 = require("@vsliveshare/vscode-automation/areas/quickinput/quickinput");
let SigninTests = class SigninTests extends uiTestSuite_1.UITestSuite {
    signInWithUserCode() {
        return __awaiter(this, void 0, void 0, function* () {
            const userCode = yield browserSignIn_1.signInWithBrowser(this.serviceUri, this.testAccount.provider, this.testAccount.email, this.testAccount.password, true);
            assert(userCode, 'Should have gotten a user code from browser sign-in.');
            yield this.runLiveShareCommandIfAvailable(this.hostWorkbench, 'liveshare.signout');
            yield this.waitForStatusBarTitle(this.hostWindow, 'Signed in', true);
            yield this.runLiveShareCommand(this.hostWorkbench, 'liveshare.signin.token');
            yield this.hostWorkbench.quickinput.waitForQuickInputOpened();
            yield this.hostWindow.waitForSetValue(quickinput_1.QuickInput.QUICK_INPUT_INPUT, userCode);
            yield this.hostWindow.dispatchKeybinding('enter');
            yield this.waitForStatusBarTitle(this.hostWindow, this.testAccount.email);
        });
    }
};
__decorate([
    mocha_typescript_1.test(mocha_typescript_1.slow(15000), mocha_typescript_1.timeout(60000))
], SigninTests.prototype, "signInWithUserCode", null);
SigninTests = __decorate([
    mocha_typescript_1.suite
], SigninTests);
exports.SigninTests = SigninTests;

//# sourceMappingURL=signin.test.js.map
