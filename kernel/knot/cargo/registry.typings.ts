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
import { CargoItem, CargoURI } from './cargo.typings';

/** 资产注册表配置 */
export interface CargoRegistryOptions extends KnotOptions {
  /** 资产默认存活时间 */
  ttl?: number;
}

/** 资产注册表接口 */
export interface CargoRegistryApi extends KnotApi<CargoRegistryOptions> {
  /** 查询资产是否已注册 */
  has(uri: CargoURI): boolean;
  /** 查询资产 */
  get(uri: CargoURI): CargoItem | undefined;
  /** 注册资产 */
  register(item: CargoItem): void;
  /** 批量注册资产 */
  registerBatch(items: CargoItem[]): void;
}
