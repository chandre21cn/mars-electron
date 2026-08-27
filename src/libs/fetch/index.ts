import { $Fetch, ofetch } from "ofetch";
import { Application } from "../../core";
import { Logger } from '../logger';
import { CreateError } from '../../utils';

const FETCH_LOGGER = Symbol("Fetch#logger")
const HTTP_REQUEST = Symbol("Fetch#request")

export class Fetch {

    constructor(app: Application) {
        this.app = app
    }

    /**
     * 应用管理中心
     */
    readonly app: Application

    // 日志
    get logger(): Logger {
        if (!this[FETCH_LOGGER]) {
            const loggerName = this.constructor.name
            this[FETCH_LOGGER] = this.app.createLogger(loggerName)
        }
        return this[FETCH_LOGGER]
    }

    /**
     * 网络请求
     */
    get request(): $Fetch {
        if (!this[HTTP_REQUEST]) {
            const { baseURL, bundleName } = this.app.config
            const $ofetch = ofetch.create({
                baseURL,
                method: 'POST',
                headers: {
                    "User-Agent": bundleName,
                },
                responseType: 'json',
                timeout: 10000,
                retry: 0,
                retryDelay: 100,
                retryStatusCodes: [],
                onRequest: (ctx) => {
                    this.logger.debug(`${ ctx.options.method } => ${ ctx.request }`)
                },
                onRequestError: ({ error }) => {
                    this.logger.error(error.message)
                    throw new CreateError(`服务器访问失败，请检测网络`)
                },
            }) 
            this[HTTP_REQUEST] = $ofetch
        }
        return this[HTTP_REQUEST]
    }

}