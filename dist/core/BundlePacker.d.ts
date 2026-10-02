import { Plugin } from 'vite';
import fflate from 'fflate';
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
 * 解包
 * @param options 配置
 */
export declare function unpack({ name, key }: BundleUnPackOptions): fflate.Unzipped;
/**
 * Vite 渲染进程文件打包加密
 */
export declare function VitePluginBundlePack(options?: BundlePackOptions): Plugin;
