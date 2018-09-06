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
const vscode = require("vscode");
const url = require("url");
const agent_1 = require("../agent");
const config = require("../config");
exports.liveShareTaskType = 'vsls';
let internalContext;
/**
 * Registers the Live Share workspace task provider.
 */
function register() {
    const taskProvider = vscode.workspace.registerTaskProvider(exports.liveShareTaskType, {
        provideTasks: () => getWorkspaceTasks(),
        resolveTask: () => undefined
    });
    return taskProvider;
}
exports.register = register;
/**
 * Initializes the internal context and returns its instance.
 * @param brokerToken The token value used to authorize a broker process.
 * @param fetchTasks The predicate to retrieve a list of all remote workspace tasks.
 * @param fetchTaskExecutions The predicate to retrieve a list of active task executions on the host.
 */
function configure(brokerToken, fetchTasks, fetchTaskExecutions) {
    internalContext = {
        brokerToken: brokerToken,
        fetchTasks: fetchTasks,
        fetchTaskExecutions: fetchTaskExecutions,
        dispose: () => {
            internalContext = undefined;
        }
    };
    return internalContext;
}
exports.configure = configure;
function getWorkspaceTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        if (!internalContext || !agent_1.Agent.IsRunning) {
            return result;
        }
        const taskExecutions = internalContext.fetchTaskExecutions();
        if (!!taskExecutions && !!taskExecutions.length) {
            // if task executions list is provided, then build monitor tasks only
            for (const [taskOnHost, taskExecution] of taskExecutions) {
                const workspaceTask = buildWorkspaceTask(taskOnHost, taskExecution);
                result.push(workspaceTask);
            }
        }
        else {
            // build regular workspace tasks otherwise
            const tasksOnHost = yield internalContext.fetchTasks();
            for (const taskOnHost of tasksOnHost) {
                const workspaceTask = buildWorkspaceTask(taskOnHost);
                result.push(workspaceTask);
            }
        }
        return result;
    });
}
function buildWorkspaceTask(taskOnHost, taskExecution) {
    const diagnosticLogging = config.get(config.Key.diagnosticLogging);
    const loggingArgs = diagnosticLogging ? ['--verbosity', 'Verbose'] : ['--verbosity', 'Information'];
    const brokerArgs = [
        '--broker-token',
        internalContext.brokerToken,
        '--agent-uri',
        url.format(agent_1.Agent.uri),
        '--virtual-terminal'
    ];
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    let task;
    if (!!taskExecution) {
        // create a workspace task to monitor a task execution on the host
        const kind = {
            type: exports.liveShareTaskType,
            taskUid: taskOnHost.uniqueId,
            executionId: taskExecution.id
        };
        task = new vscode.Task(kind, workspaceFolder, taskOnHost.name, taskOnHost.source ? taskOnHost.source : 'Shared', new vscode.ProcessExecution(agent_1.Agent.getAgentPath(), [
            ...loggingArgs,
            'run-task',
            taskOnHost.uniqueId,
            '--monitor',
            taskExecution.id,
            ...brokerArgs
        ]));
    }
    else {
        // create a workspace task to launch a task on the host
        const kind = {
            type: exports.liveShareTaskType,
            taskUid: taskOnHost.uniqueId
        };
        task = new vscode.Task(kind, workspaceFolder, taskOnHost.name, taskOnHost.source ? taskOnHost.source : 'Shared', new vscode.ProcessExecution(agent_1.Agent.getAgentPath(), [
            ...loggingArgs,
            'run-task',
            taskOnHost.uniqueId,
            ...brokerArgs
        ]));
    }
    switch (taskOnHost.kind) {
        case 'build':
            task.group = vscode.TaskGroup.Build;
            break;
        case 'clean':
            task.group = vscode.TaskGroup.Clean;
            break;
        case 'rebuild':
            task.group = vscode.TaskGroup.Rebuild;
            break;
        case 'test':
            task.group = vscode.TaskGroup.Test;
            break;
        default:
            break;
    }
    task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Never,
        echo: diagnosticLogging,
        focus: false,
        panel: vscode.TaskPanelKind.Shared
    };
    task.isBackground = true;
    task.problemMatchers = ['$vsls'];
    return task;
}

//# sourceMappingURL=remoteTaskProvider.js.map
