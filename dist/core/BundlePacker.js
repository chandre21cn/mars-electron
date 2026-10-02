"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = unpack;
exports.VitePluginBundlePack = VitePluginBundlePack;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fflate_1 = __importDefault(require("fflate"));
const crypto_1 = __importDefault(require("crypto"));
/**
 *  递归查找目录下所有文件路径
 * @param dir 目录路径
 * @param fileMap 文件列表
 */
function findAllFiles(dirPath, fileMap = {}) {
    const files = fs_extra_1.default.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of files) {
        const fullPath = path_1.default.join(dirPath, ent.name);
        if (ent.isDirectory()) {
            findAllFiles(fullPath, fileMap);
        }
        else {
            let key = path_1.default.relative(dirPath, fullPath).replace(/\\/g, '/');
            fileMap[key] = fullPath;
        }
    }
    return fileMap;
}
/**
 * 压缩文件并加密
 * @param fileMap 文件列表
 * @param key 密钥
 */
function compress(fileMap, key) {
    try {
        const zipInput = {};
        for (const [key, filePath] of Object.entries(fileMap)) {
            zipInput[key] = fs_extra_1.default.readFileSync(filePath);
        }
        const zipped = fflate_1.default.zipSync(zipInput, { level: 9 });
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(zipped), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]);
    }
    catch (error) {
        throw new Error(`资源包打包失败: ${error.message}`);
    }
}
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
/**
 * Vite 渲染进程文件打包加密
 */
function VitePluginBundlePack(options) {
    let viteConfig;
    return {
        name: 'vite-plugin-bundle-pack',
        apply: 'build',
        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
        },
        closeBundle() {
            const packName = viteConfig.env.VITE_PACK_NAME ?? options.name ?? 'app.bin';
            const bundleKey = viteConfig.env.VITE_PACK_KEY ?? options.key;
            if (!bundleKey) {
                throw new Error('bundleKey is required');
            }
            const distPath = viteConfig.root;
            console.log(`[pack] 正在打包并加密资源包`);
            const files = findAllFiles(distPath);
            const fileBuffer = compress(files, bundleKey);
            console.log(`[pack] 正在清空资源文件目录: ${distPath}`);
            fs_extra_1.default.emptyDirSync(distPath);
            fs_extra_1.default.ensureDirSync(distPath);
            const outputFile = path_1.default.join(distPath, packName);
            fs_extra_1.default.writeFileSync(outputFile, fileBuffer);
            console.log(`[pack] 加密文件资源包已写入: ${outputFile}`);
        }
    };
}
