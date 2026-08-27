
import type { Application } from "./Application";
import type { Logger } from "../libs";
import { inspect } from "util";
import { randomBytes } from "crypto";


const BASE_CONTEXT_LOGGER = Symbol('BaseContextClass#logger')

export class BaseContextClass {
    /** 唯一ID */
    readonly uid = randomBytes(8).toString('hex')

    /**
     * 应用管理中心
     */
    readonly app: Application

    /**
     * 应用上下文类
     * @param app 应用实例
     */
    constructor(app: Application) {
        this.app = app
    }
    /**
     * 应用即将启动
    */
    public willStart(): Promise<void> | void {}
    /** 
     * 启用启动完成
     */
    public didStart(): Promise<void> | void {}

    /**
     * 应用配置
     */
    protected get config() {
        return this.app.config
    }
    /** 
     * 获取服务
     */
    protected get service() {
        return this.app.service
    }
    /** 
     * 上下文日志
     */
    protected get logger(): Logger {
        if (!this[BASE_CONTEXT_LOGGER]) {
            const loggerName = this.constructor.name
            this[BASE_CONTEXT_LOGGER] = this.app.createLogger(loggerName)
        }
        return this[BASE_CONTEXT_LOGGER]
    }

    [inspect.custom]() {
        return `<${this.constructor.name} extends BaseContextClass>`;
    }
    
}