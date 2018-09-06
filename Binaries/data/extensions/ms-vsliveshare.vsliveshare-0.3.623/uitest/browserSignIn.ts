import * as fs from 'fs';
import * as os from 'os';
import { LaunchOptions, Browser } from 'puppeteer';
const puppeteer = require('puppeteer-core');

function getChromeExePath(): string {
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
        throw new Error(`Chrome not found at ${chromeExePath}`)
    }

    return chromeExePath;
}

export async function signInWithBrowser(
    serviceBaseUri: string,
    accountType: 'microsoft' | 'github',
    username: string,
    password: string,
    visible: boolean,
): Promise<string | null> {
    if (!serviceBaseUri) {
        throw new Error('Service base URI is required.');
    } else if (!serviceBaseUri.endsWith('/')) {
        serviceBaseUri += '/';
    }

    const signInUri = serviceBaseUri + 'auth/identity/' + accountType;

    const options: LaunchOptions = {
        executablePath: getChromeExePath(),
        headless: !visible,
        slowMo: 10,
    };
    const browser: Browser = await puppeteer.launch(options);
    const browserContext = await browser.createIncognitoBrowserContext();
    const page = await browserContext.newPage();

    await page.goto(signInUri);

    // This wait is necessary on Windows but hangs on Mac.
    if (process.platform === 'win32') await page.waitForNavigation();

    await page.type('input[type="email"]', username + '\n');
    await page.waitForNavigation();

    await page.type('input[type="password"]', password + '\n');
    await page.waitForNavigation();

    if (await page.$('input[name="ucaccept"]')) {
        // Accept the "Let this app access your info" prompt.
        await page.type('input[name="ucaccept"]', '\n');
        await page.waitForNavigation();
    }

    const userCode: string | null = await page.$eval(
        'input[type="text"]',
        (input: HTMLInputElement) => input.value);

    if (visible) {
        // Wait for a short time in case the code is grabbed from the user title.
        await new Promise(c => setTimeout(c, 1000));
    }

    await browser.close();
    return userCode;
}
