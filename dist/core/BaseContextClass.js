"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseContextClass = void 0;
const util_1 = require("util");
const crypto_1 = require("crypto");
const BASE_CONTEXT_LOGGER = Symbol('BaseContextClass#logger');
class BaseContextClass {
    /** 唯一ID */
    uid = (0, crypto_1.randomBytes)(8).toString('hex');
    /**
     * 应用管理中心
     */
    app;
    /**
     * 应用上下文类
     * @param app 应用实例
     */
    constructor(app) {
        this.app = app;
    }
    /**
     * 应用即将启动
    */
    willStart() { }
    /**
     * 启用启动完成
     */
    didStart() { }
    /**
     * 应用配置
     */
    get config() {
        return this.app.config;
    }
    /**
     * 获取服务
     */
    get service() {
        return this.app.service;
    }
    /**
     * 上下文日志
     */
    get logger() {
        if (!this[BASE_CONTEXT_LOGGER]) {
            const loggerName = this.constructor.name;
            this[BASE_CONTEXT_LOGGER] = this.app.createLogger(loggerName);
        }
        return this[BASE_CONTEXT_LOGGER];
    }
    [util_1.inspect.custom]() {
        return `<${this.constructor.name} extends BaseContextClass>`;
    }
}
exports.BaseContextClass = BaseContextClass;
