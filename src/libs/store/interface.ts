export type StoreOptions = {
    /** 
     * 文件保存路径 (默认 useData/data.bin)
     */
    path: string;
    /** 
     * 加密密钥
     */
    cryptKey?: string;
    /** 
     * 防抖 (单位：ms) 默认值 300 
     */
    debounce?: number;
}
/**
 * 状态值
 */
export type StoreStateValue = number | string | Date | boolean | Buffer | null
/**
 * 状态
 */
export interface StoreState {
}

/**
 * 状态主键
 */
export type StoreStateKey   = keyof StoreState

/**
 * 需要保存的状态主键
 */
export type PickStoreStateKey = StoreStateKey[]

/**
 * 状态监听回调
 */
export type StoreStateListener = (state: StoreState) => void
