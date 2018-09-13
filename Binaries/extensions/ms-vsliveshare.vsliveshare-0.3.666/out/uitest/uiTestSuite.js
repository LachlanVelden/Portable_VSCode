"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const util = require("util");
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
    static async startSharing(context) {
        const suite = new UITestSuite();
        suite.mochaContext = context;
        await suite.openGuestWindow();
        await suite.share();
        await suite.join();
    }
    // Call from a static after() method in a subclass to end sharing after a test suite.
    static async endSharing(context) {
        const suite = new UITestSuite();
        suite.mochaContext = context;
        await suite.unjoin();
        await suite.unshare();
    }
    async openGuestWindow() {
        if (this.guestWindow) {
            return; // Already open.
        }
        await this.hostWorkbench.quickopen.runCommand('New Window');
        let newWindowId;
        await this.hostWindow.waitForWindowIds((ids) => {
            if (ids.length === 2) {
                newWindowId = ids[1];
                return true;
            }
        });
        this.guestWindow = await this.getNewWindow(this.hostWindow, newWindowId);
        this.guestWorkbench = new workbench_1.Workbench(this.guestWindow, this.app.userDataPath);
    }
    async getNewWindow(existingWindow, windowId) {
        // This code accesses some private members of the `Code` class,
        // because it was not designed to support multi-window automation.
        const newWindow = new code_1.Code(existingWindow.process, existingWindow.client, existingWindow.driver, this.logger);
        newWindow._activeWindowId = windowId;
        newWindow.driver = existingWindow.driver;
        // Wait for the new window to be ready. (This code is copied from
        // Application.checkWindowReady(), which only works for the first window.)
        await newWindow.waitForElement('.monaco-workbench');
        await new Promise(c => setTimeout(c, 500));
        return newWindow;
    }
    getLiveShareCommandInfo(id) {
        const command = this.extensionInfo.contributes.commands.find((c) => c.command === id);
        assert(command && command.title && command.category, 'Expected Live Share command: ' + id);
        return command;
    }
    async runLiveShareCommand(workbench, id) {
        const command = this.getLiveShareCommandInfo(id);
        const title = command && command.title;
        const category = command && command.category;
        await workbench.quickopen.runCommand(`${category}: ${title}`);
    }
    async runLiveShareCommandIfAvailable(workbench, id) {
        const command = this.getLiveShareCommandInfo(id);
        const title = command && command.title;
        const category = command && command.category;
        await workbench.quickopen.openQuickOpen(`>${category}: ${title}`);
        await workbench.quickopen.code.dispatchKeybinding('enter');
    }
    async waitForNotificationMessage(window, message) {
        await window.waitForElements('.notification-list-item-message', false, (elements) => {
            for (let element of elements) {
                if (element.textContent.match(message)) {
                    return true;
                }
            }
            return false;
        });
    }
    async waitForAndClickNotificationButton(window, message, buttonText) {
        await this.waitForNotificationMessage(window, message);
        // Notifications animate in, so they can't be clicked immediately.
        await new Promise((c) => setTimeout(c, 500));
        await this.hostWindow.waitAndClick(`.notification-list-item-buttons-container a.monaco-button[title="${buttonText}"]`);
    }
    /**
     * Waits for a statusbar with the given title (not label).
     * Or specify invert=true to wait until it goes away.
     */
    async waitForStatusBarTitle(window, titleMatch, invert = false) {
        await window.waitForElements('.statusbar-entry a', false, (elements) => {
            for (let element of elements) {
                const title = element.attributes['title'];
                if (title && title.match(titleMatch)) {
                    return !invert;
                }
            }
            return invert;
        });
    }
    async waitForDocumentTitle(window, titleMatch, invert = false) {
        await window.waitForElements('.monaco-icon-label a.label-name', false, (elements) => {
            for (let element of elements) {
                const title = element.textContent;
                if (title && title.match(titleMatch)) {
                    return !invert;
                }
            }
            return invert;
        });
    }
    async share(connectionMode = 'direct') {
        // Dismiss any old notifications.
        await this.hostWindow.dispatchKeybinding('escape');
        await this.changeSettings({ 'liveshare.connectionMode': connectionMode });
        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.start');
        if (UITestSuite.firstShare) {
            await this.waitForDocumentTitle(this.hostWindow, 'vsliveshare-welcome-page');
            UITestSuite.firstShare = false;
        }
        else {
            await this.waitForNotificationMessage(this.hostWindow, 'Invitation link copied');
        }
        this.inviteUri = clipboardy_1.readSync();
        assert(this.inviteUri && this.inviteUri.startsWith(this.serviceUri), 'Invite link should have been copied to clipboard.');
    }
    async unshare() {
        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.end');
        await this.waitForStatusBarTitle(this.hostWindow, /(Start Collaboration)|(Share the workspace)/);
    }
    async join(connectionMode = 'direct') {
        await this.changeSettings({ 'liveshare.connectionMode': connectionMode });
        await this.runLiveShareCommand(this.guestWorkbench, 'liveshare.join');
        await this.guestWorkbench.quickinput.waitForQuickInputOpened();
        await this.guestWindow.waitForSetValue(quickinput_1.QuickInput.QUICK_INPUT_INPUT, this.inviteUri);
        await this.guestWindow.dispatchKeybinding('enter');
        // The window should reload with collaborating status.
        // Consume some of the time here to reduce the liklihood of the next wait timing out.
        await new Promise((c) => setTimeout(c, 5000));
        await this.waitForStatusBarTitle(this.guestWindow, 'Collaborating');
    }
    async unjoin() {
        await this.runLiveShareCommand(this.guestWorkbench, 'liveshare.leave');
        await this.waitForStatusBarTitle(this.guestWindow, /(Start Collaboration)|(Share the workspace)/);
    }
    async changeSettings(settings) {
        const settingsFilePath = this.mochaContext.settingsFilePath;
        let settingsObject = JSON.parse((await util.promisify(fs.readFile)(settingsFilePath)).toString());
        for (let name in settings) {
            let value = settings[name];
            if (typeof value === 'undefined') {
                delete settingsObject[name];
            }
            else {
                settingsObject[name] = value;
            }
        }
        await util.promisify(fs.writeFile)(settingsFilePath, JSON.stringify(settingsObject, null, '\t'));
    }
}
UITestSuite.firstShare = true;
__decorate([
    mocha_typescript_1.context
], UITestSuite.prototype, "mochaContext", void 0);
exports.UITestSuite = UITestSuite;

//# sourceMappingURL=uiTestSuite.js.map
