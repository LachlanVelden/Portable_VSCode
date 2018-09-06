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
const path = require("path");
const welcomePageHTMLProvider_1 = require("./welcomePageHTMLProvider");
const config = require("../config");
const telemetry_1 = require("../telemetry/telemetry");
const telemetryStrings_1 = require("../telemetry/telemetryStrings");
const session_1 = require("../session");
const sessionTypes_1 = require("../sessionTypes");
let welcomePanel;
let welcomePageHTMLProvider;
exports.showWelcomeNotification = () => __awaiter(this, void 0, void 0, function* () {
    // make sure the `what's new` notification is not shown
    yield config.save(config.Key.whatsNewUri, '');
    new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_TOAST_SHOWN).send();
    const getStartedButton = { title: 'Get started' };
    const result = yield vscode.window.showInformationMessage('VS Live Share installed! You can now collaboratively edit and debug with your team in real time.', getStartedButton);
    const welcomePageToastInteractionTelemetryEvent = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_TOAST_SHOWN_INTERACTION);
    if (result && (result.title === getStartedButton.title)) {
        // show the welcome page
        yield exports.showWelcomePage(WelcomePageSource.Install);
        welcomePageToastInteractionTelemetryEvent.addProperty('openedPage', true);
        yield config.save(config.Key.isWelcomePageDisplayed, true);
    }
    else {
        welcomePageToastInteractionTelemetryEvent.addProperty('openedPage', false);
    }
    welcomePageToastInteractionTelemetryEvent.send();
});
exports.showWelcomePage = (source) => __awaiter(this, void 0, void 0, function* () {
    // show the welcome page
    const welcomePageShownTelemetryEvent = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_SHOWN);
    welcomePageShownTelemetryEvent.addProperty('source', source);
    welcomePageShownTelemetryEvent.addProperty('state', sessionTypes_1.SessionState[session_1.SessionContext.State]);
    // Check if WebviewPanel API exists
    const window = vscode.window;
    if (typeof window.createWebviewPanel === 'function') {
        welcomePageShownTelemetryEvent.addProperty('type', 'web-view');
        showWebViewWelcomePage(window);
    }
    else {
        // Otherwise fallback to TextDocumentContentProvider
        // This fallback can be removed when we no longer support
        // older versions of VSCode without WebviewPanel API
        welcomePageShownTelemetryEvent.addProperty('type', 'html-preview');
        yield showHTMLPreviewWelcomePage();
    }
    welcomePageShownTelemetryEvent.send();
    yield config.save(config.Key.isWelcomePageDisplayed, true);
});
var WelcomePageSource;
(function (WelcomePageSource) {
    WelcomePageSource["Help"] = "Help";
    WelcomePageSource["Install"] = "Install";
    WelcomePageSource["Sharing"] = "Sharing";
})(WelcomePageSource = exports.WelcomePageSource || (exports.WelcomePageSource = {}));
function getJoinUri() {
    const isShared = (session_1.SessionContext.State === sessionTypes_1.SessionState.Shared);
    return isShared && session_1.SessionContext.workspaceSessionInfo ? session_1.SessionContext.workspaceSessionInfo.joinUri : null;
}
function showHTMLPreviewWelcomePage() {
    return __awaiter(this, void 0, void 0, function* () {
        const previewUri = vscode.Uri.parse('vsliveshare-welcome-page://authority/vsliveshare-welcome-page');
        if (!welcomePageHTMLProvider) {
            welcomePageHTMLProvider = new welcomePageHTMLProvider_1.default();
            welcomePageHTMLProvider.joinUri = getJoinUri();
            welcomePageHTMLProvider.isWebview = false;
            vscode.workspace.registerTextDocumentContentProvider('vsliveshare-welcome-page', welcomePageHTMLProvider);
            const onSessionStateChanged = (newState, previousState) => __awaiter(this, void 0, void 0, function* () {
                // The session state has changed, update welcome page
                welcomePageHTMLProvider.joinUri = getJoinUri();
                welcomePageHTMLProvider.update(previewUri);
            });
            session_1.SessionContext.addListener(sessionTypes_1.SessionEvents.StateChanged, onSessionStateChanged);
        }
        yield vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One);
    });
}
function showWebViewWelcomePage(window) {
    if (welcomePanel) {
        // Welcome panel already exists reveal it
        welcomePanel.reveal(vscode.ViewColumn.One);
        return;
    }
    if (!welcomePageHTMLProvider) {
        welcomePageHTMLProvider = new welcomePageHTMLProvider_1.default();
    }
    const extensionDir = path.resolve(__dirname, '../../');
    const welcomePagePath = path.join(extensionDir, 'src/welcomePage');
    welcomePanel = window.createWebviewPanel('vsliveshare-welcome-page', 'vsliveshare-welcome-page', vscode.ViewColumn.One, {
        enableScripts: true,
        // Restrict the webview to only load content from the `welcomePage` directory.
        localResourceRoots: [
            vscode.Uri.file(welcomePagePath)
        ]
    });
    welcomePageHTMLProvider.joinUri = getJoinUri();
    welcomePageHTMLProvider.isWebview = true;
    welcomePanel.webview.html = welcomePageHTMLProvider.provideTextDocumentContent(null);
    welcomePanel.webview.onDidReceiveMessage(function (message) {
        switch (message.command) {
            case 'copyUrl':
                const welcomePageCopyClickedTelemetryEvent = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_COPY_CLICKED);
                vscode.commands.executeCommand('liveshare.collaboration.link.copy');
                welcomePageCopyClickedTelemetryEvent.send();
                return;
            case 'onClick':
                const welcomePageLinkClickedTelemetryEvent = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_LINK_CLICKED);
                welcomePageLinkClickedTelemetryEvent.addProperty('link', message.text);
                welcomePageLinkClickedTelemetryEvent.send();
                return;
            default:
                return;
        }
    });
    const onSessionStateChanged = (newState, previousState) => __awaiter(this, void 0, void 0, function* () {
        // The session state has changed, update welcome page
        welcomePageHTMLProvider.joinUri = getJoinUri();
        welcomePanel.webview.html = welcomePageHTMLProvider.provideTextDocumentContent(null);
    });
    session_1.SessionContext.addListener(sessionTypes_1.SessionEvents.StateChanged, onSessionStateChanged);
    welcomePanel.onDidDispose(() => {
        const welcomePageDismissedTelemetryEvent = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.WELCOME_PAGE_DISMISSED);
        session_1.SessionContext.removeListener(sessionTypes_1.SessionEvents.StateChanged, onSessionStateChanged);
        welcomePanel = null;
        welcomePageDismissedTelemetryEvent.send();
    });
}

//# sourceMappingURL=welcomePageUtil.js.map
