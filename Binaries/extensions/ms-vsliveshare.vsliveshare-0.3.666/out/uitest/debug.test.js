"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var DebugTests_1;
const http = require("http");
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let DebugTests = DebugTests_1 = class DebugTests extends uiTestSuite_1.UITestSuite {
    static before() { return uiTestSuite_1.UITestSuite.startSharing(DebugTests_1.mochaContext); }
    static after() { return uiTestSuite_1.UITestSuite.endSharing(DebugTests_1.mochaContext); }
    async guestSetBreakpoint() {
        await this.guestWorkbench.quickopen.openFile('index.js');
        await this.guestWorkbench.debug.setBreakpointOnLine(6);
        // Verify the breakpoint appears on the host side.
        await this.hostWorkbench.quickopen.openFile('index.js');
        await this.hostWindow.waitForElement('.debug-breakpoint');
    }
    async hostStartDebugging() {
        DebugTests_1.appPort = await this.hostWorkbench.debug.startDebugging();
        // Make a request that will hit the breakpoint.
        await new Promise((c, e) => {
            const request = http.get(`http://localhost:${DebugTests_1.appPort}`);
            request.on('error', e);
            // Wait for the host to hit the breakpoint.
            this.hostWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6')
                .then(c, e);
        });
        // Wait for the guest to hit the breakpoint.
        await this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6');
    }
    async guestStackFramesAndVariables() {
        // Ensure the debug variables viewlet is visible and the Locals tree item is expanded.
        await this.guestWorkbench.quickopen.runCommand('Debug: Focus Variables');
        await this.guestWindow.waitAndClick('.debug-view-content .scope');
        await this.guestWindow.dispatchKeybinding('right');
        await this.guestWorkbench.debug.waitForVariableCount(4);
        await this.guestWorkbench.debug.focusStackFrame('layer.js', 'looking for layer.js');
        await this.guestWorkbench.debug.waitForVariableCount(5);
        await this.guestWorkbench.debug.focusStackFrame('route.js', 'looking for route.js');
        await this.guestWorkbench.debug.waitForVariableCount(3);
        await this.guestWorkbench.debug.focusStackFrame('index.js', 'looking for index.js');
        await this.guestWorkbench.debug.waitForVariableCount(4);
    }
    async guestStepOverInOut() {
        await this.guestWorkbench.debug.stepIn();
        const first = await this.guestWorkbench.debug.waitForStackFrame(sf => /response\.js$/.test(sf.name), 'looking for response.js');
        await this.guestWorkbench.debug.stepOver();
        await this.guestWorkbench.debug.waitForStackFrame(sf => /response\.js$/.test(sf.name) && sf.lineNumber === first.lineNumber + 1, `looking for response.js and line ${first.lineNumber + 1}`);
        await this.guestWorkbench.debug.stepOut();
        await this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 7, `looking for index.js and line 7`);
    }
    async guestContinue() {
        await this.guestWorkbench.debug.continue();
        // Wait for the host to continue.
        await this.hostWindow.waitForElement('.debug-action.pause');
        // Make another request and wait for the breakpoint to hit again.
        await new Promise((c, e) => {
            const request = http.get(`http://localhost:${DebugTests_1.appPort}`);
            request.on('error', e);
            this.hostWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, `looking for index.js and line 6`)
                .then(c, e);
        });
        await this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6');
    }
    async guestDisconnectDebugging() {
        await this.disconnectDebugging(this.guestWindow);
    }
    async hostStop() {
        // stopDebugging() doesn't find the hidden toolbar on Mac.
        //await this.hostWorkbench.debug.stopDebugging();
        await this.hostWindow.waitAndClick('.debug-actions-widget .debug-action.stop');
        await this.hostWindow.waitForElement('.statusbar:not(debugging)');
    }
    async disconnectDebugging(window) {
        const DISCONNECT = `.debug-actions-widget .debug-action.disconnect`;
        const TOOLBAR_HIDDEN = `.debug-actions-widget.monaco-builder-hidden`;
        const NOT_DEBUG_STATUS_BAR = `.statusbar:not(debugging)`;
        await window.waitAndClick(DISCONNECT);
        await window.waitForElement(TOOLBAR_HIDDEN);
        await window.waitForElement(NOT_DEBUG_STATUS_BAR);
    }
};
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "guestSetBreakpoint", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "hostStartDebugging", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "guestStackFramesAndVariables", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "guestStepOverInOut", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "guestContinue", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "guestDisconnectDebugging", null);
__decorate([
    mocha_typescript_1.test
], DebugTests.prototype, "hostStop", null);
__decorate([
    mocha_typescript_1.context
], DebugTests, "mochaContext", void 0);
DebugTests = DebugTests_1 = __decorate([
    mocha_typescript_1.suite
], DebugTests);
exports.DebugTests = DebugTests;

//# sourceMappingURL=debug.test.js.map
