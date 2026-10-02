import { Plugin, ResolvedConfig } from 'vite';
import fs from 'fs-extra'
import path from 'path'
import fflate from 'fflate'
import crypto from 'crypto'

export interface BundlePackOptions {
    /** 资源包文件名 */
    name?: string;
    /** 资源包密钥 */
    key?: string;
}

export interface BundleUnPackOptions {
    /** 资源包文件名 */
    name: string;
    /** 资源包密钥 */
    key: string;
}

/**
 *  递归查找目录下所有文件路径
 * @param dir 目录路径
 * @param fileMap 文件列表 
 */
function findAllFiles(dirPath: string, fileMap: Record<string, string> = {}) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of files) {
        const fullPath = path.join(dirPath, ent.name);
        if (ent.isDirectory()) {
            findAllFiles(fullPath, fileMap)
        } else  {
            let key = path.relative(dirPath, fullPath).replace(/\\/g, '/');
            fileMap[key] = fullPath
        }
    }
    return fileMap
}
 
/**
 * 压缩文件并加密
 * @param fileMap 文件列表
 * @param key 密钥
 */
function compress(fileMap: Record<string, string>, key: string): Buffer {
    try {
        const zipInput = {}
        for (const [key, filePath] of Object.entries(fileMap)) {
            zipInput[key] = fs.readFileSync(filePath)
        }
        const zipped = fflate.zipSync(zipInput, { level: 9 })

        const iv = crypto.randomBytes(12)
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        const encrypted = Buffer.concat([cipher.update(zipped), cipher.final() ])
        const authTag = cipher.getAuthTag()

        return Buffer.concat([iv, authTag, encrypted]);
    } catch(error: any) {
        throw new Error(`资源包打包失败: ${ error.message }`)
    }
}

/**
 * 解压文件
 */
function decompress(filepath: string, key: string) {
    const fileBuffer = fs.readFileSync(filepath)
    const iv = fileBuffer.subarray(0, 12)
    const tag = fileBuffer.subarray(12, 28)
    const encrypted = fileBuffer.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag)
    const zipped = Buffer.concat([ decipher.update(encrypted), decipher.final() ])
    return fflate.unzipSync(zipped)
}

/**
 * 解包
 * @param options 配置
 */
export function unpack({ name, key }: BundleUnPackOptions) {
    const file = path.join(__dirname, '../renderer', name)
    if (!fs.existsSync(file)) {
        throw new Error(`file not found: ${ file }`);
    }
    try {
        return decompress(file, key)
    } catch(error) {
        throw new Error(`资源包解码失败`)
    }
}

/**
 * Vite 渲染进程文件打包加密
 */
export function VitePluginBundlePack(options?: BundlePackOptions): Plugin {
    let viteConfig: ResolvedConfig;
    return {
        name: 'vite-plugin-bundle-pack',
        apply: 'build',
        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig
        },
        closeBundle() {
            const packName = viteConfig.env.VITE_PACK_NAME ?? options?.name ?? 'app.bin';
            const bundleKey = viteConfig.env.VITE_PACK_KEY ?? options?.key;
            if (!bundleKey) {
                throw new Error('bundleKey is required');
            }
            const distPath = viteConfig.root
            console.log(`[pack] 正在打包并加密资源包`);
            const files = findAllFiles(distPath)
            const fileBuffer = compress(files, bundleKey)

            console.log(`[pack] 正在清空资源文件目录: ${ distPath }`);
            fs.emptyDirSync(distPath); 

            fs.ensureDirSync(distPath)
            const outputFile = path.join(distPath, packName)
            fs.writeFileSync(outputFile, fileBuffer)
            console.log(`[pack] 加密文件资源包已写入: ${ outputFile }`);

        }
    }
}