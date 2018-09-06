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
const service_1 = require("../workspace/service");
const vsls = require("../contracts/VSLS");
const lspClient_1 = require("./lspClient");
/**
 * Provides document contents for documents outside the shared folder cone.
 */
class ExternalDocumentProvider {
    constructor(rpcClient) {
        this.rpcClient = rpcClient;
        this.documents = new Map();
        this.documentClosedSubscription = vscode.workspace.onDidCloseTextDocument(this.onTextDocumentClosed, this);
    }
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let uriString = uri.toString();
            if (this.documents.has(uriString)) {
                return this.documents.get(uriString);
            }
            const lspName = uri.fragment ? uri.fragment : 'any';
            const serviceInfo = {
                name: lspClient_1.prefixServiceName + lspName,
                methods: vsls.LanguageServerProvider.methods,
                events: vsls.LanguageServerProvider.events,
            };
            const languageServerProviderClient = service_1.RpcProxy.create(serviceInfo, this.rpcClient, vsls.TraceSources.ClientLSP);
            // Use our custom liveshare/externalDocument' method
            const externalTextDocumentParams = { textDocument: { uri: uri.toString() } };
            const rpcRequest = { id: 1, method: 'liveshare/externalDocument', params: externalTextDocumentParams };
            let contents = (yield languageServerProviderClient.requestAsync(rpcRequest, null));
            if (!contents) {
                contents = '<Not supported>';
            }
            this.documents.set(uriString, contents);
            return contents;
        });
    }
    dispose() {
        this.documentClosedSubscription.dispose();
        this.documents.clear();
    }
    onTextDocumentClosed(document) {
        this.documents.delete(document.uri.toString());
    }
}
exports.ExternalDocumentProvider = ExternalDocumentProvider;

//# sourceMappingURL=externalDocumentProvider.js.map
