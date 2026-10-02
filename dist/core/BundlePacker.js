"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = unpack;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fflate_1 = __importDefault(require("fflate"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * 解压文件
 */
function decompress(filepath, key) {
    const fileBuffer = fs_extra_1.default.readFileSync(filepath);
    const iv = fileBuffer.subarray(0, 12);
    const tag = fileBuffer.subarray(12, 28);
    const encrypted = fileBuffer.subarray(28);
    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const zipped = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return fflate_1.default.unzipSync(zipped);
}
/**
 * 解包
 * @param options 配置
 */
function unpack({ name, key }) {
    const file = path_1.default.join(__dirname, '../renderer', name);
    if (!fs_extra_1.default.existsSync(file)) {
        throw new Error(`file not found: ${file}`);
    }
    try {
        return decompress(file, key);
    }
    catch (error) {
        throw new Error(`资源包解码失败`);
    }
}
