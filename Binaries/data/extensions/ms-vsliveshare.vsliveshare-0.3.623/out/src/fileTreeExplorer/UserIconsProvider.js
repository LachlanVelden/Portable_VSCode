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
const fs = require("fs-extra");
const path = require("path");
const decorators_1 = require("../coediting/client/decorators");
const traceSource_1 = require("../tracing/traceSource");
const renderUserCircleIcon_1 = require("./renderUserCircleIcon");
exports.iconsRoot = path.join(__filename, '../../../../images/');
class IconsProvider {
    constructor() {
        this.trace = traceSource_1.traceSource.withName('IconsProvider');
        this.icons = {};
        this.createIconBundle = (color) => __awaiter(this, void 0, void 0, function* () {
            const cleanColorName = color.replace(/\,|\.|\(|\)|\s/gim, '_');
            const normalPath = path.join(exports.iconsRoot, `./user-icon-${cleanColorName}-icon.svg`);
            const filledPath = path.join(exports.iconsRoot, `./user-icon-${cleanColorName}-filled-icon.svg`);
            if (fs.pathExistsSync(normalPath) && fs.pathExistsSync(filledPath)) {
                return {
                    normal: normalPath,
                    filled: filledPath
                };
            }
            yield fs.writeFile(normalPath, renderUserCircleIcon_1.renderCircleIcon(color, false));
            yield fs.writeFile(filledPath, renderUserCircleIcon_1.renderCircleIcon(color, true));
            return {
                normal: normalPath,
                filled: filledPath
            };
        });
    }
    getIcon(color) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentIcon = this.icons[color];
            if (currentIcon) {
                return currentIcon;
            }
            try {
                this.icons[color] = yield this.createIconBundle(color);
            }
            catch (e) {
                this.trace.error(`${e.message}:\n ${e.stack}`);
                return null;
            }
            return this.icons[color];
        });
    }
    getIconByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const color = decorators_1.SharedColors.requestColor(userId);
            const { backgroundColor, textColor } = color;
            const red = parseInt(`${255 * backgroundColor.red}`, 10);
            const green = parseInt(`${255 * backgroundColor.green}`, 10);
            const blue = parseInt(`${255 * backgroundColor.blue}`, 10);
            const colorString = `rgb(${red}, ${green}, ${blue})`;
            return yield this.getIcon(colorString);
        });
    }
}
exports.userIconProvider = new IconsProvider();

//# sourceMappingURL=UserIconsProvider.js.map
