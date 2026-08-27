"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerFactory = void 0;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const console_1 = require("./transports/console");
const file_1 = require("./transports/file");
const logger_1 = require("./logger");
const util_1 = require("util");
class LoggerFactory {
    transport;
    level;
    loggers = new Map();
    constructor(options) {
        if (!electron_1.app.isPackaged) {
            this.level = options.consoleLevel ?? 'DEBUG';
            this.transport = new console_1.ConsoleTransport();
            return;
        }
        this.level = options.level;
        const filePath = path_1.default.join(options.filePath, 'logs');
        this.transport = new file_1.FileTransport(filePath, options.name ?? 'app');
    }
    /**
     * 获取日志
     */
    getLogger(context = 'app') {
        let logger = this.loggers.get(context);
        if (logger) {
            return logger;
        }
        logger = new logger_1.Logger(this.transport, this.level, context);
        this.loggers.set(context, logger);
        return logger;
    }
    [util_1.inspect.custom]() {
        return `<${this.constructor.name}>`;
    }
}
exports.LoggerFactory = LoggerFactory;
