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
const telemetry_1 = require("../telemetry/telemetry");
const telemetryStrings_1 = require("../telemetry/telemetryStrings");
/**
 * Provider that ensures we register and execute commands safely
 * within VS Code.
 */
class CommandRegistryProvider {
    constructor(commandContextBuilder, telemetry, trace) {
        this.commandContextBuilder = commandContextBuilder;
        this.telemetry = telemetry;
        this.trace = trace;
        this.disposables = {};
    }
    register(commandText, commandBuilder) {
        this.disposables[commandText] = vscode.commands.registerCommand(commandText, (options, context) => __awaiter(this, void 0, void 0, function* () {
            try {
                const command = commandBuilder();
                context = context || this.commandContextBuilder.build(command, commandText);
                return yield command.invoke(options, context);
            }
            catch (error) {
                if (error && !error.hasRecorded) {
                    const errorMessage = `Unhandled exception (command): ${error.message}`;
                    this.trace.error(errorMessage);
                    this.telemetry.sendFault(telemetryStrings_1.TelemetryEventNames.UNHANDLED_COMMAND_ERROR_FAULT, telemetry_1.FaultType.Error, errorMessage, error);
                }
            }
        }));
    }
    dispose(commandString) {
        const disposable = this.disposables[commandString];
        if (disposable) {
            disposable.dispose();
        }
    }
    disposeAll() {
        for (const key in this.disposables) {
            if (key) {
                this.dispose(key);
            }
        }
    }
}
exports.CommandRegistryProvider = CommandRegistryProvider;

//# sourceMappingURL=CommandRegistryProvider.js.map
