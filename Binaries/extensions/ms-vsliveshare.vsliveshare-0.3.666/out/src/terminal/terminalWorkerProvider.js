//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const net = require("net");
const uuid = require("uuid");
const config = require("../config");
const util = require("../util");
const vsls = require("../contracts/VSLS");
const path = require("path");
const agent_1 = require("../agent");
const session_1 = require("../session");
const sessionTypes_1 = require("../sessionTypes");
const service_1 = require("../workspace/service");
const traceSource_1 = require("../tracing/traceSource");
const telemetry_1 = require("../telemetry/telemetry");
const telemetryStrings_1 = require("../telemetry/telemetryStrings");
/**
 * Provider class responsible for creating shared terminal workers.
 */
class TerminalWorkerProvider {
    constructor(terminalService) {
        this.terminalService = terminalService;
        this.integratedTerminals = new Map();
        this.workers = new Map();
    }
    dispose() {
        this.integratedTerminals.forEach(terminal => terminal.dispose());
        this.integratedTerminals.clear();
        this.workers.forEach(worker => worker.dispose());
        this.workers.clear();
    }
    async createTerminal(info, renderer, trace) {
        trace = trace || traceSource_1.traceSource;
        if (this.integratedTerminals.has(info.id)) {
            this.integratedTerminals.get(info.id).show();
            return;
        }
        const name = info.options.name;
        if (!renderer && vscode.window.createTerminalRenderer) {
            renderer = vscode.window.createTerminalRenderer(name);
        }
        let terminal;
        const eventRegistrations = [];
        if (renderer) {
            let resizeTimer = null;
            renderer.onDidChangeMaximumDimensions(d => {
                if (resizeTimer) {
                    clearTimeout(resizeTimer);
                }
                // When the window is resized, it fires lots of resize events.
                // The timeout is a way to react only to the last event and reduce the churn.
                // 100ms is totally arbitrary. It seems good enough to produce just one event
                // after the resizing is done, soon enough for user to perceive it immediate.
                resizeTimer = setTimeout(async () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = null;
                    try {
                        await this.terminalService.resizeTerminalAsync(info.id, d.columns, d.rows);
                    }
                    catch (e) {
                        trace.error(`Error resizing terminal ${e}`);
                    }
                }, 100);
            }, this, eventRegistrations);
            this.terminalService.onTerminalResized(e => {
                if (e.terminal.id === info.id) {
                    renderer.dimensions = { columns: e.terminal.options.cols, rows: e.terminal.options.rows };
                }
            }, this, eventRegistrations);
            const terminalEndpointRpcClient = new service_1.RPCClient(Promise.resolve({
                protocol: 'net.pipe:',
                hostname: 'localhost',
                pathname: `/${info.localPipeName}`,
            }));
            terminalEndpointRpcClient.connectionOwner = 'shared-terminal';
            const terminalEndpoint = service_1.RpcProxy.create(vsls.TerminalEndpoint, terminalEndpointRpcClient, vsls.TraceSources.ClientRpcTerminalEndpoint);
            terminal = await renderer.terminal;
            this.pipeTerminalStdio(terminalEndpoint, renderer, trace);
        }
        else {
            const terminalOptions = {
                name,
                shellPath: agent_1.Agent.getAgentPath(),
                shellArgs: ['run-terminal', info.localPipeName, '--integrated'],
            };
            terminalOptions.cwd = path.dirname(agent_1.Agent.getAgentPath());
            terminal = vscode.window.createTerminal(terminalOptions);
        }
        terminal.show();
        this.integratedTerminals.set(info.id, terminal);
        vscode.window.onDidCloseTerminal(async (t) => {
            if (t === terminal) {
                unsubscribeEvents();
                if (session_1.SessionContext.State === sessionTypes_1.SessionState.Shared) {
                    await this.terminalService.stopTerminalAsync(info.id);
                }
                else if (renderer) {
                    try {
                        await this.terminalService.resizeTerminalAsync(info.id, 0, 0);
                    }
                    catch (_a) {
                        // Backward compat: old host may not understand resizing to 0 dimensions.
                    }
                }
            }
        }, null, eventRegistrations);
        const onTerminalStopped = (e) => {
            if (e.terminal.id === info.id) {
                unsubscribeEvents();
                terminal.dispose();
            }
        };
        const unsubscribeEvents = () => {
            this.integratedTerminals.delete(info.id);
            eventRegistrations.forEach((r) => r.dispose());
        };
        this.terminalService.onTerminalStopped(onTerminalStopped, null, eventRegistrations);
    }
    async pipeTerminalStdio(endpoint, renderer, trace) {
        let disposables = [];
        const cts = new vscode.CancellationTokenSource();
        try {
            let writeTask = Promise.resolve();
            renderer.onDidAcceptInput(s => writeTask = writeTask.then(() => writeToEndpoint(s)), this, disposables);
            const terminal = await renderer.terminal;
            vscode.window.onDidCloseTerminal(t => { if (t === terminal) {
                cts.cancel();
            } }, this, disposables);
            function writeToEndpoint(s) {
                if (!cts.token.isCancellationRequested) {
                    return endpoint.writeStringAsync(s, cts.token);
                }
            }
            while (!cts.token.isCancellationRequested) {
                const text = await endpoint.readStringAsync(cts.token);
                if (text === null) {
                    break;
                }
                renderer.write(text);
            }
            cts.cancel();
            await writeTask;
        }
        catch (e) {
            if (!cts.token.isCancellationRequested && !endpoint.client.isDisposed) {
                trace.error(`Error running shared terminal renderer ${e}`);
                renderer.write(`\r\n\x1b[31mError running shared terminal ${e}\x1b[0m`);
                telemetry_1.Instance.sendFault(telemetryStrings_1.TelemetryEventNames.RUN_SHARED_TERMINAL_FAULT, telemetry_1.FaultType.Error, null, e);
            }
        }
        finally {
            disposables.forEach(value => value.dispose());
        }
    }
    /**
     * Starts a new terminal share worker for an existing terminal window that synchronizes the terminal i/o streams
     * with collaboration session participants.
     *
     * @param terminal Existing terminal window.
     * @param trace Optional trace instance.
     */
    async shareTerminal(terminal, trace) {
        trace = trace || traceSource_1.traceSource;
        const dataPipeName = uuid().replace(/-/g, '');
        const dimensions = {
            columns: config.get(config.Key.sharedTerminalWidth),
            rows: config.get(config.Key.sharedTerminalWidth)
        };
        const options = {
            name: terminal.name + ' [Shared]',
            dataPipeName: dataPipeName,
            rows: dimensions.rows,
            cols: dimensions.columns,
            readOnlyForGuests: true,
        };
        let terminalInfo = null;
        let dataServer = null;
        let registrations = [];
        let writeDataQueue = Promise.resolve();
        try {
            dataServer = net.createServer((socket) => {
                terminal.onDidWriteData(s => writeDataQueue = writeDataQueue.then(async () => {
                    await socket.write(s);
                }), null, registrations);
                socket.on('data', (data) => {
                    terminal.sendText(data.toString(), /*addNewLine*/ false);
                });
                socket.on('error', (err) => {
                    trace.error(err.message);
                });
            }).listen(util.getPipePath(dataPipeName));
            terminalInfo = await this.terminalService.startTerminalAsync(options);
        }
        catch (e) {
            trace.error(`Error running a shared terminal worker. ${e}`);
            telemetry_1.Instance.sendFault(telemetryStrings_1.TelemetryEventNames.RUN_SHARED_TERMINAL_FAULT, telemetry_1.FaultType.Error, null, e);
            if (dataServer) {
                dataServer.close();
            }
            return;
        }
        const disposeTerminalWorker = async () => {
            this.workers.delete(terminalInfo.id);
            registrations.forEach(d => d.dispose());
            try {
                if (!this.terminalService.client.isDisposed) {
                    await this.terminalService.stopTerminalAsync(terminalInfo.id);
                }
            }
            catch (_a) { }
            try {
                dataServer.close();
            }
            catch (_b) { }
        };
        vscode.window.onDidCloseTerminal(async (t) => {
            if (t === terminal) {
                await disposeTerminalWorker();
            }
        }, null, registrations);
        this.workers.set(terminalInfo.id, {
            terminal: terminal,
            dispose: disposeTerminalWorker
        });
        this.integratedTerminals.set(terminalInfo.id, terminal);
        telemetry_1.Instance.sendTelemetryEvent(telemetryStrings_1.TelemetryEventNames.START_SHARED_TERMINAL, {
            [telemetryStrings_1.TelemetryPropertyNames.SHARED_TERMINAL_READONLY]: false.toString(),
        });
    }
    getSharedTerminal(id) {
        return this.workers.get(id);
    }
}
exports.TerminalWorkerProvider = TerminalWorkerProvider;

//# sourceMappingURL=terminalWorkerProvider.js.map
