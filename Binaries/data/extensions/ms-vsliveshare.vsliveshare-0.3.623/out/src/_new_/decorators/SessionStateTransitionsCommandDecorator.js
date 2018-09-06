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
function sessionStateTransitionsCommandDecorator(statusStart, statusComplete, statusCompleteError) {
    return DecoratorHelper_1.DecoratorHelper.setupDecorator((command) => new SessionStateTransitionsCommandDecorator(DecoratorHelper_1.DecoratorHelper.getCoreCommand(command), command, Dependencies_1.dependencies.sessionContext(), statusStart, statusComplete, statusCompleteError));
}
exports.sessionStateTransitionsCommandDecorator = sessionStateTransitionsCommandDecorator;
/**
 * SessionContext Transition `commandHandler` that automatically transitions the
 * `start`, `completeError` and `complete` states for the command.
 */
class SessionStateTransitionsCommandDecorator {
    constructor(command, next, sessionContext, statusStart, statusComplete, statusCompleteError) {
        this.command = command;
        this.next = next;
        this.sessionContext = sessionContext;
        this.statusStart = statusStart;
        this.statusComplete = statusComplete;
        this.statusCompleteError = statusCompleteError;
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            try {
                if (this.statusStart !== undefined) {
                    this.sessionContext.transition(this.statusStart);
                }
                result = yield this.next.invoke(options, context);
                if (this.statusComplete !== undefined) {
                    this.sessionContext.transition(this.statusComplete);
                }
            }
            catch (error) {
                if (this.statusCompleteError !== undefined) {
                    this.sessionContext.transition(this.statusCompleteError);
                }
                throw error;
            }
            return result;
        });
    }
}
exports.SessionStateTransitionsCommandDecorator = SessionStateTransitionsCommandDecorator;

//# sourceMappingURL=SessionStateTransitionsCommandDecorator.js.map
