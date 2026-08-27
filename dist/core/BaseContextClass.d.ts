import type { Application } from "./Application";
import type { Logger } from "../libs";
import { inspect } from "util";
export declare class BaseContextClass {
    /** 唯一ID */
    readonly uid: string;
    /**
     * 应用管理中心
     */
    readonly app: Application;
    /**
     * 应用上下文类
     * @param app 应用实例
     */
    constructor(app: Application);
    /**
     * 应用即将启动
    */
    willStart(): Promise<void> | void;
    /**
     * 启用启动完成
     */
    didStart(): Promise<void> | void;
    /**
     * 应用配置
     */
    protected get config(): import("..").ApplicationConfig;
    /**
     * 获取服务
     */
    protected get service(): import("..").IService;
    /**
     * 上下文日志
     */
    protected get logger(): Logger;
    [inspect.custom](): string;
}
