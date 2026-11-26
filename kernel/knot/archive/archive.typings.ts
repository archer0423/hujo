/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import {
  KnotApi,
  KnotOptions,
} from '../../core/knot';

/** 存储值类型（只允许布尔值/数值/字符串） */
export type ArchiveItemValue = boolean | number | string;

/** 存储字段形式 */
export type ArchiveItemKey = `${string}@${'b' | 'n' | 's'}`;

/** 存储项配置 */
export type ArchiveField<V extends ArchiveItemValue> = [trait: ArchiveItemKey, defalut: V];

/** 存档接口 */
export interface ArchiveDocumentApi {
  /** 应用标识 */
  readonly app: string;
  /** 存档标识 */
  readonly doc: string;
  /**
   * 安装所有字段（一次性）
   * @param fields 字段入参
   */
  install(fields: ArchiveField<ArchiveItemValue>[]): void;
  /**
   * 读取字段
   * @param trait 字段标识
   * @returns 字段内容
   * @throws
   */
  read<V extends ArchiveItemValue>(trait: ArchiveItemKey): V;
  /**
   * 写入字段
   * @param trait 字段标识
   * @param value 字段内容
   * @throws
   */
  write<V extends ArchiveItemValue>(trait: ArchiveItemKey, value: V): void;
  /** 保存脏字段 */
  saveDirty(): void;
  /** 强制保存存档 */
  save(): void;
  /** 删除存档 */
  prune(): void;
  /**
   * 添加字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   */
  on(trait: ArchiveItemKey, listener: ArchiveListener): void;
  /**
   * 添加一次性字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   * @returns 包装后的监听器（用于手动移除监听器）
   */
  once(trait: ArchiveItemKey, listener: ArchiveListener): ArchiveListener;
  /**
   * 移除字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   */
  off(trait: ArchiveItemKey, listener: ArchiveListener): void;
  /**
   * 移除指定字段的所有监听器
   * @param trait 字段标识
   */
  offTargeted(trait: ArchiveItemKey): void;
  /** 移除所有字段监听器 */
  offAll(): void;
}

/** 存档配置 */
export interface ArchiveOptions extends KnotOptions {
  /** 应用名称 */
  app: string;
  /** 序列化 */
  serialize?: (text: string) => string;
  /** 反序列化 */
  deserialize?: (text: string) => string;
  /** 自动保存时间间隔（默认 30 秒） */
  autoSaveInterval?: number;
}

/** 存档结点接口 */
export interface ArchiveApi extends KnotApi<ArchiveOptions> {
  /**
   * 获取/创建存档
   * @param doc 存档标识
   * @param fields 字段
   * @throws 如果存档已存在则会抛出错误
   * @returns
   */
  create(doc: string, fields: ArchiveField<ArchiveItemValue>[]): ArchiveDocumentApi;
  /**
   * 获取存档
   * @param doc 存档标识
   * @returns 存档
   */
  get(doc: string): ArchiveDocumentApi | undefined;
  /**
   * 删除存档
   * @param doc 存档标识
   */
  delete(doc: string): void;
  /** 保存所有存档 */
  save(): void;
}

/** 存档监听器 */
export type ArchiveListener = (curr: ArchiveItemValue, prev: ArchiveItemValue) => void;
