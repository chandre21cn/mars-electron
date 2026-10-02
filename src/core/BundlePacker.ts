import fs from 'fs-extra'
import path from 'path'
import fflate from 'fflate'
import crypto from 'crypto'

export interface BundleUnPackOptions {
    /** 资源包文件名 */
    name: string;
    /** 资源包密钥 */
    key: string;
}

/**
 * 解压文件
 */
function decompress(filepath: string, key: Buffer) {
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
    const file = path.join(__dirname, 'out/renderer', name)
    if (!fs.existsSync(file)) {
        throw new Error(`file not found: ${ file }`);
    }
    try {
        return decompress(file, Buffer.from(key, 'base64'))
    } catch(error) {
        throw new Error(`资源包解码失败`)
    }
}
