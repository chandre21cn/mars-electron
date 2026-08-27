export class CreateError extends Error {
    readonly code: number = 400
    constructor(code: number | string, message?: string) {
        const finalCode = typeof code === 'string' ? 400 : code;
        const finalMessage = typeof code === 'string' ? code : (message || '');
        super(finalMessage);

        this.code = finalCode;
        this.name = 'CreateError';
        Error.captureStackTrace(this, CreateError);

    }
}