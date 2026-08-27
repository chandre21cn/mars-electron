import dayjs from "dayjs";
import { format as utilFormat } from 'node:util';
import type { LoggerTransport, LogLevel } from './interface'
import { inspect } from 'util'

// 日志级别对应的数值，用于过滤
export const LogLevelValue: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

export class Logger {
    private transport: LoggerTransport
    private minLevelValue: number
    private context: string

    constructor(transport: LoggerTransport, level: LogLevel, context: string = 'app') {
        this.transport = transport
        this.minLevelValue = LogLevelValue[level]
        this.context = context
    }

    /**
     * 格式化消息
     */
    private formatMessage(level: LogLevel, ...args: any[]) {
        const message = utilFormat(...args)
        const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss,SSS")
        return `${timestamp} ${level} [${this.context}] ${message}`
    }

    /**
     * 日志
     */
    private log(level: LogLevel, ...args: any[]) {
        if (LogLevelValue[level] < this.minLevelValue) {
            return
        }
        const message = this.formatMessage(level, ...args)
        this.transport.log(level, message)
    }

    debug(...args: any[]) {
        this.log('DEBUG', ...args)
    }

    info(...args: any[]) {
        this.log('INFO', ...args)
    }

    warn(...args: any[]) {
        this.log('WARN', ...args)
    }

    error(...args: any[]) {
        this.log('ERROR', ...args)
    }

    [inspect.custom]() {
        return `<${this.constructor.name}>`;
    }


}