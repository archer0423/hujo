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

/** 原生事件监听器 */
export type NativeEventListener = (data?: NativeRawData) => void;

/** 原生传递数据类型 */
export type NativeDataType = 'boolean' | 'int' | 'float' | 'string' | 'object';

/** 原生传递数据 */
export type NativeRawData =
  | boolean
  | number
  | string
  | { [key: string]: NativeRawData }
  | NativeRawData[];

/** 原生信道结点接口 */
export interface NativeApi extends KnotApi<KnotOptions> {
  /**
   * 添加事件监听器
   * @param event 事件
   * @param listener 监听器
   * @param once 是否一次性，默认 false
   */
  on(event: string, listener: NativeEventListener, once?: boolean): void;
  /**
   * 添加一次性事件监听器
   * @param event 事件
   * @param listener 监听器
   */
  once(event: string, listener: NativeEventListener): void;
  /**
   * 移除事件监听器
   * @param event 事件
   */
  off(event: string): void;
  /** 清空事件监听器 */
  clear(): void;
  /** 事件监听器数量 */
  readonly size: number;
  /**
   * 向原生层传递事件和数据
   * @param event 事件
   * @param arg 入参
   */
  dispatch(event: string, arg?: NativeRawData): void;
}
