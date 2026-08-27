import { Controller } from "./Controller";
import { Service } from "./Service";
import { Store, Fetch, Logger } from "../libs";
import type { ApplicationConfig, ControllerClass, IController, IService, ServiceClass } from "../interface";
export declare class Application {
    /** 应用配置 */
    readonly config: ApplicationConfig;
    /** 服务实例 */
    private readonly serviceInstance;
    /** 控制器实例 */
    private readonly controllerInstance;
    constructor(config: ApplicationConfig);
    /** 日志工厂 */
    private get loggerFactory();
    /** 应用层日志 */
    get logger(): Logger;
    /** 数据状态 */
    get store(): Store;
    /** 网络请求 */
    get fetch(): Fetch;
    /** 服务 */
    get service(): IService;
    /** 控制器 */
    get controller(): IController;
    /** 创建日志 */
    createLogger(loggerName: string): Logger;
    /** 注册服务 */
    useService<T extends Service>(serviceName: string | ServiceClass<T>, serviceClazz?: ServiceClass<T>): this;
    /** 注册控制器 */
    useController<T extends Controller>(controllerName: string | ControllerClass<T>, controllerClazz?: ControllerClass<T>): this;
    /**
     * 退出
     */
    exit(): void;
    /**
     * 启动
     */
    start(): Promise<void>;
}
