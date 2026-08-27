"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTransport = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const dayjs_1 = __importDefault(require("dayjs"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const electron_1 = require("electron");
class FileTransport {
    filePath;
    appName;
    writer;
    maxDays = 7;
    constructor(filePath, appName) {
        this.filePath = filePath;
        this.appName = appName;
        // 创建文件目录
        fs_extra_1.default.ensureDirSync(this.filePath);
        // 监听进程关闭
        this.onProcessClose();
        // 删除过期日志
        this.deleteExpiredFile();
        // 定时任务
        this.initSchedule();
    }
    /**
     * 删除过期的日志文件（7天前）
     */
    async deleteExpiredFile() {
        try {
            const files = await fs_extra_1.default.readdir(this.filePath, { withFileTypes: true });
            const expiryTime = (0, dayjs_1.default)().subtract(this.maxDays, 'day').startOf('day');
            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.log')) {
                    const filepath = path_1.default.join(this.filePath, file.name);
                    const fileState = await fs_extra_1.default.stat(filepath);
                    if (expiryTime.isAfter(fileState.mtime)) {
                        await fs_extra_1.default.unlink(filepath);
                    }
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    /**
     * 定时任务：每天 0 点切换文件
     */
    initSchedule() {
        node_cron_1.default.schedule("0 0 * * *", () => {
            const nextWriter = this.createWriter();
            const oldWriter = this.writer;
            this.writer = nextWriter;
            if (oldWriter) {
                oldWriter.end();
            }
            this.deleteExpiredFile();
        });
    }
    /**
     * 处理进程关闭，保存日志后再退出
     */
    onProcessClose() {
        const shutdown = async () => {
            this.writer?.end();
            electron_1.app.quit();
        };
        // 监听中断信号
        ['SIGINT', 'SIGTERM'].forEach(signal => {
            process.on(signal, () => shutdown());
        });
        // 捕获未处理的异常，确保死前把日志写进去
        process.on('uncaughtException', (_) => {
            shutdown();
        });
    }
    /**
     * 创建写入流
     */
    createWriter() {
        const date = (0, dayjs_1.default)().startOf('day').format("YYYY-MM-DD");
        const file = path_1.default.join(this.filePath, `${this.appName}_${date}.log`);
        const writer = fs_extra_1.default.createWriteStream(file, {
            encoding: 'utf8',
            flags: 'a',
            highWaterMark: 4 * 1024,
        });
        return writer;
    }
    /**
     * 写入日志
     */
    log(_, message) {
        if (!this.writer) {
            this.writer = this.createWriter();
        }
        try {
            this.writer.write(message + "\n");
        }
        catch (error) {
        }
    }
}
exports.FileTransport = FileTransport;
