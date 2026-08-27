import type { LoggerTransport, LogLevel } from "../interface";
export declare class ConsoleTransport implements LoggerTransport {
    log(level: LogLevel, message: string): void;
}
