import { BrowserWindow, ipcMain } from 'electron'
import { inspect } from 'util';
import { extend } from "../utils";
import type { Application } from ".";
import type { WindowInfo, WindowMode, WindowOptions } from "../interface";
import type { Logger } from '../libs';
import { Ipc, IPC_METHOD_METADATA, IPC_MODULE_METADATA, IpcWindow, IpcWindowOn } from '../decorators';

const BASE_WINDOW_LOGGER    = Symbol('BaseWindow#logger')

@Ipc('win')
export class BaseWindow {
    
    // 应用管理中心实例
    private readonly app: Application
    // 当前页面URL
    private url: string | null = null
    // 缓存窗口ID
    private readonly winId: number
    // 窗口
    readonly frame: BrowserWindow

    /**
     * 初始化窗口
     * @param app 应用实例
     * @param options 窗口配置选项
     */
    constructor(app: Application, options: WindowOptions  = {}) {
        this.app    = app
        this.frame  = new BrowserWindow(
            extend(true, {}, this.config.window ?? {}, { show: false, options})
        )
        this.winId  = this.frame.webContents.id
        this._registerIpcListeners()
        this._initEventListener()
    }

    [inspect.custom]() {
        return `<${this.constructor.name} extends BaseWindow>`;
    }

    // 窗口ID
    get id(): number {
        if (this.frame.isDestroyed()) {
            return this.winId;
        }
        return this.frame.webContents.id
    }
    
    // 窗口标题
    get title(): string {
        if (this.frame.isDestroyed()) {
            return ''
        }
        return this.frame.getTitle()
    }

    /**
     * 应用配置
     */
    private get config() {
        return this.app.config
    }

    /**
     * 是否关闭
     */
    get isClosed() {
        return this.frame.isClosable()
    }

    /**
     * 是否销毁
     */
    get isDestroyed() {
        return this.frame.isDestroyed()
    }

    /** 
     * 上下文日志
     */
    protected get logger(): Logger {
        if (!this[BASE_WINDOW_LOGGER]) {
            const loggerName = this.constructor.name
            this[BASE_WINDOW_LOGGER] = this.app.createLogger(loggerName)
        }
        return this[BASE_WINDOW_LOGGER]
    }

    /**
     * 注册 IPC 监听器
     */
    private _registerIpcListeners() {
        const target    = this.constructor;
        const prefix    = Reflect.getMetadata(IPC_MODULE_METADATA, target) || "";
        const methods   = Reflect.getMetadata(IPC_METHOD_METADATA, target) || [];

        methods.forEach((item: any) => {
            const isWindowIpc = item.type === 'window' || item.type === 'window-on';
            const fullChannel = isWindowIpc ? `${prefix}:${item.channel}:${this.id}` : `${prefix}:${item.channel}`;
            if (item.type === 'window' || item.type === 'handle') {
                ipcMain.handle(fullChannel, (_: Electron.IpcMainInvokeEvent, ...args) => {
                    return (this as any)[item.methodName](...args);
                });
            }
            else if (item.type === 'window-on' || item.type === 'on') {
                ipcMain.on(fullChannel, (event: Electron.IpcMainEvent, ...args) => {
                    (this as any)[item.methodName](event, ...args);
                });
            }
        });

        this.frame.on('closed', () => {
            methods.forEach((item: any) => {
                const isWindowIpc = item.type === 'window' || item.type === 'window-on';
                if (isWindowIpc) {
                    const fullChannel = `${prefix}:${item.channel}:${this.id}`;
                    if (item.type === 'window') {
                        ipcMain.removeHandler(fullChannel);
                    } else {
                        ipcMain.removeAllListeners(fullChannel);
                    }
                }
            });
        });
    }

    /**
     * 初始化事件监听
     */
    private _initEventListener() {
        const frame = this.frame
        let timer: ReturnType<typeof setTimeout> | null = null

        const handleSendFrameInfo = () => {
            if (timer) {
                clearTimeout(timer)
            }
            timer = setTimeout(async () => {
                if (frame.isDestroyed()) return
                const frameInfo = this.getWindowInfo()
                this.emit('info', frameInfo)
            }, 100)
        }

        // 窗口显示
        frame.on('show', () => {
            this.emit('show')
        });
        
        // 窗口隐藏
        frame.on('hide', () => {
            this.emit('hide')
        });

        frame.on('resized', handleSendFrameInfo)
        frame.on('move', handleSendFrameInfo)
        frame.on('maximize', handleSendFrameInfo)
        frame.on('unmaximize', handleSendFrameInfo)
        frame.on('restore', handleSendFrameInfo)
    }

    /**
     * 获取窗口信息
     */
    private getWindowInfo() {
        const { x, y, width, height } = this.frame.getBounds()
        const isMaximized   = this.frame.isMaximized()
        const isMinimized   = this.frame.isMinimized()
        const isNormal      = this.frame.isNormal()
        const isResizable   = this.frame.isResizable()
        const isVisible     = this.frame.isVisible()
        return {
            x, 
            y, 
            width, 
            height,
            isNormal,
            isMaximized,
            isMinimized,
            isResizable,
            isVisible
        } as WindowInfo
    }

    /**
     * 触发事件
     * @param event 消息类型
     * @param args 参数
     */
    emit(event: string, ...args: any[]) {
        if (!this.frame.isDestroyed()) {
            this.frame.webContents.send(`win:${ event }`, ...args)
        }
    }

    /**
     * 发送消息
     */
    send(type: string, ...args: any[]) {
        if (!this.frame.isDestroyed()) {
            this.frame.webContents.send(type, ...args)
        }
    }

    /**
     * 设置标题
     */
    setTitle(title: string) {
        if (!this.frame.isDestroyed()) {
            this.frame.setTitle(title)
        }
    }

    /**
     * 打开
     * @param url 页面地址
     */
    async open(url: string) {
        this.url = url;
        this.frame.once('ready-to-show', () => {
            this.frame.center()
            this.frame.show()
            this.frame.focus();
        })
        await this.frame.loadURL(url)
        this.logger.debug(`打开：${ this.url }`)
        return true;
    }

    /**
     * 获取窗口信息
     */
    @IpcWindow('getInfo')
    async getFrameInfo() {
        return this.getWindowInfo()
    }

    
    /**
     * 关闭
     */
    @IpcWindow('close')
    async close() {
        this.frame.close()
        this.logger.debug(`关闭：${ this.url }`)
    }

    /**
     * 销毁
     */
    destroy() {
        this.frame.destroy()
    }

    /**
     * 获窗口标题
     */
    @IpcWindowOn('title')
    getTitle(event: Electron.IpcMainEvent) {
        event.returnValue = this.title
    }

    /**
     * 设置窗口大小、位置
     */
    @IpcWindow('setBounds')
    async setBounds(bounds: Partial<Electron.Rectangle>, animate?: boolean) {
        this.frame.setBounds(bounds, animate)
    }

    /**
     * 设置窗口模式
     */
    @IpcWindow('setMode')
    async setMode(mode: WindowMode) {
        const { frame } = this;
        switch (mode) {
            case 'maximize': 
                frame.maximize();
                break
            case 'minimize': 
                frame.minimize();
                break
            case 'restore': 
                if (frame.isMaximized()) {
                    frame.unmaximize();
                } else if (frame.isMinimized()) {
                    frame.restore();
                }
                break
            case 'unmaximize': 
                if (frame.isMaximizable()) {
                    frame.unmaximize()
                }
                break
        }
    }

    /**
     * 设置窗口是否可见
     */
    @IpcWindow('setVisible')
    async setVisible(visible: boolean) {
        if (visible) {
            this.frame.show()
        } else {
            this.frame.hide()
        }
    }

    /**
     * 锁定或解锁窗口大小
     */
    @IpcWindow('setResizable')
    async setResizable(resizable: boolean) {
        this.frame.setResizable(resizable);
    }

    /**
     * 更新窗口参数
     * @param options
     */
    @IpcWindow('setOptions')
    async setOptions(options: WindowOptions & Record<string, any>) {
        const { frame } = this;
        if (frame.isDestroyed()) return;

        // ==========================================
        // 窗口几何布局
        // ==========================================
        const currentBounds = frame.getBounds();
        const nextBounds: Partial<Electron.Rectangle> = {};
        
        if (options.x !== undefined) nextBounds.x = options.x;
        if (options.y !== undefined) nextBounds.y = options.y;
        if (options.width !== undefined) nextBounds.width = options.width;
        if (options.height !== undefined) nextBounds.height = options.height;

        if (Object.keys(nextBounds).length > 0) {
            frame.setBounds(
                Object.assign({}, currentBounds, nextBounds), 
                options.animate
            );
        }

        // ==========================================
        // 窗口尺寸约束范围调整
        // ==========================================
        if (options.minWidth !== undefined || options.minHeight !== undefined) {
            const currentMin = frame.getMinimumSize();
            frame.setMinimumSize(
                options.minWidth !== undefined ? options.minWidth : currentMin[0],
                options.minHeight !== undefined ? options.minHeight : currentMin[1]
            );
        }
        if (options.maxWidth !== undefined || options.maxHeight !== undefined) {
            const currentMax = frame.getMaximumSize();
            frame.setMaximumSize(
                options.maxWidth !== undefined ? options.maxWidth : currentMax[0],
                options.maxHeight !== undefined ? options.maxHeight : currentMax[1]
            );
        }

        // ==========================================
        // 基础行为与核心权限特征控制
        // ==========================================
        if (options.resizable !== undefined)     frame.setResizable(options.resizable);
        if (options.movable !== undefined)       frame.setMovable(options.movable);
        if (options.minimizable !== undefined)   frame.setMinimizable(options.minimizable);
        if (options.maximizable !== undefined)   frame.setMaximizable(options.maximizable);
        if (options.closable !== undefined)      frame.setClosable(options.closable);
        if (options.focusable !== undefined)     frame.setFocusable(options.focusable);

        // ==========================================
        // 全屏、置顶、视窗状态控制
        // ==========================================
        if (options.fullscreen !== undefined) {
            frame.setFullScreen(options.fullscreen);
        }
        if (options.kiosk !== undefined) {
            frame.setKiosk(options.kiosk);
        }
        if (options.center === true) {
            frame.center();
        }

        // ==========================================
        // 外观样式与视觉属性设置
        // ==========================================
        if (options.title !== undefined)         frame.setTitle(options.title);
        if (options.opacity !== undefined)       frame.setOpacity(options.opacity);
        if (options.hasShadow !== undefined)     frame.setHasShadow(options.hasShadow);
        if (options.backgroundColor !== undefined) {
            frame.setBackgroundColor(options.backgroundColor);
        }
        if (options.aspectRatio !== undefined) {
            frame.setAspectRatio(options.aspectRatio, options.aspectRatioExtraSize || { width: 0, height: 0 });
        }

        // ==========================================
        // 桌面系统/任务栏深度交互特性
        // ==========================================
        if (options.skipTaskbar !== undefined) {
            frame.setSkipTaskbar(options.skipTaskbar);
        }
        if (options.progressBar !== undefined) {
            if (typeof options.progressBar === 'number') {
                frame.setProgressBar(options.progressBar);
            } else if (options.progressBar && typeof options.progressBar.progress === 'number') {
                frame.setProgressBar(options.progressBar.progress, options.progressBar.options);
            }
        }
        if (options.flashFrame !== undefined) {
            // 任务栏高亮跳动/闪烁提醒
            frame.flashFrame(options.flashFrame);
        }
        if (options.autoHideMenuBar !== undefined) {
            frame.setAutoHideMenuBar(options.autoHideMenuBar);
            frame.setMenuBarVisibility(!options.autoHideMenuBar);
        }
        if (options.contentProtection !== undefined) {
            // 防御应用敏感页面防录屏、防截屏能力
            frame.setContentProtection(options.contentProtection);
        }

        this.logger.debug(`窗口池借出窗口 [ID: ${this.id}] 官方通用属性已动态重刷完毕。`);
    }
}



/**
 * 全局单例同步获取当前窗口ID
 */
ipcMain.on('win:getWindowId', (event) => {
    event.returnValue = event.sender.id;
});