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

/** Gui 视图资产 */
export type CargoGuiURI = `${string}@${string}#prefab`;

/** Gui 视图层级 */
export enum GuiLayer {
  /** 世界层（全屏，地图） */
  World,
  /** 主菜单层（一级界面，全屏，主城） */
  Menu,
  /** 窗口层（二级界面，全屏，角色） */
  Screen,
  /** 非模态弹窗层（三级界面，小窗，购买物品） */
  Popup,
  /** 普通模态弹窗层（三级界面，小窗，支付确认，删除数据） */
  Dialog,
  /** 消息提示层（轻量、简短、自动消失） */
  Toast,
  /** 全服通告层（全服重要信息展示，小喇叭） */
  Trumpet,
  /** 引导层（新手指引） */
  Lead,
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
