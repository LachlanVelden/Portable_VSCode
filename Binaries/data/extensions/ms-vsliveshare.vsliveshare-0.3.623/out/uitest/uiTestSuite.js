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
const path = require("path");
const mocha_typescript_1 = require("mocha-typescript");
const code_1 = require("@vsliveshare/vscode-automation/vscode/code");
const workbench_1 = require("@vsliveshare/vscode-automation/areas/workbench/workbench");
const clipboardy_1 = require("clipboardy");
const quickinput_1 = require("@vsliveshare/vscode-automation/areas/quickinput/quickinput");
const extensionDir = path.join(__dirname, '..', '..');
/**
 * Base class for UI test suites.
 */
class UITestSuite {
    constructor() {
        this.extensionInfo = require(path.join(extensionDir, 'package.json'));
    }
    get app() { return this.mochaContext && this.mochaContext.app; }
    get logger() { return this.app && this.app.logger; }
    get testAccount() {
        return this.mochaContext && this.mochaContext.testAccount;
    }
    get serviceUri() {
        return this.mochaContext && this.mochaContext.serviceUri;
    }
    get hostWindow() { return UITestSuite._hostWindow; }
    set hostWindow(value) { UITestSuite._hostWindow = value; }
    get guestWindow() { return UITestSuite._guestWindow; }
    set guestWindow(value) { UITestSuite._guestWindow = value; }
    get hostWorkbench() { return UITestSuite._hostWorkbench; }
    set hostWorkbench(value) { UITestSuite._hostWorkbench = value; }
    get guestWorkbench() { return UITestSuite._guestWorkbench; }
    set guestWorkbench(value) { UITestSuite._guestWorkbench = value; }
    get inviteUri() { return UITestSuite._inviteUri; }
    set inviteUri(value) { UITestSuite._inviteUri = value; }
    // Call from a static before() method in a subclass to start sharing before a test suite.
    static startSharing(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const suite = new UITestSuite();
            suite.mochaContext = context;
            yield suite.openGuestWindow();
            yield suite.share();
            yield suite.join();
        });
    }
    // Call from a static after() method in a subclass to end sharing after a test suite.
    static endSharing(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const suite = new UITestSuite();
            suite.mochaContext = context;
            yield suite.unjoin();
            yield suite.unshare();
        });
    }
    openGuestWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.guestWindow) {
                return; // Already open.
            }
            yield this.hostWorkbench.quickopen.runCommand('New Window');
            let newWindowId;
            yield this.hostWindow.waitForWindowIds((ids) => {
                if (ids.length === 2) {
                    newWindowId = ids[1];
                    return true;
                }
            });
            this.guestWindow = yield this.getNewWindow(this.hostWindow, newWindowId);
            this.guestWorkbench = new workbench_1.Workbench(this.guestWindow, this.app.userDataPath);
        });
    }
    getNewWindow(existingWindow, windowId) {
        return __awaiter(this, void 0, void 0, function* () {
            // This code accesses some private members of the `Code` class,
            // because it was not designed to support multi-window automation.
            const newWindow = new code_1.Code(existingWindow.process, existingWindow.client, existingWindow.driver, this.logger);
            newWindow._activeWindowId = windowId;
            newWindow.driver = existingWindow.driver;
            // Wait for the new window to be ready. (This code is copied from
            // Application.checkWindowReady(), which only works for the first window.)
            yield newWindow.waitForElement('.monaco-workbench');
            yield new Promise(c => setTimeout(c, 500));
            return newWindow;
        });
    }
    getLiveShareCommandInfo(id) {
        const command = this.extensionInfo.contributes.commands.find((c) => c.command === id);
        assert(command && command.title && command.category, 'Expected Live Share command: ' + id);
        return command;
    }
    runLiveShareCommand(workbench, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.getLiveShareCommandInfo(id);
            const title = command && command.title;
            const category = command && command.category;
            yield workbench.quickopen.runCommand(`${category}: ${title}`);
        });
    }
    runLiveShareCommandIfAvailable(workbench, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.getLiveShareCommandInfo(id);
            const title = command && command.title;
            const category = command && command.category;
            yield workbench.quickopen.openQuickOpen(`>${category}: ${title}`);
            yield workbench.quickopen.code.dispatchKeybinding('enter');
        });
    }
    waitForNotificationMessage(window, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield window.waitForElements('.notification-list-item-message', false, (elements) => {
                for (let element of elements) {
                    if (element.textContent.match(message)) {
                        return true;
                    }
                }
                return false;
            });
        });
    }
    /**
     * Waits for a statusbar with the given title (not label).
     * Or specify invert=true to wait until it goes away.
     */
    waitForStatusBarTitle(window, titleMatch, invert = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield window.waitForElements('.statusbar-entry a', false, (elements) => {
                for (let element of elements) {
                    const title = element.attributes['title'];
                    if (title && title.match(titleMatch)) {
                        return !invert;
                    }
                }
                return invert;
            });
        });
    }
    waitForDocumentTitle(window, titleMatch, invert = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield window.waitForElements('.monaco-icon-label a.label-name', false, (elements) => {
                for (let element of elements) {
                    const title = element.textContent;
                    if (title && title.match(titleMatch)) {
                        return !invert;
                    }
                }
                return invert;
            });
        });
    }
    share() {
        return __awaiter(this, void 0, void 0, function* () {
            // Dismiss any old notifications.
            yield this.hostWindow.dispatchKeybinding('escape');
            yield this.runLiveShareCommand(this.hostWorkbench, 'liveshare.start');
            if (UITestSuite.firstShare) {
                yield this.waitForDocumentTitle(this.hostWindow, 'vsliveshare-welcome-page');
                UITestSuite.firstShare = false;
            }
            else {
                yield this.waitForNotificationMessage(this.hostWindow, 'invite link copied');
            }
            this.inviteUri = clipboardy_1.readSync();
            assert(this.inviteUri && this.inviteUri.startsWith(this.serviceUri), 'Invite link should have been copied to clipboard.');
        });
    }
    unshare() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runLiveShareCommand(this.hostWorkbench, 'liveshare.end');
            yield this.waitForStatusBarTitle(this.hostWindow, /(Start Collaboration)|(Share the workspace)/);
        });
    }
    join() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runLiveShareCommand(this.guestWorkbench, 'liveshare.join');
            yield this.guestWorkbench.quickinput.waitForQuickInputOpened();
            yield this.guestWindow.waitForSetValue(quickinput_1.QuickInput.QUICK_INPUT_INPUT, this.inviteUri);
            yield this.guestWindow.dispatchKeybinding('enter');
            // The window should reload with collaborating status.
            // Consume some of the time here to reduce the liklihood of the next wait timing out.
            yield new Promise((c) => setTimeout(c, 5000));
            yield this.waitForStatusBarTitle(this.guestWindow, 'Collaborating');
        });
    }
    unjoin() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runLiveShareCommand(this.guestWorkbench, 'liveshare.leave');
            yield this.waitForStatusBarTitle(this.guestWindow, /(Start Collaboration)|(Share the workspace)/);
        });
    }
}
UITestSuite.firstShare = true;
__decorate([
    mocha_typescript_1.context
], UITestSuite.prototype, "mochaContext", void 0);
exports.UITestSuite = UITestSuite;

//# sourceMappingURL=uiTestSuite.js.map
