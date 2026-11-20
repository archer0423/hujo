/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { assetManager, Asset } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { Now } from '../../skill/datetime';
import { CargoRegistryApi } from './registry';
import { CargoDigest, CargoURI } from './typings';

/** 资产管理选项 */
export interface CargoMinisterOptions extends KnotOptions {}

/** 资产管理接口 */
export interface CargoMinisterApi extends KnotApi<CargoMinisterOptions> {
  /** 是否存在资产 */
  has(uri: CargoURI): boolean;
  /** 查询资产 */
  get(uri: CargoURI): CargoDigest | undefined;
  /** 增设资产 */
  set(uri: CargoURI, asset: Asset): void;
  /** 移除资产 */
  delete(uri: string): void;
  /** 获取资源的资产标识 */
  getURI(asset: Asset): string | undefined;
  /** 已缓存的资产标识 */
  keys(): string[];
  /**
   * 给宿主分配资产 (增持引用)
   * @param uri 资产标识
   * @param host 宿主
   * @param key 持有资产的键
   */
  alloc<T extends Asset, H extends object, K extends keyof H>(
    uri: CargoURI,
    host: H,
    key: K,
  ): T | null;
  /**
   * 从宿主回收资产 (减持引用)
   * @param host 宿主
   * @param key 持有资产的键
   */
  free<H extends object, K extends keyof H>(host: H, key: K): void;
  /** 释放过时的资产 */
  releaseExpires(): void;
}

/** 资产管理结点 */
export class CargoMinister extends Knot<CargoMinisterOptions> implements CargoMinisterApi {
  // public

  declare public readonly registry: CargoRegistryApi;

  public constructor() {
    super();

    this.__items = new Map();
    this.__lookup = new Map();
  }

  public get trait(): string {
    return 'minister';
  }

  public get deps() {
    return ['registry'];
  }

  public has(uri: CargoURI) {
    return this.__items.has(uri);
  }

  public get(uri: CargoURI) {
    return this.__items.get(uri) as CargoDigest | undefined;
  }

  public set(uri: CargoURI, asset: Asset): void {
    if (!this.registry.has(uri)) {
      this.logger.warn(`资产未注册 >>> ${uri}`);
      return;
    }

    if (asset && asset.isValid) {
      this.__items.set(uri, { asset, uri, recent: Now(), ref: 0, ttl: this.registry.get(uri)! });
      this.__lookup.set(asset, uri);
    } else {
      this.logger.warn(`无效的资产 >>> ${uri}`);
    }
  }

  public delete(uri: CargoURI): void {
    if (this.__items.has(uri)) {
      this.__lookup.delete(this.__items.get(uri)!.asset);
      this.__items.delete(uri);
    }
  }

  public getURI(asset: Asset) {
    return this.__lookup.get(asset);
  }

  public keys() {
    return [...this.__items.keys()];
  }

  public alloc<T extends Asset, H extends object, K extends keyof H>(
    uri: CargoURI,
    host: H,
    key: K,
  ): T | null {
    if (this.has(uri)) {
      // 减持旧资产
      this.free(host, key);
      // 增持新资产
      const digest = this.get(uri)!;
      digest.ref++;
      digest.recent = Now();
      (host as any)[key] = digest.asset;
      return digest.asset! as T;
    }
    return null;
  }

  public free<H extends object, K extends keyof H>(host: H, key: K): void {
    const asset = host[key];
    if (asset && asset instanceof Asset && asset.isValid) {
      const uri = this.getURI(asset);
      if (uri) {
        // 减持引用
        const digest = this.get(uri as CargoURI)!;
        if (digest) {
          const next = digest.ref - 1;
          if (next >= 0) {
            digest.recent = Now();
            digest.ref = next;
          } else {
            this.logger.warn(`不合理的回收 >>> ${uri}`);
          }
        }
      }
      host[key] = null!;
    }
  }

  public releaseExpires() {
    const now = Now();
    this.__items.forEach((_, uri) => {
      this.__releaseURI(uri, now);
    });
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    for (const [uri] of this.__items) {
      this.delete(uri);
    }
    this.__items.clear();

    return Promise.resolve(true);
  }

  // private

  /** 资产概要容器 */
  private __items: Map<CargoURI, CargoDigest>;

  /** 资产与标识映射表 */
  private __lookup: WeakMap<Asset, string>;

  /** 释放资产 */
  private __releaseURI(uri: CargoURI, now?: number): boolean {
    if (this.__items.has(uri)) {
      now ??= Now();
      const digest = this.__items.get(uri)!;
      if (digest.ref === 0 && now - digest.recent > digest.ttl) {
        this.delete(uri);
        assetManager.releaseAsset(digest.asset);
        this.logger.debug(`释放资产 >>> ${uri}`);
        return true;
      }
    }
    return false;
  }
}
