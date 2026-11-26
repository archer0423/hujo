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
import { CargoRemoteURI } from './cargo.typings';

/** 远程加载器配置 */
export interface CargoRemoteOptions extends KnotOptions {
  /** 资源服务器地址 */
  url: string;
}

/** 远程加载器接口 */
export interface CargoRemoteApi extends KnotApi<CargoRemoteOptions> {
  /** 是否在请求缓存中 */
  has(uri: CargoRemoteURI): boolean;
  /** 加载资产 */
  load(uri: CargoRemoteURI): Promise<void>;
  /**
   * 批量加载资产
   * @param items 入参资产
   * @param parallels 每批次并发数量
   */
  loadBatch(items: CargoRemoteURI[], parallels?: number): Promise<void>;
  /** 中断资产加载 */
  abort(uri: CargoRemoteURI): void;
  /** 批量中断资产加载 */
  abortBatch(items: CargoRemoteURI[]): void;
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
