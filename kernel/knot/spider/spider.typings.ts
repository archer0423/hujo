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

/** Cocos Creator Spider */
export interface CCSpider {
  /**
   * 获取字段
   * @param trait 字段名称
   */
  get<T>(trait: string): T;
  /**
   * 添加或更新字段
   * @param trait 字段名称
   * @param value 字段值
   */
  add(trait: string, value: string): void;
  /**
   * 更新字段
   * @param trait 字段名称
   * @param value 字段值
   */
  update(trait: string, value: string): void;
  /**
   * 移除字段
   * @param trait 字段名称
   */
  remove(trait: string): void;
  /** 清空所有字段 */
  clear(): void;
  /** 显示面板 */
  show(): void;
  /** 隐藏面板 */
  hide(): void;
}

/** 监视器静态项目 */
export interface SpiderStaticField {
  /** 字段名称 */
  trait: string;
  /** 字段值 */
  value: string;
}

/** 监视器动态项目 */
export interface SpiderDynamicField {
  /** 字段名称 */
  trait: string;
  /** 更新频率 */
  interval: number;
  /** 输出值 */
  output(): string;
}

/** 监视器手动项目 */
export interface SpiderManualField {
  /** 字段名称 */
  trait: string;
  /** 输出值 */
  output(): string;
  /** 初始化 */
  init(): void;
  /** 销毁 */
  destroy(): void;
}

/** 监视器项目（静态、动态、手动） */
export type SpiderFields = SpiderStaticField | SpiderDynamicField | SpiderManualField;

/** 数据监视器配置 */
export interface SpiderOptions extends KnotOptions {
  spider: CCSpider;
}

/** 字段生命周期元数据：清理所需的一切由能力侧自行登记，不依赖 Inspector 内部存储 */
export interface SpiderFieldMeta {
  /**
   * 动态字段的定时器 id
   * @tip 本插件仅在浏览器环境（MISC.BROWSER）工作，setInterval 实际返回 number；
   *      Node 的 clearInterval 亦兼容 number 传入，双端均可正确清除
   */
  timer?: number;
  /** 手动字段描述（Destroy 据此调用） */
  manual?: SpiderManualField;
}

/** 数据监视器插件接口 */
export interface SpiderApi extends KnotApi<SpiderOptions> {
  /** 功能是否可用 */
  get available(): boolean;
  /** 显示面板 */
  show(): void;
  /** 隐藏面板 */
  hide(): void;
  /** 添加字段（Spider 不可用时拒绝并告警） */
  add(field: SpiderFields): void;
  /** 移除字段（不受可用性守卫：容器清理始终执行，面板移除经 RunSync 兜底） */
  remove(name: string): void;
  /** 清空（监视器所持的）所有字段（不受可用性守卫） */
  clear(): void;
}
