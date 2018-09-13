//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const config = require("../config");
const util = require("../util");
const traceSource_1 = require("../tracing/traceSource");
const telemetry_1 = require("../telemetry/telemetry");
const telemetryStrings_1 = require("../telemetry/telemetryStrings");
const terminalWorkerProvider_1 = require("./terminalWorkerProvider");
const terminalManagerBase_1 = require("./terminalManagerBase");
const session_1 = require("../session");
class HostTerminalManager extends terminalManagerBase_1.TerminalManagerBase {
    constructor(terminalService) {
        super(terminalService);
        this.terminalProvider = new terminalWorkerProvider_1.TerminalWorkerProvider(this.terminalService);
        this.trace = traceSource_1.traceSource.withName('HostTerminalManager');
        this.subscriptions.push(util.ExtensionUtil.registerCommand('liveshare.shareTerminal', this.shareTerminal, this), util.ExtensionUtil.registerCommand('liveshare.shareTerminalFromFileTreeExplorer', this.shareTerminal, this), util.ExtensionUtil.registerCommand('liveshare.shareTerminalFromActivityBar', this.shareTerminal, this), util.ExtensionUtil.registerCommand('liveshare.openTerminalFromFileTreeExplorer', this.openTerminalCommandHandler, this), util.ExtensionUtil.registerCommand('liveshare.openTerminalFromActivityBar', this.openTerminalCommandHandler, this), util.ExtensionUtil.registerCommand('liveshare.removeTerminalFromFileTreeExplorer', this.closeTerminal, this), util.ExtensionUtil.registerCommand('liveshare.removeTerminalFromActivityBar', this.closeTerminal, this));
        if (config.featureFlags.autoShareTerminal && vscode.window.onDidOpenTerminal) {
            this.subscriptions.push(vscode.window.onDidOpenTerminal(async (terminal) => {
                if (!terminal.name.startsWith('Task') && !terminal.name.endsWith('[Shared]')) {
                    await this.terminalProvider.shareTerminal(terminal, this.trace);
                }
            }));
            this.deferredInit = this.deferredInit
                .then(() => this.initializeContext())
                .catch(reason => {
                this.trace.error(reason.message);
            });
        }
    }
    async initializeContext() {
        for (const terminal of vscode.window.terminals.filter(x => !x.name.startsWith('Task') && !x.name.endsWith('[Shared]'))) {
            await this.terminalProvider.shareTerminal(terminal, this.trace);
        }
    }
    async closeTerminal(terminalPayload) {
        const sharedTerminal = this.terminalProvider.getSharedTerminal(terminalPayload.id);
        if (sharedTerminal) {
            sharedTerminal.dispose();
            return;
        }
        const terminals = await this.terminalService.getRunningTerminalsAsync();
        for (let terminal of terminals) {
            if (await terminal.id === terminalPayload.id) {
                await this.terminalService.stopTerminalAsync(terminal.id);
                break;
            }
        }
    }
    /**
     * Implements "Share Terminal" UI command. Creates a new terminal window and starts sharing it.
     *
     * @param origin Indicates a method the command is invoked.
     */
    async shareTerminal(origin) {
        try {
            HostTerminalManager.throwIfSharedTerminalsNotEnabled();
            // In read-only session the shared terminal is always read-only.
            // In regular session, query the host if they want it read-write or read-only.
            let guestsCanWriteChoice = 'Read-only';
            if (!session_1.SessionContext.IsReadOnly) {
                guestsCanWriteChoice = await vscode.window.showQuickPick(['Read-only', 'Read/write'], { placeHolder: 'Select the access level guests should have for this terminal' });
                if (guestsCanWriteChoice === undefined) {
                    return;
                }
            }
            const cfg = vscode.workspace.getConfiguration();
            const configShellProperty = `terminal.integrated.shell.${util.getPlatformProperty()}`;
            const configShell = cfg.get(configShellProperty);
            if (!configShell) {
                throw new Error(`Terminal shell configuration property "${configShellProperty}" is empty`);
            }
            const shellBasename = path.basename(configShell).toLowerCase();
            // Use 'ps' to shorten the terminal name for powershell. The terminal name lengh is limited by the terminal drop down width in VSCode.
            const name = `${shellBasename === 'powershell.exe' ? 'ps' : path.basename(shellBasename, path.extname(shellBasename))} [Shared]`;
            // If terminal renderer is supported, spin it to get the dimensions
            let renderer = null;
            let dimensions;
            if (vscode.window.createTerminalRenderer) {
                renderer = vscode.window.createTerminalRenderer(name);
                const dimensionsPromise = new Promise((resolve) => {
                    const eventRegistration = renderer.onDidChangeMaximumDimensions(e => {
                        eventRegistration.dispose();
                        resolve(e);
                    });
                });
                const terminal = await renderer.terminal;
                await terminal.show();
                dimensions = await dimensionsPromise;
            }
            else {
                dimensions = {
                    columns: config.get(config.Key.sharedTerminalWidth),
                    rows: config.get(config.Key.sharedTerminalWidth)
                };
            }
            const configArgs = cfg.get(`terminal.integrated.shellArgs.${util.getPlatformProperty()}`) || [];
            const configEnv = cfg.get(`terminal.integrated.env.${util.getPlatformProperty()}`);
            const readOnlyForGuests = guestsCanWriteChoice === 'Read-only';
            let options = {
                name,
                rows: dimensions.rows,
                cols: dimensions.columns,
                cwd: cfg.get('terminal.integrated.cwd') || util.PathUtil.getPrimaryWorkspaceFileSystemPath(),
                app: configShell,
                commandLine: configArgs,
                environment: configEnv,
                readOnlyForGuests,
            };
            const terminalInfo = await this.terminalService.startTerminalAsync(options);
            await this.terminalProvider.createTerminal(terminalInfo, renderer, this.trace);
            telemetry_1.Instance.sendTelemetryEvent(telemetryStrings_1.TelemetryEventNames.START_SHARED_TERMINAL, {
                [telemetryStrings_1.TelemetryPropertyNames.SHARED_TERMINAL_SHELL]: path.parse(configShell).name,
                [telemetryStrings_1.TelemetryPropertyNames.SHARED_TERMINAL_READONLY]: readOnlyForGuests.toString(),
            });
        }
        catch (e) {
            telemetry_1.Instance.sendFault(telemetryStrings_1.TelemetryEventNames.START_SHARED_TERMINAL_FAULT, telemetry_1.FaultType.Error, null, e);
            throw e;
        }
    }
    static throwIfSharedTerminalsNotEnabled() {
        if (!config.featureFlags.sharedTerminals) {
            throw new Error('Shared terminal feature is not enabled');
        }
    }
}
exports.HostTerminalManager = HostTerminalManager;

//# sourceMappingURL=hostTerminalManager.js.map
