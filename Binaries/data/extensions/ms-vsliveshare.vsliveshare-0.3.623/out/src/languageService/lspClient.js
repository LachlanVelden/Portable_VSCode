"use strict";
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
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
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
const vscodeLSP = require("vscode-languageclient");
const p2c = require("vscode-languageclient/lib/protocolConverter");
const config = require("../config");
const util_1 = require("../util");
const languageServiceTelemetry_1 = require("../telemetry/languageServiceTelemetry");
const telemetry_1 = require("../telemetry/telemetry");
const vsls = require("../contracts/VSLS");
const service_1 = require("../workspace/service");
const commandHandler = require("./commandHandler");
const externalDocumentProvider_1 = require("./externalDocumentProvider");
const lspClientStreamProvider_1 = require("./lspClientStreamProvider");
const lspServer_1 = require("./lspServer");
const pathManager_1 = require("./pathManager");
const anyLspName = 'any';
exports.prefixServiceName = 'languageServerProvider-';
/**
 * This is a LSP client to provide services for all languages.
 */
function activateAsync(context, rpcClient, workspaceServices) {
    return __awaiter(this, void 0, void 0, function* () {
        const lspServices = workspaceServices
            .filter(s => s.startsWith(exports.prefixServiceName))
            .map(s => s.substring(exports.prefixServiceName.length));
        for (const lspName of lspServices) {
            yield activateLspClient(context, rpcClient, lspName);
        }
        // register a document provider for the external scheme
        let externalDocumentProvider = new externalDocumentProvider_1.ExternalDocumentProvider(rpcClient);
        let docProviderDisposable = vscode.workspace.registerTextDocumentContentProvider(pathManager_1.PathManager.vslsExternalScheme, externalDocumentProvider);
        context.subscriptions.push(docProviderDisposable);
    });
}
exports.activateAsync = activateAsync;
function activateLspClient(context, rpcClient, lspName) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceInfo = {
            name: exports.prefixServiceName + lspName,
            methods: vsls.LanguageServerProvider.methods,
            events: vsls.LanguageServerProvider.events,
        };
        let languageServerProviderClient = service_1.RpcProxy.create(serviceInfo, rpcClient, vsls.TraceSources.ClientLSP);
        let lspClientStreamProvider = new lspClientStreamProvider_1.LSPClientStreamProvider(languageServerProviderClient);
        const metadata = yield languageServerProviderClient.getMetadataAsync();
        const vslsScheme = config.get(config.Key.scheme);
        let documentFilters = [];
        if (metadata.documentFilters) {
            documentFilters = metadata.documentFilters.map(d => ({ scheme: vslsScheme, language: d.language ? d.language : undefined, pattern: d.pattern ? d.pattern : undefined, exclusive: true }));
        }
        else {
            documentFilters.push({ scheme: vslsScheme, exclusive: true });
        }
        // define a vls schema to identify external files outside the workspace folder 
        documentFilters.push({ scheme: pathManager_1.PathManager.vslsExternalScheme, exclusive: true });
        let clientOptions = {
            documentSelector: documentFilters,
            revealOutputChannelOn: vscodeLSP.RevealOutputChannelOn.Never,
            initializationFailedHandler: (error) => {
                lspClient.error('Server initialization failed.', error);
                telemetry_1.Instance.sendFault(languageServiceTelemetry_1.LanguageServiceTelemetryEventNames.LSPSERVER_INIT_FAULT, telemetry_1.FaultType.Unknown, `Server ${lspName} initialization failed - ${error}`);
                return false;
            },
            middleware: {},
        };
        let lspClient = new vscodeLSP.LanguageClient('LiveShareGuest-' + lspName, 'Guest-' + lspName, () => {
            return Promise.resolve({
                reader: new vscode_jsonrpc_1.StreamMessageReader(lspClientStreamProvider.ReadStream),
                writer: new vscode_jsonrpc_1.StreamMessageWriter(lspClientStreamProvider.WriteStream)
            });
        }, clientOptions);
        let remoteCmndName = lspServer_1.REMOTE_COMMAND_NAME;
        let p2cConverter = p2c.createConverter();
        if (lspName === anyLspName) {
            context.subscriptions.push(lspClient.start());
            vscode.workspace.onDidOpenTextDocument((textDocument) => __awaiter(this, void 0, void 0, function* () {
                yield populateDiagnostics(lspClient, textDocument, p2cConverter);
            }), undefined, context.subscriptions);
        }
        else {
            remoteCmndName = remoteCmndName.concat('.', lspName);
            let started = false;
            vscode.workspace.onDidOpenTextDocument((textDocument) => __awaiter(this, void 0, void 0, function* () {
                if (textDocument.languageId === lspName || documentFilters.some(d => d.language === textDocument.languageId)) {
                    if (!started) {
                        started = true;
                        context.subscriptions.push(lspClient.start());
                    }
                    yield populateDiagnostics(lspClient, textDocument, p2cConverter);
                }
                return true;
            }), undefined, context.subscriptions);
        }
        let remoteCommand = util_1.ExtensionUtil.registerCommand(remoteCmndName, (args) => __awaiter(this, void 0, void 0, function* () {
            yield commandHandler.handleLiveShareRemoteCommand(args, lspClient, p2cConverter);
        }));
        context.subscriptions.push(remoteCommand);
    });
}
function populateDiagnostics(lspClient, textDocument, p2cConverter) {
    return __awaiter(this, void 0, void 0, function* () {
        // Many "documents" (e.g. the output view, or the .code-workspace file), request diagnostics from the guest. Only service request for documents
        // that the host will know how to fetch diagnostics for.
        if (textDocument.uri.scheme !== config.get(config.Key.scheme)) {
            return;
        }
        yield lspClient.onReady();
        let diagnostics = yield lspClient.sendRequest('liveshare/diagnosticsDocument', { textDocument: { uri: textDocument.uri.toString() } });
        if (diagnostics && lspClient.diagnostics) {
            lspClient.diagnostics.set(textDocument.uri, p2cConverter.asDiagnostics(diagnostics));
        }
    });
}

//# sourceMappingURL=lspClient.js.map
