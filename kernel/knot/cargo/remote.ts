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
  assetManager,
  sp,
  Asset,
  AudioClip,
  BitmapFont,
  BufferAsset,
  ImageAsset,
  JsonAsset,
  Rect,
  Size,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  Vec2,
  VideoClip,
} from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { Split } from '../../skill/list';
import { CargoMinisterApi } from './minister';
import { ParseFnt } from './parser/fnt-parser';
import { ParsePlistAtlas } from './parser/plist-parser';
import { ParseSpineAtlas } from './parser/spine-atlas-parser';
import { CargoRegistryApi } from './registry';
import { CargoLoadItem, CargoLoadState, RemoteCargoURI } from './typings';
import { ParseCargoURI } from './util';

/** 远程加载器选项 */
export interface CargoRemoteOptions extends KnotOptions {
  /** 资源服务器地址 */
  url: string;
}

/** 远程加载器接口 */
export interface CargoRemoteApi extends KnotApi<CargoRemoteOptions> {
  /** 加载资产 */
  load(uri: RemoteCargoURI): Promise<void>;
  /**
   * 批量加载资产
   * @param items 入参资产
   * @param parallels 每批次并发数量
   */
  loadBatch(items: RemoteCargoURI[], parallels?: number): Promise<void>;
  /** 中断资产加载 */
  abort(uri: RemoteCargoURI): void;
  /** 批量中断资产加载 */
  abortBatch(items: RemoteCargoURI[]): void;
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

/** 远程加载器结点 */
export class CargoRemote extends Knot<CargoRemoteOptions> implements CargoRemoteApi {
  // public

  declare public readonly minister: CargoMinisterApi;
  declare public readonly registry: CargoRegistryApi;

  public constructor() {
    super();

    this.__requests = new Map();
  }

  public get trait() {
    return 'remote';
  }

  public get deps() {
    return ['minister', 'registry'];
  }

  public load(uri: RemoteCargoURI): Promise<void> {
    if (!this.registry.has(uri)) {
      this.logger.warn(`资产未注册 >>> ${uri}`);
      return Promise.resolve();
    }

    if (this.minister.has(uri)) {
      return Promise.resolve();
    }

    if (this.__requests.has(uri)) {
      const item = this.__requests.get(uri)!;
      return item.promise!;
    }

    const [protocol, path, type, ext] = ParseCargoURI(uri);
    if (protocol !== 'remote') {
      this.logger.warn(`无效的地址 >>> ${uri}`);
      return Promise.resolve();
    }

    const item: CargoLoadItem = {
      uri,
      state: CargoLoadState.Loading,
      promise: undefined,
      abort() {
        if (item.state === CargoLoadState.Loading) {
          (item as unknown as { __aborted: boolean }).__aborted = true;
        }
      },
    };
    Object.defineProperty(item, '__aborted', {
      value: false,
      enumerable: false,
      configurable: true,
      writable: true,
    });

    switch (type) {
      case 'image':
        item.promise = this.__wrap(uri, item, this.__pullImage(path, ext));
        break;
      case 'texture':
        item.promise = this.__wrap(uri, item, this.__pullTexture(path, ext));
        break;
      case 'sprite-frame':
        item.promise = this.__wrap(uri, item, this.__pullSpriteFrame(path, ext));
        break;
      case 'sprite-atlas':
        item.promise = this.__wrap(uri, item, this.__pullSpriteAtlas(path, ext));
        break;
      case 'audio':
        item.promise = this.__wrap(uri, item, this.__pullAudio(path, ext));
        break;
      case 'video':
        item.promise = this.__wrap(uri, item, this.__pullVideo(path, ext));
        break;
      case 'text':
        item.promise = this.__wrap(uri, item, this.__pullText(path, ext));
        break;
      case 'json':
        item.promise = this.__wrap(uri, item, this.__pullJson(path, ext));
        break;
      case 'buffer':
        item.promise = this.__wrap(uri, item, this.__pullBuffer(path, ext));
        break;
      case 'bmfont':
        item.promise = this.__wrap(uri, item, this.__pullBMFont(path, ext));
        break;
      case 'skeleton':
        item.promise = this.__wrap(uri, item, this.__pullSkeleton(path, ext));
        break;
      case 'animation':
      case 'particle':
      case 'prefab':
      case 'tiledmap':
      case 'ttfont':
        this.logger.warn(`暂不支持的资产类型 >>> ${uri}`);
        return Promise.resolve();
    }

    return item.promise!;
  }

  public loadBatch(items: RemoteCargoURI[], parallels?: number): Promise<void> {
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

  public abort(uri: RemoteCargoURI): void {
    if (this.__requests.has(uri)) {
      this.__requests.get(uri)!.abort();
      this.__requests.delete(uri);
    }
  }

  public abortBatch(items: RemoteCargoURI[]): void {
    for (const item of items) {
      this.abort(item);
    }
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

  // protected

  protected _attach(): Promise<boolean> {
    // @ts-ignore
    assetManager.downloader['_remoteServerAddress'] = this.options.url;

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

  /** 拼接资源地址 */
  private __joinURL(path: string) {
    return `${this.options.url.replace(/\/+$/, '')}/${encodeURI(path.replace(/^\/+/, ''))}`;
  }

  private __wrap(uri: RemoteCargoURI, item: CargoLoadItem, promise: Promise<[Asset?, Error?]>) {
    return new Promise<void>((resolve) => {
      promise.then(([data]) => {
        if ((item as unknown as { __aborted: boolean }).__aborted) {
          return resolve();
        }
        if (data) {
          this.minister.set(uri, data);
        }
        resolve();
      });
    });
  }

  private __pullRemote<T extends Asset>(path: string): Promise<[T?, Error?]> {
    return new Promise((resolve) => {
      const url = this.__joinURL(path);
      assetManager.loadRemote<T>(url, (err, data) => {
        if (err || !data) {
          this.logger.error(`远程资产加载失败 >>> ${path}}`, err);
          resolve([undefined, err!]);
        } else {
          resolve([data!]);
        }
      });
    });
  }

  private __pullAny<T extends Asset>(path: string, wrap: (data: any) => T): Promise<[T?, Error?]> {
    return new Promise<[T?, Error?]>((resolve) => {
      const url = this.__joinURL(path);
      assetManager.loadAny({ url }, { __isNative__: true }, (err, data) => {
        if (err || !data) {
          this.logger.error(`远程资源加载失败: ${url}`, err);
          resolve([undefined, err!]);
        } else {
          return resolve([wrap(data)]);
        }
      });
    });
  }

  private __joinExt(path: string, ext: string, def: string) {
    return `${path}${ext.length > 1 ? ext : def}`;
  }

  private __pullImage(path: string, ext: string) {
    return this.__pullRemote<ImageAsset>(this.__joinExt(path, ext, '.png'));
  }

  private __pullAudio(path: string, ext: string) {
    return this.__pullRemote<AudioClip>(this.__joinExt(path, ext, '.mp3'));
  }

  private __pullVideo(path: string, ext: string) {
    return this.__pullRemote<VideoClip>(this.__joinExt(path, ext, '.mp4'));
  }

  private __pullText(path: string, ext: string) {
    return this.__pullAny<TextAsset>(this.__joinExt(path, ext, '.txt'), (data) => {
      const asset = new TextAsset();
      asset.text = data;
      asset._nativeAsset = data;
      return asset;
    });
  }

  private __pullJson(path: string, ext: string) {
    return this.__pullAny<JsonAsset>(this.__joinExt(path, ext, '.json'), (data) => {
      const asset = new JsonAsset();
      asset.json = data;
      asset._nativeAsset = data;
      return asset;
    });
  }

  private __pullBuffer(path: string, ext: string) {
    return this.__pullAny<BufferAsset>(this.__joinExt(path, ext, '.bin'), (data) => {
      const asset = new BufferAsset();
      asset._nativeAsset = data;
      return asset;
    });
  }

  private __pullTexture(path: string, ext: string) {
    return new Promise<[Texture2D?, Error?]>((resolve) => {
      this.__pullImage(path, ext).then(([img, err]) => {
        if (img) {
          const tex = new Texture2D();
          tex.image = img;
          resolve([tex]);
        } else {
          resolve([undefined, err]);
        }
      });
    });
  }

  private __pullSpriteFrame(path: string, ext: string) {
    return new Promise<[SpriteFrame?, Error?]>((resolve) => {
      this.__pullTexture(path, ext).then(([tex, err]) => {
        if (tex) {
          const frame = new SpriteFrame();
          frame.texture = tex;
          resolve([frame]);
        } else {
          resolve([undefined, err]);
        }
      });
    });
  }

  private __pullSpriteAtlas(path: string, ext: string) {
    return new Promise<[SpriteAtlas?, Error?]>((resolve) => {
      Promise.all([this.__pullTexture(path, '.png'), this.__pullText(path, '.plist')]).then(
        (items) => {
          const [tex, plist] = items;
          if (tex[0] && plist[0]) {
            const config = ParsePlistAtlas(plist[0].text);
            const atlas = new SpriteAtlas();
            for (const [name, def] of Object.entries(config.frames)) {
              const frame = new SpriteFrame();
              frame.texture = tex[0];
              frame.rect = new Rect(def.rect.x, def.rect.y, def.rect.width, def.rect.height);
              frame.rotated = def.rotated;
              frame.offset = new Vec2(def.offset.x, def.offset.y);
              frame.originalSize = new Size(def.originalSize.width, def.originalSize.height);
              atlas.spriteFrames[name] = frame;
            }
            resolve([atlas]);
          } else {
            resolve([undefined, tex[1] ?? plist[1]]);
          }
        },
      );
    });
  }

  private __pullBMFont(path: string, ext: string) {
    return new Promise<[BitmapFont?, Error?]>((resolve) => {
      Promise.all([this.__pullSpriteFrame(path, '.png'), this.__pullText(path, '.fnt')]).then(
        (items) => {
          const [frame, fnt] = items;
          if (frame[0] && fnt[0]) {
            const config = ParseFnt(fnt[0].text);
            const font = new BitmapFont();
            font.spriteFrame = frame[0];
            font.fntConfig = config;
            font.fontSize = config.fontSize;
            font.onLoaded();
            resolve([font]);
          } else {
            resolve([undefined, frame[1] ?? fnt[1]]);
          }
        },
      );
    });
  }

  private __pullSkeleton(path: string, ext: string) {
    return new Promise<[sp.SkeletonData?, Error?]>((resolve) => {
      if (ext === '.skel') {
        Promise.all([this.__pullText(path, '.atlas'), this.__pullBuffer(path, '.skel')]).then(
          ([atlas, buffer]) => {
            if (atlas[0] && buffer[0]) {
              let pages = [];
              try {
                pages = ParseSpineAtlas(atlas[0].text);
              } catch (e) {
                return resolve([undefined, e as Error]);
              }
              Promise.all(
                pages.map((p) =>
                  this.__pullTexture(path.split('/').slice(0, -2).concat(p).join('/'), '.png'),
                ),
              ).then((images) => {
                if (images.some((m) => m[0] === undefined || m[1] !== undefined)) {
                  return resolve([undefined, images.find((v) => v[1] !== undefined)![1]]);
                } else {
                  const data = new sp.SkeletonData();
                  data.atlasText = atlas[0]!.text;
                  data.textureNames = pages;
                  data.textures = images.map((m) => m[0]!);
                  data._nativeAsset = buffer[0]!.buffer();
                  return resolve([data, undefined]);
                }
              });
            } else {
              return resolve([undefined, atlas[1] ?? buffer[1]]);
            }
          },
        );
      } else {
        Promise.all([this.__pullText(path, '.atlas'), this.__pullText(path, '.json')]).then(
          ([atlas, json]) => {
            if (atlas[0] && json[0]) {
              let pages = [];
              try {
                pages = ParseSpineAtlas(atlas[0].text);
              } catch (e) {
                return resolve([undefined, e as Error]);
              }
              Promise.all(
                pages.map((p) =>
                  this.__pullTexture(path.split('/').slice(0, -2).concat(p).join('/'), '.png'),
                ),
              ).then((images) => {
                if (images.some((m) => m[0] === undefined || m[1] !== undefined)) {
                  return resolve([undefined, images.find((v) => v[1] !== undefined)![1]]);
                } else {
                  const data = new sp.SkeletonData();
                  data.atlasText = atlas[0]!.text;
                  data.textureNames = pages;
                  data.textures = images.map((m) => m[0]!);
                  (data as unknown as { skeletonJson: string }).skeletonJson = json[0]!.text;
                  return resolve([data, undefined]);
                }
              });
            } else {
              return resolve([undefined, atlas[1] ?? json[1]]);
            }
          },
        );
      }
    });
  }
}
