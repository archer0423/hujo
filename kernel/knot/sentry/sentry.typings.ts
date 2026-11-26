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

/** 哨兵监听器 */
export type SentryListener = (...args: unknown[]) => void;

/** 哨兵异常类型 */
export enum SentryErrorType {
  /** JavaScript 错误 */
  JavaScript = 'javascript',
  /** Promise 拒绝 */
  Promise = 'promise',
  /** 原生错误 */
  Native = 'native',
}

/** 哨兵统计 */
export interface SentryStats {
  /** 捕获的错误总数 */
  total: number;
  /** 捕获的 JavaScript 错误总数 */
  javascript: number;
  /** 捕获的 Promise 拒绝总数 */
  promise: number;
  /** 捕获的原生错误总数 */
  native: number;
}

/** 哨兵配置 */
export interface SentryOptions extends KnotOptions {
  /** 设备信息 */
  device?: Record<string, unknown>;
  /** 上报 JavaScript 错误 */
  reportJavascript?: boolean;
  /** 上报 Promise 错误 */
  reportPromise?: boolean;
  /** 上报 Native 错误 */
  reportNative?: boolean;
  /** 上报错误 */
  report?(error: string): void;
}

/** 哨兵接口 */
export interface SentryApi extends KnotApi<SentryOptions> {
  /** 统计信息 */
  get stats(): SentryStats;
}
