//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
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
const url = require("url");
class MementoConfig {
    static get Instance() {
        if (!MementoConfig.singleton) {
            MementoConfig.singleton = new MementoConfig();
        }
        return MementoConfig.singleton;
    }
    initAsync(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.globalState = context.globalState;
        });
    }
    get(key) {
        return this.globalState.get(key);
    }
    save(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.globalState.update(key, value);
        });
    }
    getUri(keyString) {
        let value = this.get(keyString);
        if (!value) {
            return null;
        }
        try {
            return url.parse(value);
        }
        catch (e) {
            return null;
        }
    }
}
const mementoConfigInstance = MementoConfig.Instance;
exports.MementoConfig = mementoConfigInstance;

//# sourceMappingURL=mementoConfig.js.map
