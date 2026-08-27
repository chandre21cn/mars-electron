import path from 'path'
import { app } from 'electron';
import { ConsoleTransport } from "./transports/console";
import { FileTransport } from "./transports/file";
import { Logger } from "./logger";

import type { LoggerConfig, LoggerTransport, LogLevel } from './interface'
import { inspect } from 'util';

export class LoggerFactory {

    private readonly transport: LoggerTransport
    private readonly level: LogLevel
    private readonly loggers: Map<string, Logger> = new Map()

    constructor(options: LoggerConfig) {
        if (!app.isPackaged) {
            this.level = options.consoleLevel ?? 'DEBUG'
            this.transport = new ConsoleTransport()
            return
        }

        this.level = options.level
        const filePath = path.join(options.filePath, 'logs')
        this.transport = new FileTransport(filePath, options.name ?? 'app')
    }

    /**
     * 获取日志
     */
    getLogger(context:string = 'app') {
        let logger = this.loggers.get(context)
        if (logger) {
            return logger
        }
        logger = new Logger(this.transport, this.level, context)
        this.loggers.set(context, logger)
        return logger
    }

    [inspect.custom]() {
        return `<${this.constructor.name}>`;
    }

}