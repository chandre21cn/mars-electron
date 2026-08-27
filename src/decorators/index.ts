import 'reflect-metadata';

export const IPC_MODULE_METADATA = Symbol('IpcModuleMetadata');
export const IPC_METHOD_METADATA = Symbol('IpcMethodMetadata');

/**
 * Ipc注册
 * @param prefix 前缀
 */
export function Ipc(prefix: string): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(IPC_MODULE_METADATA, prefix, target);
    };
}

/**
 * 全局方法调用
 */
export function IpcHandle(channel?: string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const list = Reflect.getMetadata(IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);

        list.push({ type: 'handle', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(IPC_METHOD_METADATA, list, target.constructor);
        
        return descriptor;
    };
}


/**
 * 全局方法调用包装
 */
export function IpcHandleWrapper(channel?: string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const list = Reflect.getMetadata(IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);

        list.push({ type: 'handle', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(IPC_METHOD_METADATA, list, target.constructor);
        
        const originalMethod = descriptor.value;
        if (typeof originalMethod === 'function') {
            descriptor.value = async function (this: any, ...args: any[]) {
                try {
                    const result = await originalMethod.apply(this, args);
                    return {
                        success: result,
                        error: null
                    };
                } catch (error: any) {
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
export function IpcOn(channel?: string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const list = Reflect.getMetadata(IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);
        list.push({ type: 'on', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(IPC_METHOD_METADATA, list, target.constructor);
        return descriptor;
    };
}


/**
 * 处理窗口一对一绑定
 */
export function IpcWindow(channel?: string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const list = Reflect.getMetadata(IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);

        list.push({ type: 'window', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(IPC_METHOD_METADATA, list, target.constructor);

        const originalMethod = descriptor.value;
        if (typeof originalMethod === 'function') {
            descriptor.value = async function (this: any, ...args: any[]) {
                try {
                    const result = await originalMethod.apply(this, args);
                    return {
                        success: result !== undefined ? result : true,
                        error: null
                    };
                } catch (error: any) {
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
export function IpcWindowOn(channel?: string) {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const list = Reflect.getMetadata(IPC_METHOD_METADATA, target.constructor) || [];
        const finalChannel = channel || String(propertyKey);

        list.push({ type: 'window-on', channel: finalChannel, methodName: propertyKey });
        Reflect.defineMetadata(IPC_METHOD_METADATA, list, target.constructor);
        
        return descriptor;
    };
}