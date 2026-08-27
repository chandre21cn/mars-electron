export declare class CreateError extends Error {
    readonly code: number;
    constructor(code: number | string, message?: string);
}
