import 'reflect-metadata';
export declare const IPC_MODULE_METADATA: unique symbol;
export declare const IPC_METHOD_METADATA: unique symbol;
/**
 * Ipc注册
 * @param prefix 前缀
 */
export declare function Ipc(prefix: string): ClassDecorator;
/**
 * 全局方法调用
 */
export declare function IpcHandle(channel?: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 全局方法调用包装
 */
export declare function IpcHandleWrapper(channel?: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 全局事件监听
 */
export declare function IpcOn(channel?: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 处理窗口一对一绑定
 */
export declare function IpcWindow(channel?: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 窗口事件监听
 */
export declare function IpcWindowOn(channel?: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
