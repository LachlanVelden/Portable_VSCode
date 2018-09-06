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
function validationCommandDecorator() {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new ValidationCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command));
}
exports.validationCommandDecorator = validationCommandDecorator;
/**
 * Validation `decorator` that executes validation func prior to running
 * core command.
 */
class ValidationCommandDecorator {
    constructor(command, next) {
        this.command = command;
        this.next = next;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            let validator = this.command;
            if (validator.validate) {
                validator.validate(options, context);
            }
            result = yield this.next.invoke(options, context);
            return result;
        });
    }
}
exports.ValidationCommandDecorator = ValidationCommandDecorator;

//# sourceMappingURL=ValidationCommandDecorator.js.map
