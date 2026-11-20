/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { CargoItem, CargoURI } from './typings';

/** 资产注册表选项 */
export interface CargoRegistryOptions extends KnotOptions {
  /** 资产默认存活时间 */
  ttl?: number;
}

/** 资产注册表接口 */
export interface CargoRegistryApi extends KnotApi<CargoRegistryOptions> {
  /** 查询资产是否已注册 */
  has(uri: CargoURI): boolean;
  /** 查询资产 */
  get(uri: CargoURI): number | undefined;
  /** 注册资产 */
  register(item: CargoItem): void;
  /** 批量注册资产 */
  registerBatch(items: CargoItem[]): void;
}

/** 资产注册表结点 */
export class CargoRegistry extends Knot<CargoRegistryOptions> implements CargoRegistryApi {
  // public

  constructor() {
    super();

    this.__registry = new Map();
  }

  public get trait(): string {
    return 'registry';
  }

  public has(uri: CargoURI): boolean {
    return this.__registry.has(uri);
  }

  public get(uri: CargoURI) {
    return this.__registry.get(uri);
  }

  public register(item: CargoItem) {
    const [uri, ttl] = item;
    if (this.has(uri)) {
      this.logger.warn(`资产已注册，即将被覆盖 >>> ${uri}`);
    }
    this.__registry.set(uri, ttl ?? this.options.ttl!);
  }

  public registerBatch(items: CargoItem[]): void {
    for (const item of items) {
      this.register(item);
    }
  }

  // protected

  protected _attach(): Promise<boolean> {
    const ttl = this.options.ttl ?? 0;
    this.options.ttl = isFinite(ttl) ? ttl : 0;

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__registry.clear();

    return Promise.resolve(true);
  }

  // private
  private __registry: Map<string, number>;
}
