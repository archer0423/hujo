/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Constructor } from 'cc';

import { KnotApi, KnotOptions } from '../../core/knot';
import { DTO } from './dto';
import { VO } from './vo';

/** 数据模型配置 */
export interface ModelOptions extends KnotOptions {
  /** 模型列表 */
  models: (Constructor<DTO> | Constructor<VO>)[];
}

/** 数据模型接口 */
export interface ModelApi extends KnotApi<ModelOptions> {
  /**
   * 注册数据/视图模型
   * @param o 模型
   */
  register(o: Constructor<DTO> | Constructor<VO>): void;
  /**
   * 批量注册数据/视图模型
   * @param items 模型列表
   */
  registerBatch(items: (Constructor<DTO> | Constructor<VO>)[]): void;
  /**
   * 获取视图模型
   * @param trait 标识
   */
  vo<V extends VO>(trait: string): V;
  /**
   * 获取数据模型
   * @param trait 标识
   */
  dto<D extends DTO>(trait: number): D;
}
