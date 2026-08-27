"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const electron_1 = require("electron");
const decorators_1 = require("../decorators");
const BaseContextClass_1 = require("./BaseContextClass");
class Controller extends BaseContextClass_1.BaseContextClass {
    constructor(app) {
        super(app);
        this._registerIpcListeners();
    }
    /**
     * 注册 IPC 监听器
     */
    _registerIpcListeners() {
        const ControllerClass = this.constructor;
        const prefix = Reflect.getMetadata(decorators_1.IPC_MODULE_METADATA, ControllerClass) || "";
        const methods = Reflect.getMetadata(decorators_1.IPC_METHOD_METADATA, ControllerClass) || [];
        for (const item of methods) {
            const methodBound = this[item.methodName].bind(this);
            const fullChannel = prefix ? `${prefix}:${item.channel}` : item.channel;
            if (item.type === 'handle') {
                electron_1.ipcMain.handle(fullChannel, methodBound);
            }
            else if (item.type === 'on') {
                electron_1.ipcMain.on(fullChannel, methodBound);
            }
        }
    }
    /**
     * 获取控制器
     */
    get controller() {
        return this.app.controller;
    }
}
exports.Controller = Controller;
