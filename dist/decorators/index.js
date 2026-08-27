"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_METHOD_METADATA = exports.IPC_MODULE_METADATA = void 0;
exports.Ipc = Ipc;
exports.IpcHandle = IpcHandle;
exports.IpcHandleWrapper = IpcHandleWrapper;
exports.IpcOn = IpcOn;
exports.IpcWindow = IpcWindow;
exports.IpcWindowOn = IpcWindowOn;
require("reflect-metadata");
exports.IPC_MODULE_METADATA = Symbol('IpcModuleMetadata');
exports.IPC_METHOD_METADATA = Symbol('IpcMethodMetadata');
/**
 * Ipc注册
 * @param prefix 前缀
 */
function Ipc(prefix) {
    return (target) => {
        Reflect.defineMetadata(exports.IPC_MODULE_METADATA, prefix, target);
    };
}
/**
 * 全局方法调用
 */
function IpcHandle(channel) {
    return (target, propertyKey, descriptor) => {
        const list = Reflect.getMetadata(exports.IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'handle', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(exports.IPC_METHOD_METADATA, list, target.constructor);
        return descriptor;
    };
}
/**
 * 全局方法调用包装
 */
function IpcHandleWrapper(channel) {
    return (target, propertyKey, descriptor) => {
        const list = Reflect.getMetadata(exports.IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'handle', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(exports.IPC_METHOD_METADATA, list, target.constructor);
        const originalMethod = descriptor.value;
        if (typeof originalMethod === 'function') {
            descriptor.value = async function (...args) {
                try {
                    const result = await originalMethod.apply(this, args);
                    return {
                        success: result,
                        error: null
                    };
                }
                catch (error) {
                    return {
                        success: null,
                        error: {
                            code: error?.code ?? 400,
                            message: error?.message ?? 'Unknown Error'
                        }
                    };
                }
            };
        }
        return descriptor;
    };
}
/**
 * 全局事件监听
 */
function IpcOn(channel) {
    return (target, propertyKey, descriptor) => {
        const list = Reflect.getMetadata(exports.IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'on', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(exports.IPC_METHOD_METADATA, list, target.constructor);
        return descriptor;
    };
}
/**
 * 处理窗口一对一绑定
 */
function IpcWindow(channel) {
    return (target, propertyKey, descriptor) => {
        const list = Reflect.getMetadata(exports.IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'window', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(exports.IPC_METHOD_METADATA, list, target.constructor);
        const originalMethod = descriptor.value;
        if (typeof originalMethod === 'function') {
            descriptor.value = async function (...args) {
                try {
                    const result = await originalMethod.apply(this, args);
                    return {
                        success: result !== undefined ? result : true,
                        error: null
                    };
                }
                catch (error) {
                    return {
                        success: null,
                        error: {
                            code: error?.code ?? 500,
                            message: error?.message ?? 'Window IPC Execution Error'
                        }
                    };
                }
            };
        }
        return descriptor;
    };
}
/**
 * 窗口事件监听
 */
function IpcWindowOn(channel) {
    return (target, propertyKey, descriptor) => {
        const list = Reflect.getMetadata(exports.IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'window-on', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(exports.IPC_METHOD_METADATA, list, target.constructor);
        return descriptor;
    };
}
