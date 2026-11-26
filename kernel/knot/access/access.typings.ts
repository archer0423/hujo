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

/** 访问键 */
export type AccessKey = string | symbol;

/** 可访问环境 */
export type AccessEntry = Record<AccessKey, unknown>;

/** 可访问环境代理 */
export interface AccessDelegate {
  /**
   * 查询键值对
   * @param k 键
   * @returns 是否存在键值对
   */
  has(k: AccessKey): boolean;
  /**
   * 获取键值对的值
   * @param k 键
   * @returns 键值对的值
   */
  get(k: AccessKey): unknown;
  /**
   * 设置键值对
   * @param k 键
   * @param v 值
   */
  set(k: AccessKey, v: unknown): boolean;
  /**
   * 移除键值对
   * @param k 键
   * @returns 操作成功与否
   */
  delete(k: AccessKey): boolean;
  /**
   * 清空键值对
   */
  clear(): void;
  /**
   * 遍历键值对
   * @param visit 访问方法
   */
  each(visit: (v: unknown, k: AccessKey) => void): void;
}

/** 可访问环境接口 */
export interface AccessApi extends KnotApi<KnotOptions> {
  /** 全局环境 */
  global: AccessDelegate;
  /** 用户环境 */
  user: AccessDelegate;
  /** 开发环境 */
  dev: AccessDelegate;
  /** 是否存在环境 */
  has(trait: string): boolean;
  /** 获取指定环境 */
  get(trait: string): AccessDelegate | undefined;
  /**
   * 注入环境
   * @param trait 标识
   * @param env 环境
   */
  put(trait: string, env: AccessEntry): void;
}
