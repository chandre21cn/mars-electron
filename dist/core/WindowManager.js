"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const BaseWindow_1 = require("./BaseWindow");
const WINDOW_MANAGER_LOGGER = Symbol('WindowManager#logger');
class WindowManager {
    app;
    // 空闲缓冲
    idlePool = new Set();
    // 当前正在页面上使用的活跃窗口池
    activePool = new Set();
    // 最小空闲窗口数
    minIdle;
    // 最大并发窗口容量限制
    maxSize;
    constructor(app, options = {}) {
        this.app = app;
        this.minIdle = options.minIdle ?? 1;
        this.maxSize = options.maxSize ?? 5;
        this._fillIdlePool();
    }
    /**
     * 上下文日志
     */
    get logger() {
        if (!this[WINDOW_MANAGER_LOGGER]) {
            const loggerName = this.constructor.name;
            this[WINDOW_MANAGER_LOGGER] = this.app.createLogger(loggerName);
        }
        return this[WINDOW_MANAGER_LOGGER];
    }
    /**
     * 获取当前所有活跃窗口
     */
    get activeWindows() {
        return Array.from(this.activePool);
    }
    /**
     * 从池中提取一个空闲窗口并直接使用
     * @param url 页面地址
     * @param options 窗口个性化配置
     */
    async acquire(url, options = {}) {
        let win;
        if (this.idlePool.size > 0) {
            win = this.idlePool.values().next().value;
            this.idlePool.delete(win);
            this.logger.debug(`从空闲池中提取预加载窗口 [ID: ${win.id}]`);
        }
        else {
            if (this.activePool.size >= this.maxSize) {
                throw new Error(`最多可同时打开 ${this.maxSize} 个窗口`);
            }
            win = new BaseWindow_1.BaseWindow(this.app, options);
            this.logger.debug(`空闲池已空，临时冷启动窗口 [ID: ${win.id}]`);
        }
        this.activePool.add(win);
        this._hookWindowLifecycle(win);
        await win.setOptions(options);
        await win.open(url);
        this._fillIdlePool();
        return win;
    }
    /**
     * 广播消息
     */
    broadcast(channel, ...args) {
        this.activeWindows.forEach(win => {
            win.emit(channel, ...args);
        });
    }
    /**
     * 查询窗口
     * @param id 窗口ID
     */
    findById(id) {
        for (const win of this.activePool) {
            if (win.id === id)
                return win;
        }
        for (const win of this.idlePool) {
            if (win.id === id)
                return win;
        }
        return undefined;
    }
    /**
     * 查询窗口
     * @param title 窗口标题
     */
    findByTitle(title) {
        for (const win of this.activePool) {
            if (win.title === title)
                return win;
        }
        for (const win of this.idlePool) {
            if (win.title === title)
                return win;
        }
        return undefined;
    }
    /**
     * 自动补充空闲窗口，直到满足最小空闲水位
     */
    _fillIdlePool() {
        const currentTotal = this.idlePool.size + this.activePool.size;
        while (this.idlePool.size < this.minIdle && currentTotal < this.maxSize) {
            const win = new BaseWindow_1.BaseWindow(this.app);
            this.idlePool.add(win);
            this.logger.debug(`预加载新窗口放入空闲池 [ID: ${win.id}]，当前空闲数: ${this.idlePool.size}`);
        }
    }
    /**
     * 管控窗口的生命周期账目与自动补仓
     */
    _hookWindowLifecycle(win) {
        const rawFrame = win.frame;
        rawFrame.once('closed', () => {
            const winId = win.id;
            this.activePool.delete(win);
            this.logger.debug(`窗口 [ID: ${winId}] 已关闭销毁`);
            this._fillIdlePool();
        });
    }
    /**
     * 主动强行销毁某个窗口
     */
    forceReleaseWindow(win) {
        this.idlePool.delete(win);
        this.activePool.delete(win);
        win.destroy();
    }
    /**
     * 清空所有活窗口
     */
    destroyAll() {
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
exports.WindowManager = WindowManager;
