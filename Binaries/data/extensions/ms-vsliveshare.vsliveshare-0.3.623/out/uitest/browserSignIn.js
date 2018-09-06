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
const fs = require("fs");
const os = require("os");
const puppeteer = require('puppeteer-core');
function getChromeExePath() {
    let chromeExePath;
    switch (os.platform()) {
        case 'win32':
            chromeExePath = process.env['ProgramFiles(x86)'] +
                '\\Google\\Chrome\\Application\\chrome.exe';
            break;
        case 'darwin':
            chromeExePath = '/Applications/Google\ Chrome.app/Contents/MacOS/Google Chrome';
            break;
        default:
            throw new Error('getChromeExePath() not implemented on this OS.');
    }
    if (!fs.existsSync(chromeExePath)) {
        throw new Error(`Chrome not found at ${chromeExePath}`);
    }
    return chromeExePath;
}
function signInWithBrowser(serviceBaseUri, accountType, username, password, visible) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!serviceBaseUri) {
            throw new Error('Service base URI is required.');
        }
        else if (!serviceBaseUri.endsWith('/')) {
            serviceBaseUri += '/';
        }
        const signInUri = serviceBaseUri + 'auth/identity/' + accountType;
        const options = {
            executablePath: getChromeExePath(),
            headless: !visible,
            slowMo: 10,
        };
        const browser = yield puppeteer.launch(options);
        const browserContext = yield browser.createIncognitoBrowserContext();
        const page = yield browserContext.newPage();
        yield page.goto(signInUri);
        // This wait is necessary on Windows but hangs on Mac.
        if (process.platform === 'win32')
            yield page.waitForNavigation();
        yield page.type('input[type="email"]', username + '\n');
        yield page.waitForNavigation();
        yield page.type('input[type="password"]', password + '\n');
        yield page.waitForNavigation();
        if (yield page.$('input[name="ucaccept"]')) {
            // Accept the "Let this app access your info" prompt.
            yield page.type('input[name="ucaccept"]', '\n');
            yield page.waitForNavigation();
        }
        const userCode = yield page.$eval('input[type="text"]', (input) => input.value);
        if (visible) {
            // Wait for a short time in case the code is grabbed from the user title.
            yield new Promise(c => setTimeout(c, 1000));
        }
        yield browser.close();
        return userCode;
    });
}
exports.signInWithBrowser = signInWithBrowser;

//# sourceMappingURL=browserSignIn.js.map
