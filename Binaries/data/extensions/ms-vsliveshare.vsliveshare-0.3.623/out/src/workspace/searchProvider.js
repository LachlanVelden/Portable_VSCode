//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const vscode = require("vscode");
const vsls = require("../contracts/VSLS");
const config = require("../config");
const traceSource_1 = require("../tracing/traceSource");
const telemetry_1 = require("../telemetry/telemetry");
const searchServiceTelemetry_1 = require("../telemetry/searchServiceTelemetry");
const pathManager_1 = require("../languageService/pathManager");
const util_1 = require("../util");
class SearchProvider {
    constructor(fileservice) {
        this.pathManager = pathManager_1.PathManager.getPathManager();
        this.multiRootWorkspaceEnabled = config.featureFlags.multiRootWorkspaceVSCode;
        this.fileservice = fileservice;
        this.fileSearchOptionsMap = new Map();
        this.fileListMap = new Map();
        this.fileservice.onFilesChanged((e) => this.onFilesChanged(e));
        this.trace = traceSource_1.traceSource.withName(traceSource_1.TraceSources.AgentFile);
    }
    onFilesChanged(e) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let change of e.changes) {
                yield this.updateList(change);
            }
        });
    }
    updateList(change) {
        return __awaiter(this, void 0, void 0, function* () {
            const changePath = (this.multiRootWorkspaceEnabled ? change.fullPath : change.path);
            for (let [root, filePaths] of this.fileListMap) {
                switch (change.changeType) {
                    case vsls.FileChangeType.Deleted:
                        let index = filePaths ? filePaths.indexOf(changePath) : -1;
                        if (index === -1) {
                            break;
                        }
                        // If the change is for the last file in the file path list
                        if (index === filePaths.length - 1) {
                            filePaths.pop();
                        }
                        else {
                            filePaths[index] = filePaths.pop();
                        }
                        break;
                    case vsls.FileChangeType.Added:
                        //check if file is excluded
                        let fileOptions = {
                            excludePatterns: this.fileSearchOptionsMap.get(root).excludes,
                            enableMultipleRoots: this.multiRootWorkspaceEnabled
                        };
                        if (!(yield this.fileservice.isExcludedAsync(changePath, fileOptions))) {
                            filePaths.push(changePath);
                        }
                        break;
                    default:
                        break;
                }
                this.fileListMap.set(root, filePaths);
            }
        });
    }
    getFiles(options, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let includeList = [options.folder.path];
                let fileOptions = {
                    excludePatterns: options.excludes,
                    enableMultipleRoots: config.featureFlags.multiRootWorkspaceVSCode,
                    includePatterns: includeList.concat(options.includes)
                };
                let filePaths = yield this.fileservice.getFilesAsync(fileOptions, token);
                this.fileListMap.set(options.folder.path, filePaths);
                searchServiceTelemetry_1.FileSearchTelemetry.sendFindFileDiagnostics(filePaths.length, options.useIgnoreFiles);
            }
            catch (e) {
                this.trace.error(e);
                telemetry_1.Instance.sendFault(searchServiceTelemetry_1.SearchServiceTelemetryEventNames.FIND_FILE_FAULT, telemetry_1.FaultType.Error, 'Failed to get files from host', e);
            }
        });
    }
    provideFileIndex(options, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let root = options.folder.path;
            let fileList = this.fileListMap.get(root);
            if (!fileList || !this.fileSearchOptionsMap.has(root)) {
                yield this.getFiles(options, token);
                this.fileSearchOptionsMap.set(root, options);
            }
            fileList = this.fileListMap.get(root);
            if (fileList) {
                const vslsUris = fileList.map(relativePath => {
                    return this.pathManager.relativePathToLocalPath(relativePath);
                });
                return vslsUris;
            }
            return null;
        });
    }
    toVsCodeTextSearchResult(result) {
        let vslsUri = this.pathManager.relativePathToLocalPath(result.path);
        return {
            uri: vslsUri,
            range: new vscode.Range(result.line, result.column, result.line, result.column + result.length),
            preview: {
                text: result.text,
                match: new vscode.Range(result.line, result.column, result.line, result.column + result.length)
            }
        };
    }
    toOldVsCodeTextSearchResult(result) {
        let vslsUri = this.pathManager.relativePathToLocalPath(result.path);
        return {
            path: vslsUri.path,
            range: new vscode.Range(result.line, result.column, result.line, result.column + result.length),
            preview: {
                text: result.text,
                match: new vscode.Range(result.line, result.column, result.line, result.column + result.length)
            }
        };
    }
    toVslsTextSearchOptions(query, options) {
        return {
            pattern: query.pattern,
            isRegex: query.isRegExp,
            isCaseSensitive: query.isCaseSensitive,
            isWordMatch: query.isWordMatch,
            includeHiddenFiles: options.useIgnoreFiles,
            encoding: options.encoding,
            fileIncludes: options.includes,
            fileExcludes: options.excludes
        };
    }
    provideTextSearchResults(query, options, progress, token) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!config.featureFlags.textSearch) {
                return resolve();
            }
            let vslsOptions = this.toVslsTextSearchOptions(query, options);
            const searchServiceTelemetry = new searchServiceTelemetry_1.TextSearchTelemetry();
            searchServiceTelemetry.startTextSearch();
            let results = [];
            try {
                results = yield this.fileservice.getTextSearchResultsAsync(vslsOptions, token);
                searchServiceTelemetry.saveTextSearchResults(results.length);
            }
            catch (e) {
                // Do nothing; host doesn't have latest extension
                return resolve();
            }
            if (semver.gte(semver.coerce(vscode.version), '1.26.0')) {
                results.forEach(result => {
                    let vscodeResult = this.toVsCodeTextSearchResult(result);
                    try {
                        progress.report(vscodeResult);
                    }
                    catch (e) {
                        let oldVscodeResult = this.toOldVsCodeTextSearchResult(result);
                        progress.report(oldVscodeResult);
                    }
                });
            }
            else {
                results.forEach(result => {
                    let oldVscodeResult = this.toOldVsCodeTextSearchResult(result);
                    progress.report(oldVscodeResult);
                });
            }
            if (results.length > 0 && results[results.length - 1].hitResultsLimit === true) {
                vscode.window.showInformationMessage(util_1.ExtensionUtil.getString('info.SearchResultsLimited'));
            }
            searchServiceTelemetry.sendTextSearchDiagnostics();
            resolve();
        }));
    }
}
exports.SearchProvider = SearchProvider;
class TextSearchQuery {
}
exports.TextSearchQuery = TextSearchQuery;
class TextSearchOptions {
}
exports.TextSearchOptions = TextSearchOptions;

//# sourceMappingURL=searchProvider.js.map
