"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("../config");
const Dependencies_1 = require("./Dependencies");
class ExtensionSetup {
    constructor(commandRegistryProvider, agentSessionContextUpdateListener, configUtil) {
        this.commandRegistryProvider = commandRegistryProvider;
        this.agentSessionContextUpdateListener = agentSessionContextUpdateListener;
        this.configUtil = configUtil;
        this.commandFiles = {};
        this.didInit = false;
    }
    async init() {
        // Setup listener to track session context updates
        this.agentSessionContextUpdateListener.subscribe();
        // Add commands based on config settings
        if (config.get(config.Key.isInternal)) {
            this.commandFiles['liveshare.start'] = './commands/ShareCommand';
        }
        // Register commands with the client
        Object.keys(this.commandFiles).forEach(command => {
            this.commandRegistryProvider.register(command, this.getCommandBuilder(this.commandFiles[command]));
        });
        this.didInit = true;
    }
    async dispose() {
        if (!this.didInit) {
            return;
        }
        this.commandRegistryProvider.disposeAll();
        this.agentSessionContextUpdateListener.dispose();
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
