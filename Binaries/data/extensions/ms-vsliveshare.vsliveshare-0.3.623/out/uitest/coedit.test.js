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
var CoeditingTests_1;
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let CoeditingTests = CoeditingTests_1 = class CoeditingTests extends uiTestSuite_1.UITestSuite {
    static before() { return uiTestSuite_1.UITestSuite.startSharing(CoeditingTests_1.mochaContext); }
    static after() { return uiTestSuite_1.UITestSuite.endSharing(CoeditingTests_1.mochaContext); }
    summon() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Verify no files opened on either side.
            // TODO: `this.guestWorkbench` implies only one guest, maybe we should do
            // `this.guestWorkbench[index]` instead some day
            yield this.guestWorkbench.quickopen.openFile('index.js');
            yield this.guestWorkbench.quickopen.openQuickOpen(':10');
            yield this.guestWindow.dispatchKeybinding('enter');
            yield this.runLiveShareCommand(this.guestWorkbench, 'liveshare.focusParticipants');
            yield this.waitForNotificationMessage(this.guestWindow, 'Focus request sent.'); // :()
            yield this.waitForNotificationMessage(this.hostWindow, 'requested you to follow');
            yield this.hostWorkbench.editors.waitForTab('index.js');
            // TODO: Check that we're on the correct line.
        });
    }
};
__decorate([
    mocha_typescript_1.test
], CoeditingTests.prototype, "summon", null);
__decorate([
    mocha_typescript_1.context
], CoeditingTests, "mochaContext", void 0);
CoeditingTests = CoeditingTests_1 = __decorate([
    mocha_typescript_1.suite
], CoeditingTests);
exports.CoeditingTests = CoeditingTests;

//# sourceMappingURL=coedit.test.js.map
