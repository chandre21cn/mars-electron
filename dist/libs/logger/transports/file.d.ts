import type { LoggerTransport, LogLevel } from "../interface";
export declare class FileTransport implements LoggerTransport {
    private readonly filePath;
    private readonly appName;
    private writer?;
    private maxDays;
    constructor(filePath: string, appName: string);
    /**
     * 删除过期的日志文件（7天前）
     */
    private deleteExpiredFile;
    /**
     * 定时任务：每天 0 点切换文件
     */
    private initSchedule;
    /**
     * 处理进程关闭，保存日志后再退出
     */
    private onProcessClose;
    /**
     * 创建写入流
     */
    private createWriter;
    /**
     * 写入日志
     */
    log(_: LogLevel, message: string): void;
}
