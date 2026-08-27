"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cbor_1 = __importDefault(require("cbor"));
const electron_1 = require("electron");
const utils_1 = require("../../utils");
const STORE_STATE = Symbol("Store#state");
const STORE_STATE_SAVE_PATH = Symbol("Store#savePath");
const STORE_STATE_PROXY = Symbol("Store#stateProxy");
const STORE_PICK_STATE = Symbol("Store#pickKey");
class Store {
    options;
    constructor(options) {
        this.options = options;
    }
    /**
     * 保存记时器
     */
    saveTimer = null;
    /**
     * 通知计时器
     */
    notifyTimer = null;
    /**
     * 是否通知中
     */
    isPendingNotify = false;
    /**
     * 状态更新回调监听器
     */
    listeners = new Set();
    /**
     * 文件保存路径
     */
    get savePath() {
        if (!this[STORE_STATE_SAVE_PATH]) {
            let filepath = this.options.path;
            if (!filepath) {
                filepath = path_1.default.join(electron_1.app.getPath('userData'), 'data.bin');
            }
            this[STORE_STATE_SAVE_PATH] = filepath;
        }
        return this[STORE_STATE_SAVE_PATH];
    }
    /** 保存字段列表 */
    [STORE_PICK_STATE] = [];
    get picks() {
        return this[STORE_PICK_STATE];
    }
    /** 数据状态 */
    [STORE_STATE] = {};
    get state() {
        if (!this[STORE_STATE_PROXY]) {
            const stateProxy = new Proxy(this[STORE_STATE], {
                get: (target, key) => {
                    if (typeof key === 'symbol' || key === 'toJSON' || key === 'then') {
                        return undefined;
                    }
                    return target[key];
                },
                set: (target, key, value) => {
                    if (typeof key === 'symbol' || key === 'toJSON' || key === 'then') {
                        return false;
                    }
                    if (target[key] === value) {
                        return true;
                    }
                    target[key] = value;
                    this.notify();
                    this.triggerSave();
                    return true;
                },
                deleteProperty: (target, key) => {
                    if (key in target) {
                        delete target[key];
                        this.notify();
                        this.triggerSave();
                        return true;
                    }
                    return true;
                }
            });
            this[STORE_STATE_PROXY] = stateProxy;
        }
        return this[STORE_STATE_PROXY];
    }
    /**
     * 获取保存的数据
     */
    getSaveData() {
        const rawState = this[STORE_STATE];
        return Object.fromEntries(Object.entries(rawState).filter(([k, v]) => this.picks.includes(k) && v !== undefined));
    }
    /**
     * 触发保存
     */
    triggerSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            this.save();
        }, this.options.debounce ?? 300);
    }
    // 解密数据
    decrypt(data) {
        const { cryptKey } = this.options;
        const iv = data.subarray(0, 16);
        const encrypted = data.subarray(16);
        const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', crypto_1.default.scryptSync(cryptKey, 'salt', 32), iv);
        return cbor_1.default.decode(Buffer.concat([decipher.update(encrypted), decipher.final()]));
    }
    // 加密数据
    encrypt(data) {
        const { cryptKey } = this.options;
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-cbc', crypto_1.default.scryptSync(cryptKey, 'salt', 32), iv);
        return Buffer.concat([iv, cipher.update(data), cipher.final()]);
    }
    // 读取文件
    read() {
        const data = fs_extra_1.default.readFileSync(this.savePath);
        if (this.options.cryptKey) {
            return this.decrypt(data);
        }
        return cbor_1.default.decode(data);
    }
    // 保存文件
    save() {
        let data = this.getSaveData();
        let buffer = cbor_1.default.encode(data);
        if (this.options.cryptKey) {
            buffer = this.encrypt(buffer);
        }
        fs_extra_1.default.writeFileSync(this.savePath, buffer);
    }
    /**
     * 通知监听器
     */
    notify() {
        if (this.isPendingNotify)
            return;
        this.isPendingNotify = true;
        this.notifyTimer = setImmediate(() => {
            this.isPendingNotify = false;
            this.notifyTimer = null;
            const state = this[STORE_STATE];
            this.listeners.forEach(callback => callback(state));
        });
    }
    /**
     * 初始化数据状态
     * @param state 数据状态
     */
    create(state, pick = []) {
        // 合并历史数据
        if (fs_extra_1.default.existsSync(this.savePath)) {
            const historyData = this.read();
            this[STORE_STATE] = (0, utils_1.extend)(true, state, historyData);
        }
        // 初始化数据
        else {
            this[STORE_STATE] = state;
        }
        this[STORE_PICK_STATE] = pick;
        // 初始化保存数据
        this.save();
    }
    /**
     * 获取
     */
    get(key) {
        return this.state[key];
    }
    /**
     * 设置
     */
    set(key, value) {
        if (value === undefined) {
            delete this.state[key];
        }
        else {
            this.state[key] = value;
        }
    }
    /**
     * 删除
     */
    del(key) {
        delete this.state[key];
    }
    /**
     * 监听状态更新
     */
    onChange(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * 销毁
     */
    destroy() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        if (this.notifyTimer) {
            clearImmediate(this.notifyTimer);
            this.notifyTimer = null;
        }
        this.isPendingNotify = false;
        this.save();
        this.listeners.clear();
    }
}
exports.Store = Store;
