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
const DecoratorHelper_1 = require("../util/DecoratorHelper");
const Dependencies_1 = require("../Dependencies");
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
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            result = yield this.progressNotifierUtil.create({ title: this.title }, () => this.next.invoke(options, context), // TODO: check for async/await
            context.cancellationToken);
            return result;
        });
    }
}
exports.ProgressCommandDecorator = ProgressCommandDecorator;

//# sourceMappingURL=ProgressCommandDecorator.js.map
