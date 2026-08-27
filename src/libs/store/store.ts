import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import cbor from 'cbor'
import { app } from 'electron';
import { PickStoreStateKey, StoreStateKey, StoreOptions, StoreState, StoreStateListener, StoreStateValue } from "./interface";
import { extend } from '../../utils';

const STORE_STATE = Symbol("Store#state")
const STORE_STATE_SAVE_PATH = Symbol("Store#savePath")
const STORE_STATE_PROXY = Symbol("Store#stateProxy")
const STORE_PICK_STATE = Symbol("Store#pickKey")

export class Store<T extends StoreState = StoreState> {

    constructor(
        readonly options: StoreOptions
    ) {}

    /** 
     * 保存记时器
     */
    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * 通知计时器
     */
    private notifyTimer: ReturnType<typeof setImmediate> | null = null;
    /**
     * 是否通知中
     */
    private isPendingNotify: boolean = false
    /** 
     * 状态更新回调监听器
     */
    private listeners: Set<StoreStateListener> = new Set();

    /**
     * 文件保存路径
     */
    private get savePath() {
        if (!this[STORE_STATE_SAVE_PATH]) {
            let filepath = this.options.path
            if (!filepath) {
                filepath = path.join(app.getPath('userData'), 'data.bin')
            }
            this[STORE_STATE_SAVE_PATH] = filepath
        }
        return this[STORE_STATE_SAVE_PATH]
    }

    /** 保存字段列表 */
    private [STORE_PICK_STATE]: StoreStateKey[] = []
    private get picks(): StoreStateKey[] {
        return this[STORE_PICK_STATE]
    }

    /** 数据状态 */
    private [STORE_STATE] = {} as T
    get state(): T {
        if (!this[STORE_STATE_PROXY]) {
            const stateProxy = new Proxy(this[STORE_STATE], {
                get: (target, key: string | symbol) => {
                    if (typeof key === 'symbol' || key === 'toJSON' || key === 'then') {
                        return undefined
                    }
                    return target[key]
                },
                set: (target, key: string | symbol, value: StoreStateValue) => {
                    if (typeof key === 'symbol' || key === 'toJSON' || key === 'then') {
                        return false;
                    }
                    if (target[key] === value) {
                        return true;
                    }
                    target[key] = value
                    this.notify()
                    this.triggerSave()
                    return true;
                },
                deleteProperty: (target, key: string) => {
                    if (key in target) {
                        delete target[key]
                        this.notify()
                        this.triggerSave()
                        return true;
                    }
                    return true;
                }
            })
            this[STORE_STATE_PROXY] = stateProxy;
        }
        return this[STORE_STATE_PROXY]
    }

    /**
     * 获取保存的数据
     */
    private getSaveData() {
        const rawState = this[STORE_STATE]
        return Object.fromEntries(
            Object.entries(rawState).filter(([k, v]) => this.picks.includes(k as StoreStateKey) && v !== undefined )
        )
    }

    /**
     * 触发保存
     */
    private triggerSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer)
        }
        this.saveTimer = setTimeout(() => {
            this.save()
        }, this.options.debounce ?? 300)
    }

    // 解密数据
    private decrypt(data: Buffer): StoreState {
        const { cryptKey } = this.options
        const iv        = data.subarray(0, 16);
        const encrypted = data.subarray(16);
        const decipher  = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(cryptKey!, 'salt', 32), iv);
        return cbor.decode(Buffer.concat([decipher.update(encrypted), decipher.final()]));
    }

    // 加密数据
    private encrypt(data: Buffer) {
        const { cryptKey } = this.options
        const iv        = crypto.randomBytes(16);
        const cipher    = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(cryptKey!, 'salt', 32), iv);
        return Buffer.concat([iv, cipher.update(data), cipher.final()]);
    }

    // 读取文件
    private read(): StoreState {
        const data = fs.readFileSync(this.savePath)
        if (this.options.cryptKey) {   
            return this.decrypt(data)
        }
        return cbor.decode(data)
    }

    // 保存文件
    private save() {
        let data    = this.getSaveData()
        let buffer  = cbor.encode(data)
        if (this.options.cryptKey) {   
            buffer = this.encrypt(buffer)
        }
        fs.writeFileSync(this.savePath, buffer)
    }

    /**
     * 通知监听器
     */
    private notify() {
        if (this.isPendingNotify) return;
        this.isPendingNotify = true;
        this.notifyTimer = setImmediate(() => {
            this.isPendingNotify = false
            this.notifyTimer = null
            const state = this[STORE_STATE]
            this.listeners.forEach(callback => callback(state))
        })
    }

    /**
     * 初始化数据状态
     * @param state 数据状态
     */
    create(state: T, pick: PickStoreStateKey = []) {
        // 合并历史数据
        if (fs.existsSync(this.savePath)) {
            const historyData = this.read()
            this[STORE_STATE] = extend(true, state, historyData)
        } 
        // 初始化数据
        else {
            this[STORE_STATE] = state;
        }
        this[STORE_PICK_STATE]  = pick;
        // 初始化保存数据
        this.save()
    }

    /**
     * 获取
     */
    get<K extends keyof T>(key: K ): T[K] | undefined {
        return this.state[key]
    }

    /**
     * 设置
     */
    set<K extends keyof T>(key: K, value: T[K] | undefined ) {
        if (value === undefined) {
            delete this.state[key]
        } else {
            this.state[key] = value
        }
    }

    /**
     * 删除
     */
    del<K extends keyof T>(key: K) {
        delete this.state[key]
    }

    /**
     * 监听状态更新
     */
    onChange(listener: StoreStateListener): (() => void) {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer)
            this.saveTimer = null
        }
        if (this.notifyTimer) {
            clearImmediate(this.notifyTimer)
            this.notifyTimer = null
        }
        this.isPendingNotify = false;

        this.save()
        this.listeners.clear()
    }

}