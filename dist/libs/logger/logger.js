"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevelValue = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const node_util_1 = require("node:util");
const util_1 = require("util");
// 日志级别对应的数值，用于过滤
exports.LogLevelValue = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};
class Logger {
    transport;
    minLevelValue;
    context;
    constructor(transport, level, context = 'app') {
        this.transport = transport;
        this.minLevelValue = exports.LogLevelValue[level];
        this.context = context;
    }
    /**
     * 格式化消息
     */
    formatMessage(level, ...args) {
        const message = (0, node_util_1.format)(...args);
        const timestamp = (0, dayjs_1.default)().format("YYYY-MM-DD HH:mm:ss,SSS");
        return `${timestamp} ${level} [${this.context}] ${message}`;
    }
    /**
     * 日志
     */
    log(level, ...args) {
        if (exports.LogLevelValue[level] < this.minLevelValue) {
            return;
        }
        const message = this.formatMessage(level, ...args);
        this.transport.log(level, message);
    }
    debug(...args) {
        this.log('DEBUG', ...args);
    }
    info(...args) {
        this.log('INFO', ...args);
    }
    warn(...args) {
        this.log('WARN', ...args);
    }
    error(...args) {
        this.log('ERROR', ...args);
    }
    [util_1.inspect.custom]() {
        return `<${this.constructor.name}>`;
    }
}
exports.Logger = Logger;
