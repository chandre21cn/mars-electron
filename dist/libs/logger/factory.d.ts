import { Logger } from "./logger";
import type { LoggerConfig } from './interface';
import { inspect } from 'util';
export declare class LoggerFactory {
    private readonly transport;
    private readonly level;
    private readonly loggers;
    constructor(options: LoggerConfig);
    /**
     * 获取日志
     */
    getLogger(context?: string): Logger;
    [inspect.custom](): string;
}
