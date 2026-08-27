import type { Application, BaseWindow, Controller, Service } from "../core";
import type { LoggerConfig } from "../libs/logger";
import { StoreOptions } from "../libs/store";

export type PlainObject<T = any> = { [key: string]: T }
export interface IService extends PlainObject {}
export interface IController extends PlainObject {}
export interface IWindow extends PlainObject {}

export type ServiceClass<T extends Service> = {
    new (app: Application): T
}
export type ControllerClass<T extends Controller> = {
    new (app: Application): T
}
export type WindowClass<T extends BaseWindow> = {
    new (app: Application): T
}

export type WindowName      = Extract<keyof IWindow, string>;
export type WindowOptions   = Electron.BrowserWindowConstructorOptions
export type WindowState     = 'idle' | 'loading' | 'hide' | 'show' |  'close' | 'destroy'
export type WindowMode      = 'maximize' | 'minimize' | 'restore' | 'unmaximize'

export type WindowInfo      = {
    // 窗口 X轴 顶点坐标
    x: number;
    // 窗口 Y轴 顶点坐标
    y: number;
    // 窗口宽度
    width: number;
    // 窗口高度
    height: number;
    // 窗口当前是否正常大小
    isNormal: boolean;
    // 窗口当前是否已经处于最大化状态
    isMaximized: boolean;
    // 窗口当前是否已经处于最小化状态
    isMinimized: boolean;
    // 窗口当前是否锁定小大
    isResizable: boolean;
    // 窗口是否可见
    isVisible: boolean;
}

export interface ApplicationConfig {
    /** 应用唯一标识 */
    bundleIdentifier: string;
    /** 应用包名 */
    bundleName: string;
    /** 数据状态 */
    store: StoreOptions;
    /** 窗口默认配置 */
    window: WindowOptions;
    /** 日志配置 */
    logger: LoggerConfig;
    /** HTTP */
    baseURL?: string;
    /** WS */
    wsURL?: string;
}


