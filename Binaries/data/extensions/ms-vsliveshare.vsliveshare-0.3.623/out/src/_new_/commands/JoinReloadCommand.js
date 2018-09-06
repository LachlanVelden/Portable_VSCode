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
const telemetryStrings_1 = require("../../telemetry/telemetryStrings");
const session_1 = require("../../session");
const ErrorNotificationCommandDecorator_1 = require("../decorators/ErrorNotificationCommandDecorator");
const TelemetryCommandDecorator_1 = require("../decorators/TelemetryCommandDecorator");
const TelemetryStatusCommandDecorator_1 = require("../decorators/TelemetryStatusCommandDecorator");
const SessionStateTransitionsCommandDecorator_1 = require("../decorators/SessionStateTransitionsCommandDecorator");
const AuthenticationCommandDecorator_1 = require("../decorators/AuthenticationCommandDecorator");
function builder(dependencies) {
    return new JoinReloadCommand();
}
exports.builder = builder;
/**
 * Join reload `command` that triggers when we know what workspace we
 * are connecting to (typically happens from a bank/empty workspace or
 * a newly opened copy of VS Code).
 */
let JoinReloadCommand = class JoinReloadCommand {
    // NOTE: Note sure what doing with these yet.
    // public progressTitle = 'Join Workspace';
    // public isCancellable = true;
    // public vsCodeCommand: string = undefined;
    constructor() {
    }
    invoke() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Bring across logic from `onExtensionLoadWithLiveShareWorkspace`.
            return null;
        });
    }
};
JoinReloadCommand = __decorate([
    ErrorNotificationCommandDecorator_1.errorNotificationCommandDecorator(telemetryStrings_1.TelemetryEventNames.JOIN_FAULT),
    TelemetryCommandDecorator_1.telemetryCommandDecorator(telemetryStrings_1.TelemetryEventNames.WORKSPACE_RELOAD, telemetryStrings_1.TelemetryEventNames.JOIN_FAULT, 'Join', 1),
    TelemetryStatusCommandDecorator_1.telemetryStatusCommandDecorator(),
    SessionStateTransitionsCommandDecorator_1.sessionStateTransitionsCommandDecorator(undefined, session_1.SessionAction.JoiningSuccess, undefined),
    AuthenticationCommandDecorator_1.authenticationCommandDecorator()
], JoinReloadCommand);
exports.JoinReloadCommand = JoinReloadCommand;

//# sourceMappingURL=JoinReloadCommand.js.map
