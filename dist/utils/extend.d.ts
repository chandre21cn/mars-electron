/**
 * 将元组类型（如 [A, B, C]）动态转换为交叉类型（如 A & B & C）
 * 完美支持 5-10+ 甚至无限个对象的类型合并
 */
type MergeIntersection<T extends readonly any[]> = T extends [infer Head, ...infer Tail] ? Head & MergeIntersection<Tail> : unknown;
export declare function extend<Deep extends boolean, Target extends object, Sources extends readonly object[]>(deep: Deep, target: Target, ...sources: Sources): Target & MergeIntersection<Sources>;
export declare function extend<Target extends object, Sources extends readonly object[]>(target: Target, ...sources: Sources): Target & MergeIntersection<Sources>;
export {};
