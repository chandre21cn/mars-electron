import type { LoggerTransport, LogLevel } from "../interface";

// ANSI 颜色代码
const colors = {
    DEBUG   : '\x1b[34m',
    INFO    : '\x1b[32m',
    WARN    : '\x1b[33m',
    ERROR   : '\x1b[31m',
    RESET   : '\x1b[0m',
};

export class ConsoleTransport implements LoggerTransport {
    
    log(level: LogLevel, message: string): void {
        const color = colors[level] || colors.RESET;
        const formattedMessage = `${color}${message}${colors.RESET}`;
        
        switch (level) {
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
            case 'INFO':
                console.info(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'ERROR':
                console.error(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
}