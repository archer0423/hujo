/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { assetManager } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { Split } from '../../skill/list';
import { CargoApi } from './cargo';
import { CargoRegistryApi } from './registry';
import { CargoDynamicURI, CargoLoadItem, CargoLoadState, CargoURI } from './typings';
import { GetCargoFactory, IsValidCargoURI, ParseCargoURI } from './util';

/** 动态加载器选项 */
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

/**
 * 动态加载器结点
 * @tip 加载器会缓存加载结果以加速请求
 * @tip 如果该资源已释放，需要同步移除缓存
 */
export class CargoDynamic extends Knot<CargoDynamicOptions> implements CargoDynamicApi {
  // public

  declare public readonly cargo: CargoApi;
  declare public readonly registry: CargoRegistryApi;

  public constructor() {
    super();

    this.__requests = new Map();
  }

  public override get trait() {
    return 'dynamic';
  }

  public override get deps() {
    return ['cargo', 'registry'];
  }

  public uncache(uri: CargoDynamicURI): void {
    this.__requests.delete(uri);
  }

  public has(uri: CargoDynamicURI): boolean {
    return this.__requests.has(uri);
  }

  public get stats() {
    const stats = {
      loading: 0,
      aborted: 0,
      loaded: 0,
      error: 0,
      total: 0,
    };
    for (const [, req] of this.__requests) {
      stats.total++;
      switch (req.state) {
        case CargoLoadState.Loading:
          stats.loading++;
          break;
        case CargoLoadState.Loaded:
          stats.loaded++;
          break;
        case CargoLoadState.Aborted:
          stats.aborted++;
          break;
        case CargoLoadState.Error:
          stats.error++;
          break;
      }
    }
    return stats;
  }

  public async load(uri: CargoDynamicURI): Promise<void> {
    if (!this.registry.has(uri)) {
      this.logger.warn(`资产未注册 >>> ${uri}`);
      return Promise.resolve();
    }

    if (this.cargo.has(uri)) {
      return Promise.resolve();
    }

    if (this.__requests.has(uri)) {
      const item = this.__requests.get(uri)!;
      return item.promise!;
    }

    let aborted = false;
    const item: CargoLoadItem = {
      uri,
      state: CargoLoadState.Loading,
      promise: undefined,
      abort() {
        if (item.state === CargoLoadState.Loading) {
          aborted = true;
        }
      },
    };
    item.promise = new Promise<void>((resolve) => {
      this.__load(uri).then((loaded) => {
        if (aborted) {
          item.state = CargoLoadState.Aborted;
          return resolve();
        }

        if (loaded) {
          item.state = CargoLoadState.Loaded;
        } else {
          item.state = CargoLoadState.Error;
        }

        return resolve();
      });
    });
    this.__requests.set(uri, item);

    return item.promise!;
  }

  public async loadBatch(items: CargoDynamicURI[], parallels?: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const promises = items.map((item) => this.load(item));
      if (parallels && Number.isInteger(parallels) && parallels > 0) {
        const wrappers = Split(promises, parallels).map((item) => Promise.all(item));
        Promise.all(wrappers).then(() => resolve());
      } else {
        Promise.all(promises).then(() => resolve());
      }
    });
  }

  public abort(uri: CargoDynamicURI): void {
    if (this.__requests.has(uri)) {
      this.__requests.get(uri)!.abort();
      this.__requests.delete(uri);
    }
  }

  public abortBatch(items: CargoDynamicURI[]): void {
    for (const item of items) {
      this.abort(item);
    }
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__requests.forEach((r) => r.abort());
    this.__requests.clear();
    return Promise.resolve(true);
  }

  // private

  /** 请求容器 */
  private __requests: Map<string, CargoLoadItem>;

  /**
   * 加载资产
   * @param uri 资产标识
   * @returns
   */
  private __load(uri: CargoDynamicURI): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!IsValidCargoURI(uri)) {
        this.logger.error(`无效的资产标识 >>> ${uri}`);
        return resolve(false);
      }

      const [bun, path, type] = ParseCargoURI(uri);
      assetManager.loadBundle(bun, (err, bundle) => {
        if (err) {
          this.logger.error(`资源包不存在 >>> ${bun}`);
          return resolve(false);
        }

        if (!bundle.getInfoWithPath(path, GetCargoFactory(type))) {
          this.logger.error(`资源不存在 >>> ${uri}`);
          return resolve(false);
        }

        let url = path;
        if (type === 'sprite-frame') {
          url = path + '/spriteFrame';
        } else if (type === 'texture') {
          url = path + '/texture';
        }
        bundle.load(url, (err, asset) => {
          if (err) {
            this.logger.error(`资源加载失败 >>> ${uri}`);
            return resolve(false);
          } else {
            this.cargo.set(uri, asset!);
            return resolve(true);
          }
        });
      });
    });
  }
}
