import { BaseContextClass } from "./BaseContextClass";
import type { Application } from "./Application";
export declare class Controller extends BaseContextClass {
    constructor(app: Application);
    /**
     * 注册 IPC 监听器
     */
    private _registerIpcListeners;
    /**
     * 获取控制器
     */
    protected get controller(): import("..").IController;
}
