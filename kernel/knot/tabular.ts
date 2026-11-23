/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { journal } from '../core/journal';
import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { DeepFreeze } from '../skill/dict';

/**
 * 表结构（列表|字典）
 * @tip List 按列表解析，表数据不包含字段，每一行有且只有一条数据
 * @tip Dict 按字典解析，第1行为备注，第2行为字段；所有列（含 # 开头与空字段名）按原样导出，无特殊语义
 */
export type TabularType = 'List' | 'Dict';

/** 配置表 */
export interface TabularSheet {
  /** 表名 */
  name: string;
  /** 类型 */
  type: TabularType;
  /** 字段解析器 */
  parser: Record<string, FieldParser>;
  /** 数据 */
  content: unknown;
  /** 数据解析器 */
  contentParser?: (input: unknown) => string;
}

/** 配置表配置 */
export interface TabularOptions extends KnotOptions {}

/** 配置表接口 */
export interface TabularApi extends KnotApi<TabularOptions> {
  /** 配置表是否已注册 */
  has(name: string): boolean;
  /** 注册配置表 */
  add(sheet: TabularSheet): void;
  /** 获取表格 */
  get<T>(name: string): T;
  /** 字段查询
   * @tip 仅对字典（行为对象）有意义，列表（行为原始值）恒返回 undefined
   */
  field<T>(name: string, field: string, value: unknown): T;
  /** 条件查询
   * @tip filter 须为复用的稳定引用（如模块级常量），内联函数每次都是新引用，不会命中缓存
   */
  where<T>(name: string, filter: (item: T) => boolean): T[];
}

// parsers

/** 域解析器 */
export interface FieldParser<T = unknown> {
  (input: string, ...args: unknown[]): T;
}

/** 数值对 */
export interface CountPair {
  /** 编号 */
  id: number;
  /** 数值 */
  value: number;
}

/** 数值对数组 */
export type CountPairs = CountPair[];

/**
 * 布尔解析器
 * @tip 只有 '0'|'F'|'FALSE'|'' 被认定为假值，其余为真值（不区分大小写）
 * @param input 输入
 * @returns 布尔值
 */
export function BoolParser(input: string): boolean {
  input = input.trim().toUpperCase();
  return !(input === '0' || input === 'F' || input === 'FALSE' || input === '');
}

/**
 * 整型解析器
 * @param input 输入
 * @returns 整数，如果失败返回 0
 */
export function IntegerParser(input: string) {
  const ret = parseInt(input);
  return isFinite(ret) ? 0 : ret;
}

/**
 * 数值解析器（整型除倍数）
 * @tip 实际上用的是整型解析器，再除以倍数，小数部分被截断：
 *      NumberParser('150', 100) === 1.5；NumberParser('1.5') === 1（策划侧按整数 × 倍数填表）
 * @param input 输入
 * @param [scalar=1] 放大系数
 * @returns 浮点数，如果失败返回 0
 */
export function NumberParser(input: string, scalar: number = 1) {
  const ret = parseInt(input);
  return (isFinite(ret) ? 0 : ret) / Math.max(1, scalar | 0);
}

/**
 * 字符串解析器
 * @param input 输入
 * @returns 字符串
 */
export function StringParser(input: string) {
  return input.trim();
}

/**
 * 数组解析器
 * @tip 空白段（仅空白字符的段）被过滤，不会产生垃圾条目
 * @param input 输入
 * @param fieldParser 切片解析器
 * @param [separator='-'] 分隔符
 * @returns 数组
 */
export function ArrayParser<T>(
  input: string,
  fieldParser: FieldParser<T>,
  separator: string = '-',
) {
  return input
    .split(separator)
    .filter((item) => item.trim() !== '')
    .map(fieldParser);
}

/**
 * 配对解析器
 * @tip 缺失段按空字符串兜底（如 '5' 视为 '5-'）
 * @param input 输入
 * @param aParser 解析器 A
 * @param bParser 解析器 B
 * @param [separator='-'] 分隔符
 * @returns
 */
export function PairParser<A, B>(
  input: string,
  aParser: FieldParser<A>,
  bParser: FieldParser<B>,
  separator: string = '-',
): [A, B] {
  const [a = '', b = ''] = input.split(separator);
  return [aParser(a), bParser(b)];
}

/**
 * 数值对解析器
 * @param input 输入
 * @param [separator='-'] 分隔符
 * @returns 数值对
 */
export function CountPairParser(input: string, separator: string = '-'): CountPair {
  const [ID, Value] = PairParser(input, IntegerParser, IntegerParser, separator);
  return { id: ID, value: Value };
}

/**
 * 数值对数组解析器
 * @tip 空白段被过滤，不会产生 {ID:0, Value:0} 垃圾条目
 * @param [itemSeparator='-'] 一级分隔符
 * @param [pairSeparator=':'] 二级分隔符
 * @returns 数值对数组
 */
export function CountPairsParser(
  input: string,
  itemSeparator: string = '-',
  pairSeparator: string = ':',
): CountPairs {
  return ArrayParser(
    input,
    function (i: string) {
      return CountPairParser(i, pairSeparator);
    },
    itemSeparator,
  );
}

/**
 * 字典解析器
 * @tip 空白段被过滤；缺失键值分隔符时值按空字符串兜底（如 'a' 视为 'a:'）
 * @param input 输入
 * @param filedParser 字典值解析器
 * @param itemSeparator 键值对之间分隔符
 * @param kvSeparator 键值对内的分隔符
 * @returns
 */
export function DictParser<T>(
  input: string,
  filedParser: FieldParser<T>,
  itemSeparator: string = '-',
  kvSeparator: string = ':',
): Record<string, T> {
  const output: Record<string, T> = {};
  input.split(itemSeparator).forEach((kv) => {
    if (kv.trim() === '') {
      return;
    }
    const [k, v = ''] = kv.split(kvSeparator);
    output[k.trim()] = filedParser(v);
  });
  return output;
}

// sheet

/**
 * 从容器取值，不存在时创建并写回
 * @param map 容器
 * @param key 键
 * @param create 创建函数
 * @returns 值
 */
function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = create();
    map.set(key, value);
  }
  return value;
}

/**
 * 判断字段是否声明了解析器
 * @tip 限定自有属性查找，避免命中 Parser 原型链上的继承成员（如 constructor/valueOf）
 * @param sheet 配置表
 * @param field 字段名
 * @returns 是否声明了解析器
 */
function hasOwnParser(sheet: TabularSheet, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(sheet.parser, field);
}

/**
 * 解析配置表
 * @tip 原始内容非字符串时须提供 ContentParser 完成转换
 * @tip 行以 \n 分隔，列以 , 分隔（Excel 复制格式），空行自动忽略
 * @tip 列表每行一条数据，仅使用首个字段解析器；字典第1行为备注，第2行为字段，以#开头的字段不导出
 * @param sheet 配置表
 * @param logger 日志
 * @returns 解析后的只读数据
 */
function parseSheet(
  sheet: TabularSheet,
  rowSeperator: string = '\n',
  colSeparator: string = ',',
): unknown[] {
  const raw = sheet.contentParser ? sheet.contentParser(sheet.content) : sheet.content;
  if (typeof raw !== 'string') {
    throw new Error(`配置表数据错误 >>> ${sheet.name}`);
  }

  const lines = raw
    .split(rowSeperator)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const logger = journal.acquire(Tabular.prototype.trait);
  const parsers = Object.values(sheet.parser);

  if (sheet.type === 'List') {
    if (parsers.length > 1) {
      logger.warn(`列表仅使用首个字段解析器 >>> ${sheet.name}`);
    }
    return lines.map((line) => parsers[0](line));
  }

  if (lines.length === 0) {
    throw new Error(`配置表无数据 >>> ${sheet.name}`);
  }

  if (lines.length === 1) {
    throw new Error(`配置表缺少字段行 >>> ${sheet.name}`);
  }

  const fields = lines[1].split(colSeparator);
  const missing = fields.filter((field) => !hasOwnParser(sheet, field));
  if (missing.length > 0) {
    logger.warn(`字段缺少解析器，将按原样保留字符串 >>> ${sheet.name}::${missing.join(', ')}`);
  }

  return lines.slice(2).map((line) => {
    const cells = line.split(colSeparator);
    const row: Record<string, unknown> = {};
    fields.forEach((field, index) => {
      const parser = hasOwnParser(sheet, field) ? sheet.parser[field] : undefined;
      const cell = cells[index] ?? '';
      // defineProperty 直接创建自有属性，字段名为 __proto__ 时不会被原型 setter 吞掉或改写行原型
      Object.defineProperty(row, field, {
        value: parser ? parser(cell) : cell,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    });
    return row;
  });
}

// implements

/**
 * 配置表插件
 *
 * - 管理配置表的注册与解析，支持列表与字典两种结构
 * - 查询结果缓存：解析结果缓存、字段键值索引缓存、条件过滤缓存（Where 依赖 filter 引用复用命中）
 * - 配置表数据只读：注册时冻结源数据，解析后深度冻结，任何操作均不修改或删除数据
 */
export class Tabular extends Knot<TabularOptions> implements TabularApi {
  // public

  public get trait(): string {
    return 'tabular';
  }

  public has(name: string): boolean {
    return this.__sheets.has(name);
  }

  public add(sheet: TabularSheet): void {
    if (typeof sheet?.name !== 'string' || sheet.name.length === 0) {
      throw new Error('Tabular sheet name must be a non-empty string');
    }
    // 重复检查前置：重复注册一律忽略，不因新定义携带非法字段而抛错
    if (this.has(sheet.name)) {
      this.logger.warn(`配置表重复注册，已忽略 >>> ${sheet.name}`);
      return;
    }
    if (sheet.type !== 'List' && sheet.type !== 'Dict') {
      throw new Error(`Tabular sheet type must be either List or Dict >>> ${sheet.name}`);
    }
    if (!sheet.parser || Object.keys(sheet.parser).length === 0) {
      throw new Error(`Tabular sheet parser must not be empty >>> ${sheet.name}`);
    }
    if (typeof sheet.content !== 'string' && typeof sheet.contentParser !== 'function') {
      throw new Error(
        `Tabular sheet content must be a string or provide a content parser >>> ${sheet.name}`,
      );
    }
    // 数据只读：冻结表定义（含解析器表）与源数据，后续任何操作均不得修改或删除
    this.__sheets.set(sheet.name, DeepFreeze(sheet));
  }

  public get<T>(name: string): T {
    if (!this.__data.has(name)) {
      this.__data.set(name, DeepFreeze(parseSheet(this.__require(name))));
    }
    return this.__data.get(name) as T;
  }

  public field<T>(name: string, field: string, value: unknown): T {
    // 未注册直接抛错：避免为不存在的表名在 _fields 中驻留空缓存条目
    if (!this.has(name)) {
      throw new Error(`Tabular sheet not registered >>> ${name}`);
    }
    const cache = getOrCreate(
      getOrCreate(this.__fields, name, () => new Map()),
      field,
      () => new Map(),
    );
    if (!cache.has(value)) {
      const rows = this.get<Record<string, unknown>[]>(name);
      // 仅字典（行为对象）参与字段匹配，列表（行为原始值）恒未命中，避免命中 length 等内建属性
      const found = rows.find(
        (row) => typeof row === 'object' && row !== null && row[field] === value,
      );
      // 仅缓存原始值键的命中结果：未命中与对象键不入缓存，防止负缓存与临时对象被无界强引用
      if (
        found !== undefined &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      ) {
        cache.set(value, found);
      }
      return found as T;
    }
    return cache.get(value) as T;
  }

  public where<T>(name: string, filter: (item: T) => boolean): T[] {
    // 未注册直接抛错：避免为不存在的表名在 _filters 中驻留空缓存条目
    if (!this.has(name)) {
      throw new Error(`Tabular sheet not registered >>> ${name}`);
    }
    const cache = getOrCreate(this.__filters, name, () => new WeakMap());
    if (!cache.has(filter)) {
      cache.set(filter, Object.freeze(this.get<T[]>(name).filter(filter)) as unknown[]);
    }
    return cache.get(filter) as T[];
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // private

  /** 表定义注册表（表名 -> 表定义） */
  private readonly __sheets: Map<string, TabularSheet> = new Map();
  /** 解析缓存（表名 -> 解析结果） */
  private readonly __data: Map<string, unknown> = new Map();
  /** 字段查询缓存（表名 -> 字段 -> 值 -> 数据行） */
  private readonly __fields: Map<string, Map<string, Map<unknown, unknown>>> = new Map();
  /** 条件查询缓存（表名 -> 过滤器 -> 数据行数组） */
  private readonly __filters: Map<string, WeakMap<object, unknown[]>> = new Map();

  /**
   * 获取已注册配置表
   * @param name 表名
   * @returns 表定义
   */
  private __require(name: string): TabularSheet {
    const sheet = this.__sheets.get(name);
    if (!sheet) {
      throw new Error(`Tabular sheet not registered >>> ${name}`);
    }
    return sheet;
  }
}
