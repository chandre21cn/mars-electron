import { Plugin } from 'vite';
export interface BundlePackOptions {
    /** 资源包文件名 */
    name?: string;
    /** 资源包密钥 */
    key?: string;
}
/**
 * Vite 渲染进程文件打包加密
 */
export declare function VitePluginBundlePack(options?: BundlePackOptions): Plugin;
