import type { Application, BaseWindow, Controller, Service } from "../core";
import type { LoggerConfig } from "../libs/logger";
import { StoreOptions } from "../libs/store";
export type PlainObject<T = any> = {
    [key: string]: T;
};
export interface IService extends PlainObject {
}
export interface IController extends PlainObject {
}
export interface IWindow extends PlainObject {
}
export type ServiceClass<T extends Service> = {
    new (app: Application): T;
};
export type ControllerClass<T extends Controller> = {
    new (app: Application): T;
};
export type WindowClass<T extends BaseWindow> = {
    new (app: Application): T;
};
export type WindowName = Extract<keyof IWindow, string>;
export type WindowOptions = Electron.BrowserWindowConstructorOptions;
export type WindowState = 'idle' | 'loading' | 'hide' | 'show' | 'close' | 'destroy';
export type WindowMode = 'maximize' | 'minimize' | 'restore' | 'unmaximize';
export type WindowInfo = {
    x: number;
    y: number;
    width: number;
    height: number;
    isNormal: boolean;
    isMaximized: boolean;
    isMinimized: boolean;
    isResizable: boolean;
    isVisible: boolean;
};
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
