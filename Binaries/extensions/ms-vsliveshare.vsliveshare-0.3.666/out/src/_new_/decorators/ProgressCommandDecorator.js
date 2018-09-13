"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const Dependencies_1 = require("../Dependencies");
const CancellationError_1 = require("../abstractions/CancellationError");
function progressCommandDecorator(title) {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new ProgressCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.progressNotifierUtil(), title));
}
exports.progressCommandDecorator = progressCommandDecorator;
/**
 * Progress `decorator` that executes progress func prior to running
 * core command.
 */
class ProgressCommandDecorator {
    constructor(command, next, progressNotifierUtil, title) {
        this.command = command;
        this.next = next;
        this.progressNotifierUtil = progressNotifierUtil;
        this.title = title;
    }
    async invoke(options, context) {
        let result = undefined;
        // persist the command name to the command context
        context.commandName = this.title;
        result = await this.progressNotifierUtil.create({ title: this.title }, async (progressUIcancellationToken) => {
            /*
                Since we have to listen to the `progressUIcancellationToken.onCancellationRequested` and
                throwing inside the callback will swallow the error(because at time of exception, the callback will be on the top of the call stack),
                // we need this explicit Promise `reject` to be able to bubble up the error.
            */
            return new Promise(async (resolve, reject) => {
                if (progressUIcancellationToken) {
                    if (progressUIcancellationToken.isCancellationRequested) {
                        reject(new CancellationError_1.CancellationError(`The operation was cancelled.`));
                    }
                    progressUIcancellationToken.onCancellationRequested(() => {
                        reject(new CancellationError_1.CancellationError(`The operation was cancelled.`));
                    });
                }
                try {
                    resolve(await this.next.invoke(options, context));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        return result;
    }
}
exports.ProgressCommandDecorator = ProgressCommandDecorator;

//# sourceMappingURL=ProgressCommandDecorator.js.map
