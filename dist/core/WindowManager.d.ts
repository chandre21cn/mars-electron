import { BaseWindow } from "./BaseWindow";
import type { Application } from "./index";
import type { WindowOptions } from "../interface";
import { Logger } from "../libs";
export interface PoolOptions {
    /**
     * 最小空闲窗口数
     */
    minIdle?: number;
    /**
     * 最大并发窗口容量限制
     */
    maxSize?: number;
}
export declare class WindowManager {
    private app;
    private idlePool;
    private activePool;
    private minIdle;
    private maxSize;
    constructor(app: Application, options?: PoolOptions);
    /**
     * 上下文日志
     */
    protected get logger(): Logger;
    /**
     * 获取当前所有活跃窗口
     */
    get activeWindows(): BaseWindow[];
    /**
     * 从池中提取一个空闲窗口并直接使用
     * @param url 页面地址
     * @param options 窗口个性化配置
     */
    acquire(url: string, options?: WindowOptions): Promise<BaseWindow>;
    /**
     * 广播消息
     */
    broadcast(channel: string, ...args: any[]): void;
    /**
     * 查询窗口
     * @param id 窗口ID
     */
    findById(id: number): BaseWindow | undefined;
    /**
     * 查询窗口
     * @param title 窗口标题
     */
    findByTitle(title: string): BaseWindow | undefined;
    /**
     * 自动补充空闲窗口，直到满足最小空闲水位
     */
    private _fillIdlePool;
    /**
     * 管控窗口的生命周期账目与自动补仓
     */
    private _hookWindowLifecycle;
    /**
     * 主动强行销毁某个窗口
     */
    forceReleaseWindow(win: BaseWindow): void;
    /**
     * 清空所有活窗口
     */
    destroyAll(): void;
}
