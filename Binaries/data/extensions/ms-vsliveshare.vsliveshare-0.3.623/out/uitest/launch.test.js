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
const path = require("path");
const rimraf = require("rimraf");
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let LaunchTests = class LaunchTests extends uiTestSuite_1.UITestSuite {
    launch() {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete install.Lock to trigger the dependency check.
            const extensionDir = path.resolve(__dirname, '../..');
            rimraf.sync(path.join(extensionDir, 'install.Lock'));
            // Uncomment this line to cause .NET Core to be downloaded.
            //rimraf.sync(path.join(extensionDir, 'dotnet_modules', 'mscorlib.dll'));
            yield this.app.start();
            this.hostWindow = this.app.code;
            this.hostWorkbench = this.app.workbench;
        });
    }
    dependenciesInstalledNotification() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitForNotificationMessage(this.hostWindow, 'VS Live Share installed!');
        });
    }
    shareButtonOnStatusBar() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitForStatusBarTitle(this.hostWindow, /(Start Collaboration)|(Share the workspace)/);
        });
    }
    shareTabOnActivityBar() {
        return __awaiter(this, void 0, void 0, function* () {
            const title = this.extensionInfo.contributes.viewsContainers.activitybar[0].title;
            yield this.hostWindow.waitForElement(`.monaco-action-bar .action-item[title="${title}"]`);
        });
    }
};
__decorate([
    mocha_typescript_1.test
], LaunchTests.prototype, "launch", null);
__decorate([
    mocha_typescript_1.test(mocha_typescript_1.slow(30000), mocha_typescript_1.timeout(120000))
], LaunchTests.prototype, "dependenciesInstalledNotification", null);
__decorate([
    mocha_typescript_1.test
], LaunchTests.prototype, "shareButtonOnStatusBar", null);
__decorate([
    mocha_typescript_1.test
], LaunchTests.prototype, "shareTabOnActivityBar", null);
LaunchTests = __decorate([
    mocha_typescript_1.suite
], LaunchTests);
exports.LaunchTests = LaunchTests;

//# sourceMappingURL=launch.test.js.map
