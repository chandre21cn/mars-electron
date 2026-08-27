import { app } from 'electron'
import { Controller } from "./Controller";
import { Service } from "./Service";
import { Store, Fetch, Logger, LoggerFactory } from "../libs";
import type { ApplicationConfig, ControllerClass, IController, IService, ServiceClass } from "../interface";


const APPLICATION_FETCH             = Symbol('Application.fetch')
const APPLICATION_STORE             = Symbol('Application.store')
const APPLICATION_SERVICE           = Symbol('Application.service')
const APPLICATION_CONTROLLER        = Symbol('Application.controller')
const APPLICATION_LOGGER_FACTORY    = Symbol('Application#loggerFactory')
const APPLICATION_LOGGER            = Symbol('Application#logger')


export class Application {

    /** 应用配置 */
    readonly config: ApplicationConfig
    /** 服务实例 */
    private readonly serviceInstance    = new Map<string, Service>()
    /** 控制器实例 */
    private readonly controllerInstance = new Map<string, Controller>()

    constructor(config: ApplicationConfig) {
        this.config = config
    }

    /** 日志工厂 */
    private get loggerFactory(): LoggerFactory {
        if (!this[APPLICATION_LOGGER_FACTORY]) {
            this[APPLICATION_LOGGER_FACTORY] = new LoggerFactory(this.config.logger)
        }
        return this[APPLICATION_LOGGER_FACTORY]
    }

    /** 应用层日志 */
    get logger(): Logger {
        if (!this[APPLICATION_LOGGER]) {
            const loggerName = this.constructor.name
            this[APPLICATION_LOGGER] = this.createLogger(loggerName)
        }
        return this[APPLICATION_LOGGER]
    }

    /** 数据状态 */
    get store(): Store {
        if (!this[APPLICATION_STORE]) {
            this[APPLICATION_STORE] = new Store(this.config.store)
        }
        return this[APPLICATION_STORE]
    }

    /** 网络请求 */
    get fetch(): Fetch {
        if (!this[APPLICATION_FETCH]) {
            this[APPLICATION_FETCH] = new Fetch(this)
        }
        return this[APPLICATION_FETCH]
    }

    /** 服务 */
    get service(): IService {
        if (!this[APPLICATION_SERVICE]) {
            this[APPLICATION_SERVICE] = new Proxy({}, {
                get: (_, attr: string | symbol) => {
                    if (typeof attr !== 'string') {
                        return undefined
                    }
                    const instance = this.serviceInstance.get(attr);
                    if (!instance) {
                        this.logger.debug(`服务 ${ attr } 不存在`)
                    }
                    return instance;
                }
            })
        }
        return this[APPLICATION_SERVICE]
    }

    /** 控制器 */
    get controller(): IController {
        if (!this[APPLICATION_CONTROLLER]) {
            this[APPLICATION_CONTROLLER] = new Proxy({}, {
                get: (_, attr: string | symbol) => {
                    if (typeof attr !== 'string') {
                        return undefined
                    }
                    const instance = this.controllerInstance.get(attr);
                    if (!instance) {
                        this.logger.debug(`控制器 ${ attr } 不存在`)
                    }
                    return instance;
                }
            })
        }
        return this[APPLICATION_CONTROLLER]
    }

    /** 创建日志 */
    createLogger(loggerName: string): Logger {
        return this.loggerFactory.getLogger(loggerName)
    }

    /** 注册服务 */
    useService<T extends Service>(serviceName: string | ServiceClass<T>, serviceClazz?: ServiceClass<T>) {
        if (typeof serviceName !== 'string') {
            serviceClazz = serviceName
            serviceName = serviceClazz.name
        }
        if (this.serviceInstance.has(serviceName)) {
            throw new Error(`服务 ${ serviceName } 已注册`)
        }
        const instance = new serviceClazz!(this)
        this.serviceInstance.set(serviceName, instance)
        return this;
    }

    /** 注册控制器 */
    useController<T extends Controller>(controllerName: string | ControllerClass<T>, controllerClazz?: ControllerClass<T>) {
        if (typeof controllerName !== 'string') {
            controllerClazz = controllerName
            controllerName = controllerClazz.name
        }
        if (this.controllerInstance.has(controllerName)) {
            throw new Error(`控制器 ${ controllerName } 已注册`)
        }
        const instance = new controllerClazz!(this)
        this.controllerInstance.set(controllerName, instance)
        return this;
    }

    /**
     * 退出
     */
    exit() {
        this.logger.info(`应用退出`)
        app.quit()
    }
    
    /**
     * 启动
     */
    async start() {
        const { bundleIdentifier, bundleName } = this.config
        app.setAppUserModelId(bundleIdentifier)
        app.setName(bundleName)
        this.logger.info(`启动中...`)

        // 前置处理
        for (const [_, service] of this.serviceInstance.entries()) {
            await service.willStart()
        }
        for (const [_, controller] of this.controllerInstance.entries()) {
            await controller.willStart()
        }

        // 等待应用准备就绪
        await app.whenReady()

        this.logger.info(`准备就绪`)

        // 后置处理
        for (const [_, service] of this.serviceInstance.entries()) {
            await service.didStart()
        }
        for (const [_, controller] of this.controllerInstance.entries()) {
            await controller.didStart()
        }

        this.logger.info(`启动成功`)
    }

}