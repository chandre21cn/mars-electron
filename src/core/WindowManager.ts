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
const WINDOW_MANAGER_LOGGER    = Symbol('WindowManager#logger')

export class WindowManager {

    // 空闲缓冲
    private idlePool: Set<BaseWindow> = new Set();
    // 当前正在页面上使用的活跃窗口池
    private activePool: Set<BaseWindow> = new Set();
    // 最小空闲窗口数
    private minIdle: number;
    // 最大并发窗口容量限制
    private maxSize: number;

    constructor(private app: Application, options: PoolOptions = {}) {
        this.minIdle = options.minIdle ?? 1;
        this.maxSize = options.maxSize ?? 5;
        this._fillIdlePool();
    }

    /** 
     * 上下文日志
     */
    protected get logger(): Logger {
        if (!this[WINDOW_MANAGER_LOGGER]) {
            const loggerName = this.constructor.name
            this[WINDOW_MANAGER_LOGGER] = this.app.createLogger(loggerName)
        }
        return this[WINDOW_MANAGER_LOGGER]
    }

    /**
     * 获取当前所有活跃窗口
     */
    get activeWindows(): BaseWindow[] {
        return Array.from(this.activePool);
    }

    /**
     * 从池中提取一个空闲窗口并直接使用
     * @param url 页面地址
     * @param options 窗口个性化配置
     */
    async acquire(url: string, options: WindowOptions = {}): Promise<BaseWindow> {
        let win: BaseWindow | undefined;

        if (this.idlePool.size > 0) {
            win = this.idlePool.values().next().value!;
            this.idlePool.delete(win);
            this.logger.debug(`从空闲池中提取预加载窗口 [ID: ${win.id}]`);
        } else {
            if (this.activePool.size >= this.maxSize) {
                throw new Error(`最多可同时打开 ${ this.maxSize  } 个窗口`);
            }
            win = new BaseWindow(this.app, options);
            this.logger.debug(`空闲池已空，临时冷启动窗口 [ID: ${win.id}]`);
        }

        this.activePool.add(win);
        this._hookWindowLifecycle(win);
        await win.setOptions(options)
        await win.open(url);
        this._fillIdlePool();

        return win;
    }

    /**
     * 广播消息
     */
    broadcast(channel: string, ...args: any[]) {
        this.activeWindows.forEach(win => {
            win.emit(channel, ...args)
        })
    }

    /**
     * 查询窗口
     * @param id 窗口ID
     */
    findById(id: number): BaseWindow | undefined {
        for (const win of this.activePool) {
            if (win.id === id) return win;
        }
        for (const win of this.idlePool) {
            if (win.id === id) return win;
        }
        return undefined;
    }

    /**
     * 查询窗口
     * @param title 窗口标题
     */
    findByTitle(title: string): BaseWindow | undefined {
        for (const win of this.activePool) {
            if (win.title === title) return win;
        }
        for (const win of this.idlePool) {
            if (win.title === title) return win;
        }
        return undefined;
    }

    /**
     * 自动补充空闲窗口，直到满足最小空闲水位
     */
    private _fillIdlePool() {
        const currentTotal = this.idlePool.size + this.activePool.size;
        while (this.idlePool.size < this.minIdle && currentTotal < this.maxSize) {
            const win = new BaseWindow(this.app);
            this.idlePool.add(win);
            this.logger.debug(`预加载新窗口放入空闲池 [ID: ${win.id}]，当前空闲数: ${this.idlePool.size}`);
        }
    }

    /**
     * 管控窗口的生命周期账目与自动补仓
     */
    private _hookWindowLifecycle(win: BaseWindow) {
        const rawFrame = (win as any).frame; 
        rawFrame.once('closed', () => {
            const winId = (win as any).id;
            this.activePool.delete(win);
            this.logger.debug(`窗口 [ID: ${winId}] 已关闭销毁`);
            this._fillIdlePool();
        });
    }

    /**
     * 主动强行销毁某个窗口
     */
    public forceReleaseWindow(win: BaseWindow) {
        this.idlePool.delete(win);
        this.activePool.delete(win);
        win.destroy(); 
    }

    /**
     * 清空所有活窗口
     */
    public destroyAll() {
        for (const win of this.idlePool) {
            win.destroy();
        }
        for (const win of this.activePool) {
            win.destroy();
        }
        this.idlePool.clear();
        this.activePool.clear();
    }
}