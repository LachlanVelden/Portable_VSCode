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
const mocha_typescript_1 = require("mocha-typescript");
const uiTestSuite_1 = require("./uiTestSuite");
let JoinTests = class JoinTests extends uiTestSuite_1.UITestSuite {
    before() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.openGuestWindow();
        });
    }
    join() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            // The guest window should automatically sign-in with the account cached by the host window.
            yield this.waitForStatusBarTitle(this.guestWindow, this.testAccount.email);
            yield _super("share").call(this);
            yield _super("join").call(this);
            // TODO: Verify notification on host about user joined.
        });
    }
    unjoin() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("unjoin").call(this);
            // The window should remain signed in.
            yield this.waitForStatusBarTitle(this.guestWindow, this.testAccount.email);
            // TODO: Verify notification on host about user left.
            yield _super("unshare").call(this);
        });
    }
    joinAndEndSession() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Join then end session from host.
            // TODO: Verify message on guest about session ended.
        });
    }
    joinAndDisconnectGuest() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Join then close guest window.
            // TODO: Verify message on host about guest disconnected.
        });
    }
    joinAndDisconnectHost() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Join then close host window.
            // TODO: Verify message on guest about host disconnected.
        });
    }
};
__decorate([
    mocha_typescript_1.test(mocha_typescript_1.slow(30000), mocha_typescript_1.timeout(90000))
], JoinTests.prototype, "join", null);
__decorate([
    mocha_typescript_1.test
], JoinTests.prototype, "unjoin", null);
__decorate([
    mocha_typescript_1.test.skip
], JoinTests.prototype, "joinAndEndSession", null);
__decorate([
    mocha_typescript_1.test.skip
], JoinTests.prototype, "joinAndDisconnectGuest", null);
__decorate([
    mocha_typescript_1.test.skip
], JoinTests.prototype, "joinAndDisconnectHost", null);
JoinTests = __decorate([
    mocha_typescript_1.suite
], JoinTests);
exports.JoinTests = JoinTests;

//# sourceMappingURL=join.test.js.map
