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
/**
 * Instrumentation other pieces of middleware.
 */
class MetaProfilingCommandDecorator {
    constructor(command, next) {
        this.command = command;
        this.next = next;
        this.friendlyName = (this.next && this.next.constructor && this.next.constructor.name).replace('CommandDecorator', '');
    }
    invoke(options, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            let hasError = false;
            MetaProfilingCommandDecorator.setPreTime();
            context.trace.info(`Decorator: ${this.friendlyName} Starting`);
            try {
                result = yield this.next.invoke(options, context);
            }
            catch (e) {
                hasError = true;
                throw e;
            }
            finally {
                const tailTiming = MetaProfilingCommandDecorator.timeTail;
                const timing = MetaProfilingCommandDecorator.setPostTime();
                const duration = timing.post - timing.pre;
                const errorText = hasError ? 'Failed' : 'Success';
                let durationText = '';
                if (tailTiming) {
                    const preDuration = tailTiming.pre - timing.pre;
                    const postDuration = timing.post - tailTiming.post;
                    durationText = ` abs=${preDuration + postDuration}ms pre=${preDuration}ms post=${postDuration}`;
                }
                context.trace.info(`Decorator: ${this.friendlyName} Completed ${errorText} (${duration}ms${durationText})`);
            }
            return result;
        });
    }
    static setPreTime() {
        const timing = {
            pre: new Date().getTime()
        };
        MetaProfilingCommandDecorator.timeTracker.push(timing);
        return timing;
    }
    static setPostTime() {
        const timing = MetaProfilingCommandDecorator.timeTracker.pop();
        timing.post = new Date().getTime();
        MetaProfilingCommandDecorator.timeTail = timing;
        return timing;
    }
}
MetaProfilingCommandDecorator.timeTracker = [];
exports.MetaProfilingCommandDecorator = MetaProfilingCommandDecorator;

//# sourceMappingURL=MetaProfilingCommandDecorator.js.map
