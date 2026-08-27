// 日志级别
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LoggerConfig {
    name: string
    filePath: string
    level: LogLevel
    consoleLevel: LogLevel
}

export interface LoggerFactoryOptions {
    /** 日志级别，低于该级别的日志将不会被输出 */
    level?: LogLevel;
    /** 应用名称，用于生产环境日志文件名前缀 */
    appName?: string;
    /** 生产环境日志文件存放目录 */
    logPath?: string;
}


export interface LoggerTransport {
    log(level: LogLevel, message: string): void
}