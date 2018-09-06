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
var DebugTests_1;
const http = require("http");
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let DebugTests = DebugTests_1 = class DebugTests extends uiTestSuite_1.UITestSuite {
    static before() { return uiTestSuite_1.UITestSuite.startSharing(DebugTests_1.mochaContext); }
    static after() { return uiTestSuite_1.UITestSuite.endSharing(DebugTests_1.mochaContext); }
    guestSetBreakpoint() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.guestWorkbench.quickopen.openFile('index.js');
            yield this.guestWorkbench.debug.setBreakpointOnLine(6);
            // Verify the breakpoint appears on the host side.
            yield this.hostWorkbench.quickopen.openFile('index.js');
            yield this.hostWindow.waitForElement('.debug-breakpoint');
        });
    }
    hostStartDebugging() {
        return __awaiter(this, void 0, void 0, function* () {
            DebugTests_1.appPort = yield this.hostWorkbench.debug.startDebugging();
            // Make a request that will hit the breakpoint.
            yield new Promise((c, e) => {
                const request = http.get(`http://localhost:${DebugTests_1.appPort}`);
                request.on('error', e);
                // Wait for the host to hit the breakpoint.
                this.hostWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6')
                    .then(c, e);
            });
            // Wait for the guest to hit the breakpoint.
            yield this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6');
        });
    }
    guestStackFramesAndVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the debug variables viewlet is visible and the Locals tree item is expanded.
            yield this.guestWorkbench.quickopen.runCommand('Debug: Focus Variables');
            yield this.guestWindow.waitAndClick('.debug-view-content .scope');
            yield this.guestWindow.dispatchKeybinding('right');
            yield this.guestWorkbench.debug.waitForVariableCount(4);
            yield this.guestWorkbench.debug.focusStackFrame('layer.js', 'looking for layer.js');
            yield this.guestWorkbench.debug.waitForVariableCount(5);
            yield this.guestWorkbench.debug.focusStackFrame('route.js', 'looking for route.js');
            yield this.guestWorkbench.debug.waitForVariableCount(3);
            yield this.guestWorkbench.debug.focusStackFrame('index.js', 'looking for index.js');
            yield this.guestWorkbench.debug.waitForVariableCount(4);
        });
    }
    guestStepOverInOut() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.guestWorkbench.debug.stepIn();
            const first = yield this.guestWorkbench.debug.waitForStackFrame(sf => /response\.js$/.test(sf.name), 'looking for response.js');
            yield this.guestWorkbench.debug.stepOver();
            yield this.guestWorkbench.debug.waitForStackFrame(sf => /response\.js$/.test(sf.name) && sf.lineNumber === first.lineNumber + 1, `looking for response.js and line ${first.lineNumber + 1}`);
            yield this.guestWorkbench.debug.stepOut();
            yield this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 7, `looking for index.js and line 7`);
        });
    }
    guestContinue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.guestWorkbench.debug.continue();
            // Wait for the host to continue.
            yield this.hostWindow.waitForElement('.debug-action.pause');
            // Make another request and wait for the breakpoint to hit again.
            yield new Promise((c, e) => {
                const request = http.get(`http://localhost:${DebugTests_1.appPort}`);
                request.on('error', e);
                this.hostWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, `looking for index.js and line 6`)
                    .then(c, e);
            });
            yield this.guestWorkbench.debug.waitForStackFrame(sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6, 'looking for index.js and line 6');
        });
    }
    guestDisconnectDebugging() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.disconnectDebugging(this.guestWindow);
        });
    }
    hostStop() {
        return __awaiter(this, void 0, void 0, function* () {
            // stopDebugging() doesn't find the hidden toolbar on Mac.
            //await this.hostWorkbench.debug.stopDebugging();
            yield this.hostWindow.waitAndClick('.debug-actions-widget .debug-action.stop');
            yield this.hostWindow.waitForElement('.statusbar:not(debugging)');
        });
    }
    disconnectDebugging(window) {
        return __awaiter(this, void 0, void 0, function* () {
            const DISCONNECT = `.debug-actions-widget .debug-action.disconnect`;
            const TOOLBAR_HIDDEN = `.debug-actions-widget.monaco-builder-hidden`;
            const NOT_DEBUG_STATUS_BAR = `.statusbar:not(debugging)`;
            yield window.waitAndClick(DISCONNECT);
            yield window.waitForElement(TOOLBAR_HIDDEN);
            yield window.waitForElement(NOT_DEBUG_STATUS_BAR);
        });
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
