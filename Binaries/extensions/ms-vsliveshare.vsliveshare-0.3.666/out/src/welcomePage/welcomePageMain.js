//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
class WelcomePageUtils {
    constructor() {
        this.vsCodeApi = (typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : null;
    }
    static get Instance() {
        if (!WelcomePageUtils.singleton) {
            WelcomePageUtils.singleton = new WelcomePageUtils();
        }
        return WelcomePageUtils.singleton;
    }
    copyLink() {
        if (!this.vsCodeApi) {
            return;
        }
        this.vsCodeApi.postMessage({
            command: 'copyUrl'
        });
    }
    onClick(text) {
        if (!this.vsCodeApi) {
            return;
        }
        this.vsCodeApi.postMessage({
            command: 'onClick',
            text: text
        });
    }
}
const welcomePageUtils = WelcomePageUtils.Instance;
if (isSharing) {
    document.getElementById('step-share').style.display = 'none';
    document.getElementById('join-uri-box').oncopy = () => welcomePageUtils.copyLink();
    document.getElementById('join-uri-copy-button').onclick = () => welcomePageUtils.copyLink();
}
else {
    document.getElementById('join-uri').style.display = 'none';
    document.getElementById('join-uri-copy-button').style.display = 'none';
    document.getElementById('join-uri-box').style.display = 'none';
    document.getElementById('share-with-yourself-link').style.display = 'none';
}
if (!isWebView) {
    document.getElementById('join-uri-copy-button').style.display = 'none';
}
else {
    // on click telemetry handlers
    const securityLink = document.getElementById('security-info-link');
    securityLink.onclick = () => welcomePageUtils.onClick('security-info-link');
    const followLink1 = document.getElementById('follow-guest-link1');
    followLink1.onclick = () => welcomePageUtils.onClick('follow-guest-link');
    const followLink2 = document.getElementById('follow-guest-link2');
    followLink2.onclick = () => welcomePageUtils.onClick('follow-guest-link');
    const shareTerminalLink = document.getElementById('share-terminal-link');
    shareTerminalLink.onclick = () => welcomePageUtils.onClick('share-terminal-link');
    const startVoiceCallLink = document.getElementById('start-voice-call-link');
    startVoiceCallLink.onclick = () => welcomePageUtils.onClick('start-voice-call-link');
    const shareServerLink = document.getElementById('share-server-link');
    shareServerLink.onclick = () => welcomePageUtils.onClick('share-server-link');
    const shareDebugSessionLink = document.getElementById('share-debug-session-link');
    shareDebugSessionLink.onclick = () => welcomePageUtils.onClick('share-debug-session-link');
    const shareWithYourselfLink = document.getElementById('share-with-yourself-link');
    shareWithYourselfLink.onclick = () => welcomePageUtils.onClick('share-with-yourself-link');
    const troubleShootingLink = document.getElementById('troubleshooting-link');
    troubleShootingLink.onclick = () => welcomePageUtils.onClick('troubleshooting-link');
    const gitHubLink = document.getElementById('github-link');
    gitHubLink.onclick = () => welcomePageUtils.onClick('github-link');
}

//# sourceMappingURL=welcomePageMain.js.map
