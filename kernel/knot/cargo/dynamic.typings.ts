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
import { CargoDynamicURI, CargoURI } from './cargo.typings';

/** 动态加载器配置 */
export interface CargoDynamicOptions extends KnotOptions {}

/** 动态加载器接口 */
export interface CargoDynamicApi extends KnotApi<CargoDynamicOptions> {
  /** 是否在请求缓存中 */
  has(uri: CargoDynamicURI): boolean;
  /** 加载资产 */
  load(uri: CargoURI): Promise<void>;
  /**
   * 批量加载资产
   * @param items 入参资产
   * @param parallels 每批次并发数量
   */
  loadBatch(items: CargoDynamicURI[], parallels?: number): Promise<void>;
  /** 中断资产加载 */
  abort(uri: CargoDynamicURI): void;
  /** 批量中断资产加载 */
  abortBatch(items: CargoDynamicURI[]): void;
  /** 放弃缓存 */
  uncache(uri: string): void;
  /** 加载统计 */
  readonly stats: {
    /** 总数 */
    total: number;
    /** 错误数量 */
    error: number;
    /** 已完成数量 */
    loaded: number;
    /** 加载中数量 */
    loading: number;
    /** 已中断数量 */
    aborted: number;
  };
}
