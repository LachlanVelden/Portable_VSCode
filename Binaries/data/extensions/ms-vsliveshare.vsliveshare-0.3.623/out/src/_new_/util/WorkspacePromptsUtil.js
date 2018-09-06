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
const vscode = require("vscode");
const config = require("../../config");
const session_1 = require("../../session");
const welcomePageUtil_1 = require("../../welcomePage/welcomePageUtil");
const abTestsUtil_1 = require("../../abTests/abTestsUtil");
/**
 * Helper functions for the various prompts we show for a workspace.
 */
class WorkspacePromptsUtil {
    constructor(sessionContext, stringUtil, notificationUtil, clipboardUtil, browserUtil, workspaceAccessControlManager) {
        this.sessionContext = sessionContext;
        this.stringUtil = stringUtil;
        this.notificationUtil = notificationUtil;
        this.clipboardUtil = clipboardUtil;
        this.browserUtil = browserUtil;
        this.workspaceAccessControlManager = workspaceAccessControlManager;
    }
    showInvitationLink(link) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!link || link === this.sessionContext.workspaceSessionInfo.joinUri) {
                const currentLink = this.sessionContext.workspaceSessionInfo.joinUri;
                yield this.clipboardUtil.copyToClipboardAsync(currentLink);
                // If the welcome page has never been displayed and the extension
                // has never been updated bypass the notification and show it directly.
                const isWelcomePageDisplayed = config.get(config.Key.isWelcomePageDisplayed);
                if (!isWelcomePageDisplayed && !abTestsUtil_1.isExtensionBeingUpdated()) {
                    yield welcomePageUtil_1.showWelcomePage(welcomePageUtil_1.WelcomePageSource.Sharing);
                    return;
                }
                const moreInfoButton = { id: 1, title: 'More info' };
                const copyButton = { id: 2, title: 'Copy again' };
                const toggleReadOnlyButton = { id: 3, title: session_1.SessionContext.IsReadOnly ? 'Make read/write' : 'Make read-only' };
                let buttons = [moreInfoButton, copyButton];
                if (config.featureFlags.accessControl) {
                    buttons.splice(0, 0, toggleReadOnlyButton);
                }
                const result = yield vscode.window.showInformationMessage('Invitation link copied to clipboard! Send it to anyone you trust or click "More info" to learn about secure sharing.', ...buttons);
                if (result && result.id === copyButton.id) {
                    // Prevent this button from dismissing the notification.
                    yield this.showInvitationLink(currentLink);
                }
                else if (result && result.id === moreInfoButton.id) {
                    yield welcomePageUtil_1.showWelcomePage(welcomePageUtil_1.WelcomePageSource.Sharing);
                }
                else if (result && result.id === toggleReadOnlyButton.id) {
                    yield this.workspaceAccessControlManager().setReadOnly(!session_1.SessionContext.IsReadOnly);
                }
            }
            else {
                yield vscode.window.showErrorMessage('This invite link has expired. Share again to generate a new link.');
            }
        });
    }
    showSecurityInfo() {
        const securityInfoLink = 'https://aka.ms/vsls-security';
        this.browserUtil.openBrowser(securityInfoLink);
    }
    showFirewallInformationMessage(messageId, showCancelOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const getHelp = 'Help';
            const ok = 'OK';
            let result;
            if (showCancelOption) {
                result = yield this.notificationUtil.showInformationMessage(this.stringUtil.getString(messageId), { modal: true }, getHelp, ok);
            }
            else {
                let getHelpObject = { title: getHelp, isCloseAffordance: false };
                result = yield this.notificationUtil.showInformationMessage(this.stringUtil.getString(messageId), { modal: true }, getHelpObject, { title: ok, isCloseAffordance: true });
                if (result === getHelpObject) {
                    result = getHelp;
                }
                else {
                    result = ok;
                }
            }
            if (result === getHelp) {
                this.showFirewallHelp();
                return yield this.showFirewallInformationMessage(messageId, showCancelOption);
            }
            else {
                return result === ok;
            }
        });
    }
    showFirewallHelp() {
        const firewallHelpLink = 'https://go.microsoft.com/fwlink/?linkid=869620';
        this.browserUtil.openBrowser(firewallHelpLink);
    }
}
exports.WorkspacePromptsUtil = WorkspacePromptsUtil;

//# sourceMappingURL=WorkspacePromptsUtil.js.map
