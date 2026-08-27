import { BrowserWindow } from 'electron';
import { inspect } from 'util';
import type { Application } from ".";
import type { WindowInfo, WindowMode, WindowOptions } from "../interface";
import type { Logger } from '../libs';
export declare class BaseWindow {
    private readonly app;
    private url;
    private readonly winId;
    readonly frame: BrowserWindow;
    /**
     * 初始化窗口
     * @param app 应用实例
     * @param options 窗口配置选项
     */
    constructor(app: Application, options?: WindowOptions);
    [inspect.custom](): string;
    get id(): number;
    get title(): string;
    /**
     * 应用配置
     */
    private get config();
    /**
     * 是否关闭
     */
    get isClosed(): boolean;
    /**
     * 是否销毁
     */
    get isDestroyed(): boolean;
    /**
     * 上下文日志
     */
    protected get logger(): Logger;
    /**
     * 注册 IPC 监听器
     */
    private _registerIpcListeners;
    /**
     * 初始化事件监听
     */
    private _initEventListener;
    /**
     * 获取窗口信息
     */
    private getWindowInfo;
    /**
     * 触发事件
     * @param event 消息类型
     * @param args 参数
     */
    emit(event: string, ...args: any[]): void;
    /**
     * 发送消息
     */
    send(type: string, ...args: any[]): void;
    /**
     * 设置标题
     */
    setTitle(title: string): void;
    /**
     * 打开
     * @param url 页面地址
     */
    open(url: string): Promise<boolean>;
    /**
     * 获取窗口信息
     */
    getFrameInfo(): Promise<WindowInfo>;
    /**
     * 关闭
     */
    close(): Promise<void>;
    /**
     * 销毁
     */
    destroy(): void;
    /**
     * 获窗口标题
     */
    getTitle(event: Electron.IpcMainEvent): void;
    /**
     * 设置窗口大小、位置
     */
    setBounds(bounds: Partial<Electron.Rectangle>, animate?: boolean): Promise<void>;
    /**
     * 设置窗口模式
     */
    setMode(mode: WindowMode): Promise<void>;
    /**
     * 设置窗口是否可见
     */
    setVisible(visible: boolean): Promise<void>;
    /**
     * 锁定或解锁窗口大小
     */
    setResizable(resizable: boolean): Promise<void>;
    /**
     * 更新窗口参数
     * @param options
     */
    setOptions(options: WindowOptions & Record<string, any>): Promise<void>;
}
