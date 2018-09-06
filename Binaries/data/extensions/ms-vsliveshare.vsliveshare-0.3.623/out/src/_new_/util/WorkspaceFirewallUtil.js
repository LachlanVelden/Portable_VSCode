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
const vsls = require("../../contracts/VSLS");
const config_1 = require("../../config");
/**
 * Helper functions for performing firewall checks.
 */
class WorkspaceFirewallUtil {
    constructor(firewallService, workspacePromptsUtil, configUtil) {
        this.firewallService = firewallService;
        this.workspacePromptsUtil = workspacePromptsUtil;
        this.configUtil = configUtil;
    }
    /// <summary>
    /// Performs firewall rules check for the vsls-agent.exe process.
    /// </summary>
    /// <param name="session">Current client session.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if sharing operation should continue, false otherwise.</returns>
    performFirewallCheckAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let connectionMode = this.configUtil.get(config_1.Key.connectionMode);
            if (vsls.ConnectionMode.Auto === connectionMode ||
                vsls.ConnectionMode.Direct === connectionMode) {
                let firewallStatus = yield this.firewallService.getFirewallStatusAsync();
                if (vsls.FirewallStatus.Block === firewallStatus) {
                    switch (connectionMode) {
                        case vsls.ConnectionMode.Direct:
                            yield this.workspacePromptsUtil.showFirewallInformationMessage('error.BlockActionDirectModePrompt', false);
                            return false;
                        case vsls.ConnectionMode.Auto:
                            if (yield this.workspacePromptsUtil.showFirewallInformationMessage('warning.BlockActionAutoModePrompt', true)) {
                                yield this.configUtil.save(config_1.Key.connectionMode, vsls.ConnectionMode.Relay, true, true);
                                return true;
                            }
                            return false;
                        default:
                            break;
                    }
                }
                else if (vsls.FirewallStatus.None === firewallStatus) {
                    switch (connectionMode) {
                        case vsls.ConnectionMode.Direct:
                            yield this.workspacePromptsUtil.showFirewallInformationMessage('info.NoneActionDirectModePrompt', false);
                            break;
                        case vsls.ConnectionMode.Auto:
                            yield this.workspacePromptsUtil.showFirewallInformationMessage('info.NoneActionAutoModePrompt', false);
                            break;
                        default:
                            break;
                    }
                }
            }
            return true;
        });
    }
}
exports.WorkspaceFirewallUtil = WorkspaceFirewallUtil;

//# sourceMappingURL=WorkspaceFirewallUtil.js.map
