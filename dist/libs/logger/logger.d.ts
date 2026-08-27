import type { LoggerTransport, LogLevel } from './interface';
import { inspect } from 'util';
export declare const LogLevelValue: Record<LogLevel, number>;
export declare class Logger {
    private transport;
    private minLevelValue;
    private context;
    constructor(transport: LoggerTransport, level: LogLevel, context?: string);
    /**
     * 格式化消息
     */
    private formatMessage;
    /**
     * 日志
     */
    private log;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    [inspect.custom](): string;
}
