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
const config_1 = require("../config");
const Dependencies_1 = require("./Dependencies");
class ExtensionSetup {
    constructor(commandRegistryProvider, agentSessionContextUpdateListener, configUtil) {
        this.commandRegistryProvider = commandRegistryProvider;
        this.agentSessionContextUpdateListener = agentSessionContextUpdateListener;
        this.configUtil = configUtil;
        this.commandFiles = {};
        this.didInit = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // Setup listener to track session context updates
            this.agentSessionContextUpdateListener.subscribe();
            // Add commands based on config settings
            if (this.configUtil.get(config_1.Key.progressShareCommandEnabled)) {
                this.commandFiles['liveshare.start'] = './commands/ShareCommand';
            }
            // Register commands with the client
            Object.keys(this.commandFiles).forEach(command => {
                this.commandRegistryProvider.register(command, this.getCommandBuilder(this.commandFiles[command]));
            });
            this.didInit = true;
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.didInit) {
                return;
            }
            this.commandRegistryProvider.disposeAll();
            this.agentSessionContextUpdateListener.dispose();
        });
    }
    getCommandBuilder(path) {
        return () => {
            const builder = require(path).builder;
            return builder(Dependencies_1.dependencies);
        };
    }
}
exports.ExtensionSetup = ExtensionSetup;

//# sourceMappingURL=ExtensionSetup.js.map
