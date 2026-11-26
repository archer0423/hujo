/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Asset, Constructor } from 'cc';

import { KnotApi, KnotOptions } from '../../core/knot';
import { CargoGuiURI, GuiLayer, GuiStructSchema } from '../gui/typings';
import { GuiPresenter, GuiView } from '../gui/view';

/** 资产构造 */
export type CargoCtor = new (...args: any[]) => Asset;

/** 资产加载状态 */
export enum CargoLoadState {
  /** 未加载 */
  Idle,
  /** 加载中 */
  Loading,
  /** 加载完成 */
  Loaded,
  /** 加载错误 */
  Error,
  /** 加载中断 */
  Aborted,
}

/** 资产加载项目 */
export interface CargoLoadItem {
  /** 资产标识 */
  uri: CargoURI;
  /** 加载状态 */
  state: CargoLoadState;
  /** 加载请求 */
  promise?: Promise<void>;
  /** 中断加载请求 */
  abort: () => void;
}

/** 资产类型 */
export type CargoType =
  | 'image'
  | 'texture'
  | 'sprite-frame'
  | 'sprite-atlas'
  | 'ttfont'
  | 'bmfont'
  | 'buffer'
  | 'text'
  | 'json'
  | 'skeleton'
  | 'audio'
  | 'video'
  | 'particle'
  | 'tiledmap'
  | 'animation'
  | 'prefab';

/**
 * 资产标识（构成）
 * - 动态资产: `bundle@path#type`
 * - 远程资产: `remote@path#type.ext`
 */
export type CargoURI = CargoDynamicURI | CargoRemoteURI;

/** 动态资产标识（构成） */
export type CargoDynamicURI = `${string}@${string}#${CargoType}`;

/** 远程资产标识（构成） */
export type CargoRemoteURI = `remote@${string}#${CargoType}.${string}`;

/** 资产信息 */
export interface CargoItem {
  /** 资产标识 */
  uri: CargoURI;
  /** 存活时间 */
  ttl: number;
  /** 视图别名 */
  alias?: string;
  /** 视图所属层级 */
  layer?: GuiLayer;
  /** 是否支持 LRU 缓存 */
  lru?: boolean;
  /** View 工厂 */
  view?: Constructor<GuiView>;
  /** Presenter 工厂 */
  presenter?: Constructor<GuiPresenter<GuiView>>;
  /** 视图结构 */
  schema?: GuiStructSchema;
}

/** 视图资产信息 */
export interface CargoGuiItem extends CargoItem {
  /** 资产标识 */
  uri: CargoGuiURI;
  /** 视图别名 */
  alias: string;
  /** 视图所属层级 */
  layer: GuiLayer;
  /** 是否支持 LRU 缓存 */
  lru: boolean;
  /** View 工厂 */
  view: Constructor<GuiView>;
  /** Presenter 工厂 */
  presenter: Constructor<GuiPresenter<GuiView>>;
  /** 视图结构 */
  schema: GuiStructSchema;
}

/** 资产概要 */
export interface CargoDigest {
  /** 资产标识 */
  uri: string;
  /** 资产 */
  asset: Asset;
  /** 自维护的引用计数（与引擎的区分开） */
  ref: number;
  /** 最后一次使用的时间（毫秒） */
  recent: number;
  /** 存活时间（毫秒） */
  ttl: number;
}

/** 图集帧定义（plist 归一化后，坐标为图像坐标） */
export interface AtlasFrameDef {
  /** 贴图中的矩形（rotated 时为存储方向尺寸，消费侧交换） */
  rect: { x: number; y: number; width: number; height: number };
  /** 是否旋转 */
  rotated: boolean;
  /** 裁剪中心偏移 */
  offset: { x: number; y: number };
  /** 原始尺寸 */
  originalSize: { width: number; height: number };
}

/** 图集配置 */
export interface AtlasConfig {
  /** 贴图文件名（相对 plist 同目录） */
  textureFile: string;
  /** 帧表（键为帧名） */
  frames: Record<string, AtlasFrameDef>;
}

/** 位图字体字符定义 */
export interface FntCharDef {
  /** 字符在贴图中的矩形（图像坐标，左上原点） */
  rect: { x: number; y: number; width: number; height: number };
  /** 横向偏移 */
  xOffset: number;
  /** 纵向偏移 */
  yOffset: number;
  /** 步进宽度 */
  xAdvance: number;
}

/**
 * 位图字体配置（字段与引擎导入器产物对齐）
 * @tip 渲染侧消费 fontSize/commonHeight/kerningDict/fontDefDictionary
 */
export interface FntConfig {
  /** 字号 */
  fontSize: number;
  /** 通用行高 */
  commonHeight: number;
  /** 贴图文件名 */
  atlasName: string;
  /** 字距表（键为 `(first << 16) | second`） */
  kerningDict: Record<string, number>;
  /** 字符定义表（键为字符码的字符串形式） */
  fontDefDictionary: Record<string, FntCharDef>;
}

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
