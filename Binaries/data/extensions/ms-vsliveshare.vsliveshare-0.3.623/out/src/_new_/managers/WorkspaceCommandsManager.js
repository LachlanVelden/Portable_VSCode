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
const util_1 = require("../../util");
const session_1 = require("../../session");
const commands_1 = require("../../commands");
class WorkspaceCommandsManager {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setupPinCommand();
        });
    }
    setupPinCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            yield util_1.ExtensionUtil.tryRegisterCommand(commands_1.Commands.pinCommandId, (args) => {
                if (!session_1.SessionContext.coeditingClient || !session_1.SessionContext.collaboratorManager) {
                    return;
                }
                const coEditors = session_1.SessionContext.collaboratorManager.getCollaboratorSessionIds();
                const coEditorCount = coEditors.length;
                if (coEditorCount < 1) {
                    return;
                }
                // args will be a boolean with the value of true if invoked via listParticipants
                let alwaysShowParticipants = false;
                if (typeof (args) === 'boolean') {
                    alwaysShowParticipants = args;
                }
                let textEditor = vscode.window.activeTextEditor;
                if (coEditorCount === 1 && !alwaysShowParticipants) {
                    session_1.SessionContext.coeditingClient.pin(textEditor, coEditors[0]);
                }
                else {
                    const placeHolder = alwaysShowParticipants
                        ? coEditorCount + ' participant location(s) listed below. Select one to follow or press \'Escape\' when done.'
                        : 'Select a participant to follow';
                    const picks = coEditors.map((sessionId) => {
                        const displayName = session_1.SessionContext.collaboratorManager.getDisplayName(sessionId);
                        const lastKnownFile = session_1.SessionContext.coeditingClient.lastKnownFileForClient(sessionId);
                        return {
                            description: displayName,
                            detail: lastKnownFile ? `Currently editing ${lastKnownFile}` : 'Not currently editing a shared document',
                            label: '$(file-symlink-file)',
                            targetSessionId: sessionId
                        };
                    });
                    return vscode.window
                        .showQuickPick(picks, { placeHolder })
                        .then(pick => (pick && session_1.SessionContext.coeditingClient.pin(textEditor, pick.targetSessionId)));
                }
            }, undefined, /* isEditorCommand */ false);
            yield util_1.ExtensionUtil.tryRegisterCommand(commands_1.Commands.unpinCommandId, (textEditor, edit, args) => {
                if (!session_1.SessionContext.coeditingClient) {
                    return;
                }
                session_1.SessionContext.coeditingClient.unpinByEditor(textEditor, /* explicit */ true);
            }, undefined, /* isEditorCommand */ true);
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            util_1.ExtensionUtil.disposeCommand(commands_1.Commands.pinCommandId);
            util_1.ExtensionUtil.disposeCommand(commands_1.Commands.unpinCommandId);
        });
    }
}
exports.WorkspaceCommandsManager = WorkspaceCommandsManager;

//# sourceMappingURL=WorkspaceCommandsManager.js.map
