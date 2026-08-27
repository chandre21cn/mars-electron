import fs from 'fs-extra'
import dayjs from "dayjs";
import path from "path";
import cron from 'node-cron'
import type { LoggerTransport, LogLevel } from "../interface";
import { app } from 'electron';


export class FileTransport implements LoggerTransport {

    private readonly filePath: string;
    private readonly appName: string;
    private writer?: fs.WriteStream
    private maxDays: number = 7

    constructor(filePath: string, appName: string) {
        this.filePath = filePath
        this.appName = appName
        
        // 创建文件目录
        fs.ensureDirSync(this.filePath)
        // 监听进程关闭
        this.onProcessClose()
        // 删除过期日志
        this.deleteExpiredFile()
        // 定时任务
        this.initSchedule()
    }

    /**
     * 删除过期的日志文件（7天前）
     */
    private async deleteExpiredFile() {
        try {
            const files = await fs.readdir(this.filePath, { withFileTypes: true })
            const expiryTime = dayjs().subtract(this.maxDays, 'day').startOf('day')

            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.log') ) {
                    const filepath = path.join(this.filePath, file.name)

                    const fileState = await fs.stat(filepath)
                    if (expiryTime.isAfter(fileState.mtime)) {
                        await fs.unlink(filepath)
                    }
                }
            }
        } catch(error) {
            console.error(error)
        }
    }


    /**
     * 定时任务：每天 0 点切换文件
     */
    private initSchedule() {
        cron.schedule("0 0 * * *", () => {
            const nextWriter = this.createWriter()
            const oldWriter = this.writer
            this.writer = nextWriter
            if (oldWriter) {
                oldWriter.end()
            }
            this.deleteExpiredFile()
        })
    }

    
    /**
     * 处理进程关闭，保存日志后再退出
     */
    private onProcessClose() {
        const shutdown = async () => {
            this.writer?.end();
            app.quit()
        };

        // 监听中断信号
        ['SIGINT', 'SIGTERM'].forEach(signal => {
            process.on(signal, () => shutdown());
        });

        // 捕获未处理的异常，确保死前把日志写进去
        process.on('uncaughtException', (_) => {
            shutdown()
        })
    }

    /**
     * 创建写入流
     */
    private createWriter() {
        const date = dayjs().startOf('day').format("YYYY-MM-DD")
        const file = path.join(this.filePath, `${ this.appName }_${ date }.log`)
        const writer = fs.createWriteStream(file, {
            encoding: 'utf8',
            flags: 'a',
            highWaterMark: 4 * 1024,
        })
        return writer
    }

    
    /**
     * 写入日志
     */
    log(_: LogLevel, message: string): void {
        if (!this.writer) {
            this.writer = this.createWriter()
        }
        try {
            this.writer.write(message + "\n")
        } catch(error) {
        }
    }
}