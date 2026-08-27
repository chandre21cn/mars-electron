import { ipcMain } from "electron";
import { IPC_MODULE_METADATA, IPC_METHOD_METADATA } from '../decorators'
import { BaseContextClass } from "./BaseContextClass";
import type { Application } from "./Application";

export class Controller extends BaseContextClass {

    constructor(app: Application) {
        super(app)
        this._registerIpcListeners()
    }
    
    /**
     * 注册 IPC 监听器
     */
    private _registerIpcListeners() {
        const ControllerClass = this.constructor;
        const prefix    = Reflect.getMetadata(IPC_MODULE_METADATA, ControllerClass) || "";
        const methods   = Reflect.getMetadata(IPC_METHOD_METADATA, ControllerClass) || [];

        for (const item of methods) {
            const methodBound = (this as any)[item.methodName].bind(this);
            const fullChannel = prefix ? `${prefix}:${item.channel}` : item.channel;

            if (item.type === 'handle') {
                ipcMain.handle(fullChannel, methodBound);
            } else if (item.type === 'on') {
                ipcMain.on(fullChannel, methodBound);
            }
        }
    }

    /** 
     * 获取控制器
     */
    protected get controller() {
        return this.app.controller
    }
}