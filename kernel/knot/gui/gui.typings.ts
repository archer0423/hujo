/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Component, Constructor, Node } from 'cc';

import { KnotApi, KnotOptions } from '../../core/knot';
import { GuiPresenter, GuiView } from './view';
import { GuiViewApi } from './view.typings';

/** Gui 视图资产 */
export type CargoGuiURI = `${string}@${string}#prefab`;

/** Gui 视图层级 */
export enum GuiLayer {
  /** 世界层（全屏，地图） */
  World,
  /** 主菜单层（一级界面，全屏，主城） */
  Menu,
  /** 全屏窗口层（二级界面，全屏，角色） */
  Screen,
  /** 非模态弹窗层（三级界面，小窗，购买物品） */
  Popup,
  /** 普通模态弹窗层（三级界面，小窗，支付确认，删除数据） */
  Dialog,
  /** 引导层（新手指引） */
  Lead,
  /** 消息提示层（轻量、简短、自动消失） */
  Toast,
  /** 全服通告层（全服重要信息展示，小喇叭） */
  Trumpet,
  /** 加载层（资源加载、网络请求） */
  Load,
  /** 转场层（场景过渡） */
  Transition,
  /** 紧急模态弹窗层（三级界面，小窗，维护通知，网络断开） */
  Alert,
  /** 顶层 */
  Top,
}

/** Gui 视图结构构造 */
export interface GuiStructSchema {
  [k: string]: [path: string, ctor: Constructor<Node | Component>];
}

/** Gui 视图结构 */
export type GuiSchema = Record<string, Node | Component | undefined>;

/** Gui 系统配置 */
export interface GuiOptions extends KnotOptions {
  /** LRU 缓存上限（默认 3） */
  lru?: number;
}

/** 视图资产信息 */
export interface CargoGuiItem {
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

/** Gui 系统接口 */
export interface GuiApi extends KnotApi<GuiOptions> {
  /**
   * 注册视图资产
   * @param item 视图资产项目
   */
  register(item: CargoGuiItem): void;
  /**
   * 批量注册视图资产
   * @param items 视图资产项目
   */
  registerBatch(items: CargoGuiItem[] | Record<string, CargoGuiItem>): void;
  /**
   * 打开视图
   * @param uri 视图资产标识
   */
  open(uri: CargoGuiURI, args?: Record<string, unknown>): Promise<boolean>;
  /**
   * 关闭视图
   * @param view 视图
   */
  close(view: GuiViewApi): Promise<boolean>;
  /**
   * 关闭视图层级
   * @param layer 视图层级
   */
  closeLayer(layer: GuiLayer): Promise<void>;
  /** 返回 */
  back(): Promise<boolean>;
  /** 聚焦到下一个顶层视图 */
  focus(): void;
  /** 使上一个顶层视图失焦 */
  blur(): void;
  /** 刷新遮罩 */
  refreshMask(): void;
}
