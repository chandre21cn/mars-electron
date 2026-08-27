"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransport = void 0;
// ANSI 颜色代码
const colors = {
    DEBUG: '\x1b[34m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m',
};
class ConsoleTransport {
    log(level, message) {
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
exports.ConsoleTransport = ConsoleTransport;
