"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var CoeditingTests_1;
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let CoeditingTests = CoeditingTests_1 = class CoeditingTests extends uiTestSuite_1.UITestSuite {
    static before() { return uiTestSuite_1.UITestSuite.startSharing(CoeditingTests_1.mochaContext); }
    static after() { return uiTestSuite_1.UITestSuite.endSharing(CoeditingTests_1.mochaContext); }
    async summonAccept() {
        await this.summon('accept');
    }
    async summonPrompt() {
        await this.summon('prompt');
    }
    async summon(focusBehavior) {
        await this.changeSettings({ 'liveshare.focusBehavior': focusBehavior });
        await this.hostWorkbench.quickopen.runCommand('View: Close All Editors');
        await this.guestWorkbench.quickopen.runCommand('View: Close All Editors');
        // TODO: `this.guestWorkbench` implies only one guest, maybe we should do
        // `this.guestWorkbench[index]` instead some day
        await this.guestWorkbench.quickopen.openFile('index.js');
        await this.guestWorkbench.quickopen.openQuickOpen(':10');
        await this.guestWindow.dispatchKeybinding('enter');
        await this.runLiveShareCommand(this.guestWorkbench, 'liveshare.focusParticipants');
        await this.waitForNotificationMessage(this.guestWindow, 'Focus request sent.');
        if (focusBehavior === 'prompt') {
            await this.waitForAndClickNotificationButton(this.hostWindow, 'requested you to follow', 'Follow');
        }
        await this.hostWorkbench.editors.waitForTab('index.js');
        // TODO: Check that we're on the correct line.
    }
};
__decorate([
    mocha_typescript_1.test
], CoeditingTests.prototype, "summonAccept", null);
__decorate([
    mocha_typescript_1.test
], CoeditingTests.prototype, "summonPrompt", null);
__decorate([
    mocha_typescript_1.context
], CoeditingTests, "mochaContext", void 0);
CoeditingTests = CoeditingTests_1 = __decorate([
    mocha_typescript_1.suite
], CoeditingTests);
exports.CoeditingTests = CoeditingTests;

//# sourceMappingURL=coedit.test.js.map
