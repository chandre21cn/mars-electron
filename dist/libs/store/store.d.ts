import { PickStoreStateKey, StoreOptions, StoreState, StoreStateListener } from "./interface";
declare const STORE_STATE: unique symbol;
declare const STORE_PICK_STATE: unique symbol;
export declare class Store<T extends StoreState = StoreState> {
    readonly options: StoreOptions;
    constructor(options: StoreOptions);
    /**
     * 保存记时器
     */
    private saveTimer;
    /**
     * 通知计时器
     */
    private notifyTimer;
    /**
     * 是否通知中
     */
    private isPendingNotify;
    /**
     * 状态更新回调监听器
     */
    private listeners;
    /**
     * 文件保存路径
     */
    private get savePath();
    /** 保存字段列表 */
    private [STORE_PICK_STATE];
    private get picks();
    /** 数据状态 */
    private [STORE_STATE];
    get state(): T;
    /**
     * 获取保存的数据
     */
    private getSaveData;
    /**
     * 触发保存
     */
    private triggerSave;
    private decrypt;
    private encrypt;
    private read;
    private save;
    /**
     * 通知监听器
     */
    private notify;
    /**
     * 初始化数据状态
     * @param state 数据状态
     */
    create(state: T, pick?: PickStoreStateKey): void;
    /**
     * 获取
     */
    get<K extends keyof T>(key: K): T[K] | undefined;
    /**
     * 设置
     */
    set<K extends keyof T>(key: K, value: T[K] | undefined): void;
    /**
     * 删除
     */
    del<K extends keyof T>(key: K): void;
    /**
     * 监听状态更新
     */
    onChange(listener: StoreStateListener): (() => void);
    /**
     * 销毁
     */
    destroy(): void;
}
export {};
