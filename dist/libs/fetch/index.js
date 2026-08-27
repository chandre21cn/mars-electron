"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = void 0;
const ofetch_1 = require("ofetch");
const utils_1 = require("../../utils");
const FETCH_LOGGER = Symbol("Fetch#logger");
const HTTP_REQUEST = Symbol("Fetch#request");
class Fetch {
    constructor(app) {
        this.app = app;
    }
    /**
     * 应用管理中心
     */
    app;
    // 日志
    get logger() {
        if (!this[FETCH_LOGGER]) {
            const loggerName = this.constructor.name;
            this[FETCH_LOGGER] = this.app.createLogger(loggerName);
        }
        return this[FETCH_LOGGER];
    }
    /**
     * 网络请求
     */
    get request() {
        if (!this[HTTP_REQUEST]) {
            const { baseURL, bundleName } = this.app.config;
            const $ofetch = ofetch_1.ofetch.create({
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
                    this.logger.debug(`${ctx.options.method} => ${ctx.request}`);
                },
                onRequestError: ({ error }) => {
                    this.logger.error(error.message);
                    throw new utils_1.CreateError(`服务器访问失败，请检测网络`);
                },
            });
            this[HTTP_REQUEST] = $ofetch;
        }
        return this[HTTP_REQUEST];
    }
}
exports.Fetch = Fetch;
