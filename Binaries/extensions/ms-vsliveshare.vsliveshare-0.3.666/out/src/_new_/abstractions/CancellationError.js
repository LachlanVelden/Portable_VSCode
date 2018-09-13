"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CancellationError extends Error {
    constructor(message, code) {
        super(...arguments);
        this.code = code;
    }
}
exports.CancellationError = CancellationError;

//# sourceMappingURL=CancellationError.js.map
