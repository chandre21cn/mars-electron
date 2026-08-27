export * from './interface';
export * from './decorators';
export * from './core';
export * from './utils';
export * from './libs';
import 'ofetch';
export * from './index' 

declare module 'ofetch' {
    interface FetchOptions {
        /** 是否已重试 */
        retried?: boolean;
        /** 是否需要注入 Token */
        needAuth?: boolean;
    }
}
