import { $Fetch } from "ofetch";
import { Application } from "../../core";
import { Logger } from '../logger';
export declare class Fetch {
    constructor(app: Application);
    /**
     * 应用管理中心
     */
    readonly app: Application;
    get logger(): Logger;
    /**
     * 网络请求
     */
    get request(): $Fetch;
}
