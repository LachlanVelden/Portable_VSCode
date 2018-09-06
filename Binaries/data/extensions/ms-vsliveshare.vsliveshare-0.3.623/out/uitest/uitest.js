"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
const cp = require("child_process");
const path = require("path");
const minimist = require("minimist");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const ncp_1 = require("ncp");
require("source-map-support/register");
const application_1 = require("@vsliveshare/vscode-automation/application");
const logger_1 = require("@vsliveshare/vscode-automation/logger");
const testDataPath = path.resolve(__dirname, '../../uitest/testdata');
mkdirp.sync(testDataPath);
const [, , ...args] = process.argv;
const opts = minimist(args, {
    string: [
        'code-dir',
        'code-insiders-dir',
        'wait-time',
        'test-repo',
        'screenshots',
        'log'
    ],
    boolean: [
        'verbose'
    ],
    default: {
        verbose: false
    }
});
const testAccount = {
    provider: 'microsoft',
    email: 'vsls-test@outlook.com',
    password: 'ShareAllTheThings!',
};
// Override some internal settings.
const testSettingsFilePath = path.join(testDataPath, 'vsls-settings.json');
const settings = {
    isInternal: true,
    canCollectPII: true,
    teamStatus: 'Test',
    serviceUri: 'https://ppe.liveshare.vsengsaas.visualstudio.com/',
    userSettingsPath: '.vs-liveshare-test-settings.json',
    suppressFirewallPrompts: true,
    showInStatusBar: 'always',
};
fs.writeFileSync(testSettingsFilePath, JSON.stringify(settings));
process.env.VSLS_SETTINGS_FILE = testSettingsFilePath;
const vscodeLogsDirectory = path.join(testDataPath, 'vscodelogs');
mkdirp.sync(vscodeLogsDirectory);
process.env.VSCODE_LOGS = vscodeLogsDirectory;
const workspaceFilePath = path.join(testDataPath, 'uitest.code-workspace');
const testRepoUrl = 'https://github.com/Microsoft/vscode-smoketest-express';
const workspacePath = path.join(testDataPath, 'vscode-smoketest-express');
const extensionsPath = path.join(path.resolve(__dirname, '../../..'));
const screenshotsPath = opts.screenshots ? path.resolve(opts.screenshots) : null;
if (screenshotsPath) {
    mkdirp.sync(screenshotsPath);
}
function fail(errorMessage) {
    console.error(errorMessage);
    process.exit(1);
}
if (parseInt(process.version.substr(1)) < 6) {
    fail('Update to Node >= 6 to run the UI test.');
}
function getVsCodeDir(insiders) {
    const suffix = (insiders ? ' Insiders' : '');
    switch (process.platform) {
        case 'darwin':
            return '/Applications/Visual Studio Code' + suffix + '.app';
        case 'linux':
            throw new Error('getVsCodeDir() not yet implemented for Linux.');
        case 'win32':
            const codeDirName = 'Microsoft VS Code' + suffix;
            const machineInstallDir = path.join(process.env.ProgramFiles, codeDirName);
            const userInstallDir = path.join(process.env.LocalAppData, 'Programs', codeDirName);
            return fs.existsSync(userInstallDir) ? userInstallDir : machineInstallDir;
        default:
            throw new Error('Unsupported platform.');
    }
}
let vsCodeDir = opts['code-dir'] || getVsCodeDir(false);
let vsCodeInsidersDir = opts['code-insiders-dir'] || getVsCodeDir(true);
let quality;
if ((vsCodeDir.indexOf('Code - Insiders') /* macOS/Windows */ ||
    vsCodeDir.indexOf('code-insiders')) /* Linux */ >= 0) {
    vsCodeInsidersDir = vsCodeDir;
    quality = application_1.Quality.Insiders;
}
else {
    quality = application_1.Quality.Stable;
}
const userDataDir = path.join(testDataPath, 'userdata');
rimraf.sync(userDataDir);
function toUri(path) {
    if (process.platform === 'win32') {
        return `${path.replace(/\\/g, '/')}`;
    }
    return `${path}`;
}
function createWorkspaceFile() {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(workspaceFilePath)) {
            return;
        }
        console.log('*** Creating workspace file...');
        const workspace = {
            folders: [
                {
                    path: toUri(path.join(workspacePath, 'public'))
                },
                {
                    path: toUri(path.join(workspacePath, 'routes'))
                },
                {
                    path: toUri(path.join(workspacePath, 'views'))
                }
            ]
        };
        fs.writeFileSync(workspaceFilePath, JSON.stringify(workspace, null, '\t'));
    });
}
function setupRepository() {
    return __awaiter(this, void 0, void 0, function* () {
        if (opts['test-repo']) {
            console.log('*** Copying test workspace repository:', opts['test-repo']);
            rimraf.sync(workspacePath);
            // not platform friendly
            cp.execSync(`cp -R "${opts['test-repo']}" "${workspacePath}"`);
        }
        else {
            if (!fs.existsSync(workspacePath)) {
                console.log('*** Cloning test workspace repository...');
                cp.spawnSync('git', ['clone', testRepoUrl, workspacePath]);
                console.log('*** Running npm install...');
                cp.execSync('npm install', { cwd: workspacePath, stdio: 'inherit' });
            }
            else {
                console.log('*** Cleaning test workspace repository...');
                cp.spawnSync('git', ['fetch'], { cwd: workspacePath });
                cp.spawnSync('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: workspacePath });
                cp.spawnSync('git', ['clean', '-xdf', '-e', 'node_modules'], { cwd: workspacePath });
            }
        }
    });
}
function setupTestWorkspace() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('*** Test workspace path:', testDataPath);
        console.log('*** Preparing test workspace...');
        yield createWorkspaceFile();
        yield setupRepository();
        console.log('*** Test workspace ready\n');
    });
}
function createApp(quality, logger) {
    if (quality === application_1.Quality.Dev)
        throw new Error('VS Code dev quality not implemented.');
    const codeDir = quality === application_1.Quality.Insiders ? vsCodeInsidersDir : vsCodeDir;
    if (!codeDir || !fs.existsSync(codeDir)) {
        fail(`Can't find VS Code directory at ${codeDir}.`);
    }
    return new application_1.Application({
        quality,
        codePath: codeDir,
        workspacePath,
        userDataDir,
        extensionsPath,
        workspaceFilePath,
        waitTime: parseInt(opts['wait-time'] || '0') || 20,
        logger: logger,
        verbose: opts.verbose,
        log: (opts.log ? 'trace' : undefined),
    });
}
function createLogger() {
    const loggers = [];
    if (opts.verbose) {
        loggers.push(new logger_1.ConsoleLogger());
    }
    if (opts.log) {
        loggers.push(new logger_1.FileLogger(opts.log));
    }
    return new logger_1.MultiLogger(loggers);
}
before(function () {
    return __awaiter(this, void 0, void 0, function* () {
        // allow two minutes for setup
        this.timeout(2 * 60 * 1000);
        yield setupTestWorkspace();
        // Pass the app to the tests via context.
        const logger = createLogger();
        logger.log('Launching VS Code...');
        this.app = createApp(quality, logger);
        this.serviceUri = settings.serviceUri;
        this.testAccount = testAccount;
    });
});
after(function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.app) {
            yield this.app.stop();
        }
        yield new Promise(c => setTimeout(c, 500)); // wait for shutdown
        if (opts.log) {
            const logsDir = path.join(userDataDir, 'logs');
            const destLogsDir = path.join(path.dirname(opts.log), 'logs');
            yield new Promise((c, e) => ncp_1.ncp(logsDir, destLogsDir, err => err ? e(err) : c()));
        }
    });
});
if (screenshotsPath) {
    function captureScreenshot(app, testTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield app.capturePage();
            const buffer = new Buffer(raw, 'base64');
            const name = testTitle.replace(/[^a-z0-9\-]/ig, '_');
            const screenshotPath = path.join(screenshotsPath, `${name}.png`);
            if (opts.log) {
                app.logger.log('*** Screenshot recorded:', screenshotPath);
            }
            fs.writeFileSync(screenshotPath, buffer);
        });
    }
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentTest.state !== 'failed') {
                return;
            }
            yield captureScreenshot(this.app, this.currentTest.fullTitle());
        });
    });
}
if (opts.log) {
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            const title = this.currentTest.fullTitle();
            this.logger.log('*** Test start:', title);
        });
    });
}
// Require each of the test suite modules.
// Launch and sign-in tests set up state used by all others so they come first.
require('./launch.test');
require('./signin.test');
// Remaining tests may be run independently (but not in parallel).
// TODO: Enable running individual test suites via command-line.
require('./join.test');
require('./coedit.test');
require('./debug.test');

//# sourceMappingURL=uitest.js.map
