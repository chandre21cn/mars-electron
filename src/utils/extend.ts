const hasOwn    = Object.prototype.hasOwnProperty;
const toStr     = Object.prototype.toString;

function isPlainObject(obj: any): obj is Record<string, any> {
    if (!obj || toStr.call(obj) !== '[object Object]') {
        return false;
    }
    const hasOwnConstructor = hasOwn.call(obj, 'constructor');
    const hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
        return false;
    }
    let key: any;
    for (key in obj) { }
    return typeof key === 'undefined' || hasOwn.call(obj, key);
}

function isArray(obj: any): obj is any[] {
    return Array.isArray ? Array.isArray(obj) : toStr.call(obj) === '[object Array]';
}

/** 
 * 将元组类型（如 [A, B, C]）动态转换为交叉类型（如 A & B & C）
 * 完美支持 5-10+ 甚至无限个对象的类型合并
 */
type MergeIntersection<T extends readonly any[]> = 
    T extends [infer Head, ...infer Tail]
        ? Head & MergeIntersection<Tail>
        : unknown;

// 开启深拷贝的情况：第一个参数为布尔值，后面跟任意数量的对象
export function extend<Deep extends boolean, Target extends object, Sources extends readonly object[]>(
    deep: Deep, 
    target: Target, 
    ...sources: Sources
): Target & MergeIntersection<Sources>;

// 浅拷贝的情况：第一个参数直接是目标对象，后面跟任意数量的对象
export function extend<Target extends object, Sources extends readonly object[]>(
    target: Target, 
    ...sources: Sources
): Target & MergeIntersection<Sources>;


// ==================== 核心实现 ====================
export function extend(...args: any[]): any {
    let options: any, name: any, src: any, copy: any, copyIsArray: any, clone: any;
    let target = args[0];
    let i = 1;
    let deep = false;
    const length = args.length;

    // 处理深拷贝的布尔值参数
    if (typeof target === 'boolean') {
        deep = target;
        target = args[1] || {};
        i = 2;
    }

    // 如果 target 不是对象或函数，强制将其转为空对象
    if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
        target = {};
    }

    for (; i < length; ++i) {
        options = args[i];
        // 略过 null 或 undefined 的参数
        if (options == null) continue;

        for (name in options) {
            // 防御原型链污染
            if (name === '__proto__' || name === 'constructor' || name === 'prototype') {
                continue;
            }

            src = target[name];
            copy = options[name];

            // 防止循环引用
            if (target === copy) continue;

            // 支持【纯对象】或【数组】的深度合并
            if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                
                if (copyIsArray) {
                    copyIsArray = false;
                    clone = src && isArray(src) ? src : [];
                } else {
                    clone = src && isPlainObject(src) ? src : {};
                }

                // 递归合并
                target[name] = extend(deep, clone, copy);

            } else if (typeof copy !== 'undefined') {
                // 正常覆盖
                target[name] = copy;
            }
        }
    }
    
    return target;
}