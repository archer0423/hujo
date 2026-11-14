/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { js, Component, Constructor, Node } from 'cc';

/** 类型枚举 */
export enum Type {
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Undefined = 'Undefined',
  Null = 'Null',
  Symbol = 'Symbol',
  Function = 'Function',
  AsyncFunction = 'AsyncFunction',
  Array = 'Array',
  Set = 'Set',
  WeakSet = 'WeakSet',
  Map = 'Map',
  WeakMap = 'WeakMap',
  Object = 'Object',
  Date = 'Date',
  Promise = 'Promise',
  RegExp = 'RegExp',
  BigInt = 'BigInt',
  Int8Array = 'Int8Array',
  Uint8Array = 'Uint8Array',
  Uint8ClampedArray = 'Uint8ClampedArray',
  Int16Array = 'Int16Array',
  Uint16Array = 'Uint16Array',
  Int32Array = 'Int32Array',
  Uint32Array = 'Uint32Array',
  Float32Array = 'Float32Array',
  Float64Array = 'Float64Array',
  BigInt64Array = 'BigInt64Array',
  BigUint64Array = 'BigUint64Array',
}

/** URL 协议前缀匹配（如 https:、javascript:） */
const ProtocolPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * 获取值的类型字符串
 * @param target - 要检查的值
 * @returns 值的类型字符串
 */
export function KindOf(target: unknown): string {
  return Object.prototype.toString.call(target).slice(8, -1);
}

/**
 * 检查值的类型是否与指定类型匹配
 * @param target - 要检查的值
 * @param type - 要检查的类型
 * @return 如果值的类型与指定类型匹配则返回 true
 */
export const IsKindOf = (target: unknown, type: Type) => KindOf(target) === type;

/**
 * 检查值是否为 undefined
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 则返回 true
 */
export function IsUndefined<T>(value: T | undefined): value is undefined {
  return IsKindOf(value, Type.Undefined);
}

/**
 * 检查值是否为 null
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 null 则返回 true
 */
export function IsNull<T>(value: T | null): value is null {
  return IsKindOf(value, Type.Null);
}

/**
 * 检查值是否无效（undefined 或 null）
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 或 null 则返回 true
 */
export function IsInvalid(value: unknown): value is undefined | null {
  return IsUndefined(value) || IsNull(value);
}

/**
 * 检查值是否为空值
 * 如果值为 null、undefined、NaN、0、false、空字符串、'false' 或空容器（对象/数组/集合/映射）则返回 true
 * @param value - 要检查的值
 * @returns 如果值为空值则返回 true
 */
export function IsEmpty(value: unknown): boolean {
  return (
    IsUndefined(value) ||
    IsNull(value) ||
    Number.isNaN(value) ||
    value === 0 ||
    value === false ||
    value === 'false' ||
    value === '' ||
    (IsObject(value) && Object.keys(value).length === 0) ||
    (IsArray(value) && value.length === 0) ||
    (IsSet(value) && value.size === 0) ||
    (IsMap(value) && value.size === 0)
  );
}

/**
 * 检查值是否为真值（转换为布尔值后为 true）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
export function IsTrue(value: unknown): boolean {
  return Boolean(value) === true;
}

/**
 * 检查值是否为假值（转换为布尔值后为 false）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
export function IsFalse(value: unknown): boolean {
  return Boolean(value) === false;
}

/**
 * 检查值是否为真值（严格与 true 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 true 则返回 true
 */
export function IsStrictlyTrue(value: unknown): boolean {
  return value === true;
}

/**
 * 检查值是否为假值（严格与 false 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 false 则返回 true
 */
export function IsStrictlyFalse(value: unknown): boolean {
  return value === false;
}

/**
 * 检查值是否为有效数字（有限数值，不含 NaN 与无穷大）
 * @param value - 要检查的值
 * @returns 如果值为有效数字则返回 true
 */
export function IsNumber(value: unknown): value is number {
  return IsKindOf(value, Type.Number) && Number.isFinite(value);
}

/**
 * 检查值是否为字符串
 * @param value - 要检查的值
 * @returns 如果值为字符串类型则返回 true
 */
export function IsString(value: unknown): value is string {
  return IsKindOf(value, Type.String);
}

/**
 * 检查值是否为函数
 * @param value - 要检查的值
 * @returns 如果值为函数类型则返回 true
 */
export function IsFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return IsKindOf(value, Type.Function);
}

/**
 * 检查值是否为异步函数
 * @param value - 要检查的值
 * @returns 如果值为异步函数类型则返回 true
 */
export function IsAsyncFunction(value: unknown): value is (...args: unknown[]) => Promise<unknown> {
  return IsKindOf(value, Type.AsyncFunction);
}

/**
 * 检查值是否为 Promise 对象
 * @template T - 解析值类型（由调用方声明，运行时不校验）
 * @param value - 要检查的值
 * @returns 如果值为 Promise 则返回 true
 */
export function IsPromise<T>(value: unknown): value is Promise<T> {
  return IsKindOf(value, Type.Promise);
}

/**
 * 检查值是否为 Symbol
 * @param value - 要检查的值
 * @returns 如果值为 Symbol 类型则返回 true
 */
export function IsSymbol(value: unknown): value is symbol {
  return IsKindOf(value, Type.Symbol);
}

/**
 * 检查值是否为对象（非 null 的对象类型，不含数组、函数、日期等）
 * @param value - 要检查的值
 * @returns 如果值为对象类型则返回 true
 */
export function IsObject(value: unknown): value is Record<string, unknown> {
  return IsKindOf(value, Type.Object);
}

/**
 * 检查值是否为纯对象（直接由 Object 构造函数创建或字面量创建）
 * @param value - 要检查的值
 * @returns 如果值为纯对象则返回 true
 */
export function IsPlainObject(value: unknown): value is Record<string, unknown> {
  if (!IsObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * 检查值是否为数组
 * @param value - 要检查的值
 * @returns 如果值为数组类型则返回 true
 */
export function IsArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为正则表达式
 * @param value - 要检查的值
 * @returns 如果值为正则表达式类型则返回 true
 */
export function IsRegExp(value: unknown): value is RegExp {
  return IsKindOf(value, Type.RegExp);
}

/**
 * 检查值是否为 BigInt
 * @param value - 要检查的值
 * @returns 如果值为 BigInt 类型则返回 true
 */
export function IsBigInt(value: unknown): value is bigint {
  return IsKindOf(value, Type.BigInt);
}

/**
 * 检查值是否为 Int8Array
 * @param value - 要检查的值
 * @returns 如果值为 Int8Array 类型则返回 true
 */
export function IsInt8Array(value: unknown): value is Int8Array {
  return IsKindOf(value, Type.Int8Array);
}

/**
 * 检查值是否为 Uint8Array
 * @param value - 要检查的值
 * @returns 如果值为 Uint8Array 类型则返回 true
 */
export function IsUint8Array(value: unknown): value is Uint8Array {
  return IsKindOf(value, Type.Uint8Array);
}

/**
 * 检查值是否为 Uint8ClampedArray
 * @param value - 要检查的值
 * @returns 如果值为 Uint8ClampedArray 类型则返回 true
 */
export function IsUint8ClampedArray(value: unknown): value is Uint8ClampedArray {
  return IsKindOf(value, Type.Uint8ClampedArray);
}

/**
 * 检查值是否为 Int16Array
 * @param value - 要检查的值
 * @returns 如果值为 Int16Array 类型则返回 true
 */
export function IsInt16Array(value: unknown): value is Int16Array {
  return IsKindOf(value, Type.Int16Array);
}

/**
 * 检查值是否为 Uint16Array
 * @param value - 要检查的值
 * @returns 如果值为 Uint16Array 类型则返回 true
 */
export function IsUint16Array(value: unknown): value is Uint16Array {
  return IsKindOf(value, Type.Uint16Array);
}

/**
 * 检查值是否为 Int32Array
 * @param value - 要检查的值
 * @returns 如果值为 Int32Array 类型则返回 true
 */
export function IsInt32Array(value: unknown): value is Int32Array {
  return IsKindOf(value, Type.Int32Array);
}

/**
 * 检查值是否为 Uint32Array
 * @param value - 要检查的值
 * @returns 如果值为 Uint32Array 类型则返回 true
 */
export function IsUint32Array(value: unknown): value is Uint32Array {
  return IsKindOf(value, Type.Uint32Array);
}

/**
 * 检查值是否为 Float32Array
 * @param value - 要检查的值
 * @returns 如果值为 Float32Array 类型则返回 true
 */
export function IsFloat32Array(value: unknown): value is Float32Array {
  return IsKindOf(value, Type.Float32Array);
}

/**
 * 检查值是否为 Float64Array
 * @param value - 要检查的值
 * @returns 如果值为 Float64Array 类型则返回 true
 */
export function IsFloat64Array(value: unknown): value is Float64Array {
  return IsKindOf(value, Type.Float64Array);
}

/**
 * 检查值是否为 BigInt64Array
 * @param value - 要检查的值
 * @returns 如果值为 BigInt64Array 类型则返回 true
 */
export function IsBigInt64Array(value: unknown): value is BigInt64Array {
  return IsKindOf(value, Type.BigInt64Array);
}

/**
 * 检查值是否为 BigUint64Array
 * @param value - 要检查的值
 * @returns 如果值为 BigUint64Array 类型则返回 true
 */
export function IsBigUint64Array(value: unknown): value is BigUint64Array {
  return IsKindOf(value, Type.BigUint64Array);
}

/**
 * 检查值是否为 Map 对象
 * @param value - 要检查的值
 * @returns 如果值为 Map 类型则返回 true
 */
export function IsMap(value: unknown): value is Map<unknown, unknown> {
  return IsKindOf(value, Type.Map);
}

/**
 * 检查值是否为 WeakMap 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakMap 类型则返回 true
 */
export function IsWeakMap(value: unknown): value is WeakMap<object, unknown> {
  return IsKindOf(value, Type.WeakMap);
}

/**
 * 检查值是否为 Set 对象
 * @param value - 要检查的值
 * @returns 如果值为 Set 类型则返回 true
 */
export function IsSet(value: unknown): value is Set<unknown> {
  return IsKindOf(value, Type.Set);
}

/**
 * 检查值是否为 WeakSet 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakSet 类型则返回 true
 */
export function IsWeakSet(value: unknown): value is WeakSet<object> {
  return IsKindOf(value, Type.WeakSet);
}

/**
 * 检查值是否为日期对象
 * @param value - 要检查的值
 * @returns 如果值为日期类型则返回 true
 */
export function IsDate(value: unknown): value is Date {
  return IsKindOf(value, Type.Date);
}

/**
 * 检查值是否为指定构造函数的实例
 * @param value - 要检查的值
 * @param type - 构造函数或类
 * @returns 如果值是指定类型的实例则返回 true
 */
export function IsInstanceof<T = unknown>(value: unknown, type: Constructor<T>): value is T {
  return value instanceof type;
}

/**
 * 检查值是否为 Cocos Creator 节点
 * @param value - 要检查的值
 * @returns 如果值是 CC 节点则返回 true
 */
export function IsCCNode(value: unknown): value is Node {
  return IsInstanceof(value, Node);
}

/**
 * 检查值是否为 Cocos Creator 组件
 * @param value - 要检查的值
 * @returns 如果值是 CC 组件则返回 true
 */
export function IsCCComponent(value: unknown): value is Component {
  return IsInstanceof(value, Component);
}

/**
 * 获取 Cocos Creator 对象的类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @returns 对象的类名
 */
export function CCClassOf<T extends Constructor<unknown>>(value: InstanceType<T>): string {
  return js.getClassName(value);
}

/**
 * 检查 Cocos Creator 对象是否为指定类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @param type - 要检查的类名
 * @returns 如果对象的类名匹配则返回 true
 */
export function IsCCClassOf<T extends Constructor<unknown>>(
  value: InstanceType<T>,
  type: string,
): boolean {
  return CCClassOf(value) === type;
}

/**
 * 检查字符串是否为类 URL 格式（以合法协议前缀开头，如 https://、javascript:）
 * 注意：仅做格式粗检，非 RFC 严格校验
 * @param value - 要检查的字符串
 * @returns 如果字符串符合 URL 格式则返回 true
 */
export function IsURL(value: string): boolean {
  ProtocolPattern.lastIndex = 0;
  return ProtocolPattern.test(value);
}

/**
 * 获取 URL 的协议部分（小写形式；无协议时返回空字符串）
 * @param url - 要解析的 URL
 * @returns URL 的协议部分
 */
export function ProtocolOf(url: string): string {
  ProtocolPattern.lastIndex = 0;
  const matched = url.trim().match(ProtocolPattern);
  return matched ? matched[0].slice(0, -1).toLowerCase() : '';
}

/**
 * 检查 URL 是否使用指定协议
 * @param url - 要检查的 URL
 * @param protocol - 协议名称
 * @returns 如果 URL 使用指定协议则返回 true
 */
export function IsProtocolOf(url: string, protocol: string): boolean {
  return ProtocolOf(url) === protocol;
}
