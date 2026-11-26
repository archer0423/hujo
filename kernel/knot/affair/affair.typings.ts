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

/** 事件监听器 */
export type AffairListener = [
  process: (message: AffairPacket) => void,
  ambient: unknown,
  once: boolean,
];

/** 消息数据包 */
export interface AffairPacket<T = unknown> {
  /** 事件 */
  event: string;
  /** 数据 */
  payload: T;
}

/** 事件渠道统计 */
export interface AffairStats {
  /** 渠道 */
  channel: string;
  /** 事件 */
  event: string;
  /** 监听器数量 */
  count: number;
}

/**
 * 事件渠道接口
 */
export interface AffairChannelApi {
  /** 渠道 */
  readonly channel: string;
  /** 监听器数量 */
  readonly size: number;
  /** 渠道详情 */
  readonly stats: AffairStats[];
  /**
   * 事件是否已监听
   * @param event - 事件
   */
  has(event: string): boolean;
  /**
   * 布置监听器
   * @tip 同 (event, process, ambient) 重复布置以首次注册为准，once 不可通过重复布置更新
   * @param event - 事件
   * @param process - 处理方式
   * @param ambient - 环境
   * @param once - 是否一次性
   */
  add(
    event: string,
    process: (message: AffairPacket) => void,
    ambient: unknown,
    once?: boolean,
  ): void;
  /**
   * 撤销指定监听器
   * @param event - 事件
   * @param process - 处理方式
   * @param ambient - 环境
   */
  remove(event: string, process: (message: AffairPacket) => void, ambient: unknown): void;
  /**
   * 撤销指定事件和环境的所有监听器
   * @param ambient - 环境
   * @param event - 事件
   */
  removeAmbient(ambient: unknown, event?: string): void;
  /**
   * 撤销指定代号的所有监听器
   * @param event - 事件
   */
  removeEvent(event: string): void;
  /** 在默认渠道上撤销所有监听器 */
  clear(): void;
  /**
   * 通报
   * @tip 非快照语义：执行期间新增的同事件监听器会在本轮即被迭代执行；
   *      once 监听器执行后立即移除（嵌套通报不会重复执行）
   * @param message - 数据（不可为空）
   */
  notify(msg: AffairPacket | string, payload?: AffairPacket['payload']): void;
}

/** 事件总线插件配置 */
export interface AffairOptions extends KnotOptions {}

/**
 * 事件总线接口
 */
export interface AffairApi extends KnotApi<AffairOptions> {
  /** 监听器数量 */
  get size(): number;
  /** 渠道详情 */
  get stats(): AffairStats[];
  /**
   * 渠道是否已部署
   * @param channel - 渠道
   */
  has(channel: string): boolean;
  /**
   * 获取事件渠道
   * @param channel 渠道
   */
  acquire(channel: string): AffairChannelApi;
  /**
   * 移除渠道
   * @param channel - 渠道
   */
  remove(channel: string): void;
  /** 清空所有渠道 */
  clear(): void;
  /** 默认事件渠道（访问即创建） */
  get sys(): AffairChannelApi;
  /** GUI 事件渠道（访问即创建） */
  get gui(): AffairChannelApi;
  /** HTTP 事件渠道（访问即创建） */
  get http(): AffairChannelApi;
  /** socket 事件渠道（访问即创建） */
  get net(): AffairChannelApi;
  /** Red 事件渠道（访问即创建） */
  get red(): AffairChannelApi;
}
