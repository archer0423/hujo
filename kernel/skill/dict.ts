/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/** 类型字典 */
export type Dict<K extends PropertyKey = PropertyKey, T = any> = Record<K, T>;

/** 字符串键字典 */
export type StringDict<V> = Dict<string, V>;

/**
 * 是否为自有属性
 * @param d 字典
 * @param p 属性
 */
export function IsOwnProperty(d: Dict, p: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(d, p);
}

/** 获取字典的所有自有键（string） */
export function GetOwnKeys(d: Dict) {
  return Object.getOwnPropertyNames(d);
}

/** 获取字典的所有自有键（symbol） */
export function GetOwnSymbols(d: Dict) {
  return Object.getOwnPropertySymbols(d);
}

/** 获取字典的全部自有键（字符串与 symbol，含非枚举，不含原型链；规避部分环境不可用的 Reflect） */
export function GetOwnProperties(d: Dict): PropertyKey[] {
  return [...GetOwnKeys(d), ...GetOwnSymbols(d)];
}

/** 深冻结字典（防止修改，覆盖字符串与 symbol 键；先冻结再递归，天然免疫循环引用） */
export function DeepFreeze<T extends Dict>(obj: T): T {
  Object.freeze(obj);
  GetOwnProperties(obj).forEach((prop) => {
    const value = obj[prop];
    const type = typeof value;
    // 已冻结视为该分支已完成深冻结（亦借此切断循环引用），不再递归
    if (value && (type === 'object' || type === 'function') && !Object.isFrozen(value)) {
      DeepFreeze(value as Dict);
    }
  });
  return obj;
}

/** 原型敏感键（写入/删除会触碰原型链） */
export function IsUnsafeProperty(prop: PropertyKey): boolean {
  return prop === '__proto__' || prop === 'constructor' || prop === 'prototype';
}

/**
 * 设置属性
 * @param d 字典
 * @param p 属性
 * @param v 值
 * @returns 是否成功设置
 */
export function SetProperty(d: Dict, p: PropertyKey, v: unknown) {
  // 不可配置属性无法重定义；目标不可扩展时也无法新增
  const desc = Object.getOwnPropertyDescriptor(d, p);
  if ((desc && !desc.configurable) || (!desc && !Object.isExtensible(d))) {
    return false;
  }

  Object.defineProperty(d, p, {
    value: v,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  return true;
}

/**
 * 移除属性
 * @param d 字典
 * @param p 属性
 * @returns
 */
export function UnsetProperty(d: Dict, p: PropertyKey) {
  const desc = Object.getOwnPropertyDescriptor(d, p);
  if (!desc || !desc.configurable) {
    return false;
  }

  delete d[p];

  return true;
}

/** 清空字典（含 symbol 键；不可配置属性会被跳过而非抛错） */
export function ClearProperties(d: Dict) {
  GetOwnProperties(d).forEach((p) => {
    UnsetProperty(d, p);
  });
}

/** 是否空字典 */
export function IsEmptyDict(d: Dict) {
  return GetOwnProperties(d).length === 0;
}

/**
 * 遍历所有属性
 * @param d 字典
 * @param visit 访问方法
 */
export function EachProperties<D extends Dict>(d: D, visit: (k: keyof D, v: D[keyof D]) => void) {
  GetOwnProperties(d).forEach((p) => {
    if (IsOwnProperty(d, p)) {
      visit(p, d[p]);
    }
  });
}

/**
 * 遍历所有属性（string）
 * @param d 字典
 * @param visit 访问方法
 */
export function EachKeys<D extends Dict>(d: D, visit: (k: keyof D, v: D[keyof D]) => void) {
  GetOwnKeys(d).forEach((p) => {
    if (IsOwnProperty(d, p)) {
      visit(p, d[p]);
    }
  });
}

/**
 * 遍历所有属性（symbol）
 * @param d 字典
 * @param visit 访问方法
 */
export function EachSymbols<D extends Dict>(d: D, visit: (k: keyof D, v: D[keyof D]) => void) {
  GetOwnSymbols(d).forEach((p) => {
    if (IsOwnProperty(d, p)) {
      visit(p, d[p]);
    }
  });
}

/**
 * 映射字典
 * @param d 字典
 * @param mapping 映射方法
 * @returns 无原型的新字典
 */
export function Mapping<V>(
  d: Dict,
  mapping: (k: PropertyKey, v: unknown) => V,
): Dict<PropertyKey, V> {
  return GetOwnProperties(d).reduce(
    (o, k) => {
      SetProperty(o, k, mapping(k, d[k]));
      return o;
    },
    Object.create(null) as Dict<PropertyKey, V>,
  );
}

/**
 * 合并字典
 * @param input 字典入参
 * @returns 无原型的新字典
 */
export function Merge(...input: Dict[]) {
  return input.reduce(
    (o, d) => {
      EachProperties(d, (p) => SetProperty(o, p, d[p]));
      return o;
    },
    Object.create(null) as Dict,
  );
}

/**
 * （筛选后）合并字典
 * @param input 字典入参
 * @returns 无原型的新字典
 */
export function MergeBy(
  match: (p: PropertyKey, src: unknown, dst: unknown) => boolean,
  ...input: Dict[]
) {
  return input.reduce(
    (o, d) => {
      EachProperties(d, (p) => match(p, o[p], d[p]) && SetProperty(o, p, d[p]));
      return o;
    },
    Object.create(null) as Dict,
  );
}

/**
 * 覆盖原字典
 * @param input 字典入参
 * @returns 目标字典
 */
export function Override(...input: Dict[]) {
  if (input.length === 0) return Object.create(null);
  if (input.length === 1) return input[0];
  const dst = input.shift()!;
  return input.reduce((o, d) => {
    EachProperties(d, (p) => SetProperty(o, p, d[p]));
    return o;
  }, dst);
}

/**
 * （筛选后）覆盖原字典
 * @param input 字典入参
 * @returns 目标字典
 */
export function OverrideBy(
  match: (p: PropertyKey, src: unknown, dst: unknown) => boolean,
  ...input: Dict[]
) {
  if (input.length === 0) return Object.create(null);
  if (input.length === 1) return input[0];
  const dst = input.shift()!;
  return input.reduce((o, d) => {
    EachProperties(d, (p) => match(p, o[p], d[p]) && SetProperty(o, p, d[p]));
    return o;
  }, dst);
}

/**
 * 从字典中提取指定键值对（仅取自有键；值为 null/undefined 的自有键同样会被提取）
 * @returns 无原型的新字典
 */
export function PickProperties<T extends Dict, K extends keyof T>(
  d: T,
  input: readonly K[],
): Pick<T, K> {
  return input.reduce(
    (o, p) => {
      if (IsOwnProperty(d, p)) {
        o[p] = d[p];
      }
      return o;
    },
    Object.create(null) as Dict,
  ) as Pick<T, K>;
}

/**
 * 从字典中剔除指定键值对（含 symbol 键）
 * @param override 是否直接修改原字典
 * @returns override=true 时直接修改并返回原字典（破坏性操作），否则返回无原型的新字典
 */
export function OmitProperties<T extends Dict, K extends keyof T>(
  d: T,
  list: readonly K[],
  override: boolean = false,
): Omit<T, K> {
  if (override) {
    list.forEach((key) => UnsetProperty(d, key));
    return d as unknown as Omit<T, K>;
  }
  return GetOwnProperties(d).reduce(
    (o, p) => {
      if (list.indexOf(p as K) === -1) {
        SetProperty(o, p, d[p]);
      }
      return o;
    },
    Object.create(null) as Dict,
  ) as Omit<T, K>;
}

/** 有损拷贝（JSON 序列化往返；会丢弃 undefined、函数与 symbol 键，循环引用会抛错） */
export function LossyClone(d: Dict) {
  try {
    return JSON.parse(JSON.stringify(d));
  } catch (e) {
    return null;
  }
}

/**
 * 浅拷贝自有键（含 symbol 与非枚举）；
 * @param d 字典
 * @return 无原型的新字典
 */
export function ShallowClone(d: Dict) {
  return GetOwnProperties(d).reduce(
    (acc, key) => {
      SetProperty(acc, key, d[key]);
      return acc;
    },
    Object.create(null) as Dict,
  );
}

/**
 * 深拷贝
 * @param d 字典
 * @returns 无原型的新字典
 */
export function DeepClone(d: unknown): unknown {
  if (typeof d !== 'object' || d === null) {
    return d;
  }

  if (Array.isArray(d)) {
    return d.map((item) => DeepClone(item));
  }

  if (d instanceof Date) {
    return new Date(d.getTime());
  }

  if (d instanceof RegExp) {
    const copy = new RegExp(d.source, d.flags);
    copy.lastIndex = 0;
    return copy;
  }

  if (d instanceof Map) {
    return new Map([...d].map(([k, v]) => [DeepClone(k), DeepClone(v)]));
  }

  if (d instanceof Set) {
    return new Set([...d].map((item) => DeepClone(item)));
  }

  return Mapping(d, (_, v) => DeepClone(v));
}
