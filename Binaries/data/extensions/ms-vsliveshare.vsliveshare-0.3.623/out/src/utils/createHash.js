var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const crypto = require('crypto');
const fs = require('fs');
function createHash(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const hash = crypto.createHash('sha256');
            const input = fs.createReadStream(filename);
            input.on('error', (err) => {
                if (err.code === 'ENOENT') {
                    resolve(null);
                }
                else {
                    throw new Error(err);
                }
            });
            input.on('readable', () => {
                const data = input.read();
                if (data) {
                    hash.update(data);
                }
                else {
                    resolve(hash.digest('hex'));
                }
            });
        });
    });
}
module.exports = { createHash };

//# sourceMappingURL=createHash.js.map
