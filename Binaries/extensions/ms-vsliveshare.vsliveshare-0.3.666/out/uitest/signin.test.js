"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
const browserSignIn_1 = require("./browserSignIn");
const quickinput_1 = require("@vsliveshare/vscode-automation/areas/quickinput/quickinput");
let SigninTests = class SigninTests extends uiTestSuite_1.UITestSuite {
    async signInWithUserCode() {
        const userCode = await browserSignIn_1.signInWithBrowser(this.serviceUri, this.testAccount.provider, this.testAccount.email, this.testAccount.password, true);
        assert(userCode, 'Should have gotten a user code from browser sign-in.');
        await this.runLiveShareCommandIfAvailable(this.hostWorkbench, 'liveshare.signout');
        await this.waitForStatusBarTitle(this.hostWindow, 'Signed in', true);
        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.signin.token');
        await this.hostWorkbench.quickinput.waitForQuickInputOpened();
        await this.hostWindow.waitForSetValue(quickinput_1.QuickInput.QUICK_INPUT_INPUT, userCode);
        await this.hostWindow.dispatchKeybinding('enter');
        await this.waitForStatusBarTitle(this.hostWindow, this.testAccount.email);
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
