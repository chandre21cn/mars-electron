"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateError = void 0;
class CreateError extends Error {
    code = 400;
    constructor(code, message) {
        const finalCode = typeof code === 'string' ? 400 : code;
        const finalMessage = typeof code === 'string' ? code : (message || '');
        super(finalMessage);
        this.code = finalCode;
        this.name = 'CreateError';
        Error.captureStackTrace(this, CreateError);
    }
}
exports.CreateError = CreateError;
