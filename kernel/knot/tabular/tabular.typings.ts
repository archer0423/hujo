/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { KnotApi, KnotOptions } from '../../core/knot';

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
