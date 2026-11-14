import { native } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../entry';

/** 原生事件监听器 */
export type NativeEventListener = native.OnNativeEventListener;

/** 原生信道结点接口 */
export interface NativeApi extends KnotApi<KnotOptions> {
  /**
   * 添加事件监听器
   * @param event 事件
   * @param listener 监听器
   */
  on(event: string, listener: NativeEventListener): void;
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
}

/**
 * 原生信道结点
 * @tip 为避免混乱，每个信道只支持一个监听，开发者需要清楚每个信道的职责
 */
export class Native extends Knot implements NativeApi {
  // public

  public constructor() {
    super();
    this.__channel = new Map();
  }

  public get trait(): string {
    return 'native';
  }

  public on(event: string, listener: NativeEventListener) {
    if (this.__channel.has(event)) {
      this.off(event);
    }

    if (this.__addEventListener(event, listener)) {
      this.__channel.set(event, listener);
    }
  }

  public once(event: string, listener: NativeEventListener) {
    if (this.__channel.has(event)) {
      this.off(event);
    }

    const wrapper = (arg: string) => {
      this.off(event);
      listener(arg);
    };

    if (this.__addEventListener(event, wrapper)) {
      this.__channel.set(event, wrapper);
    }
  }

  public off(event: string) {
    if (this.__channel.has(event)) {
      if (this.__removeEventListener(event, this.__channel.get(event)!)) {
        this.__channel.delete(event);
      }
    }
  }

  public clear() {
    for (const [event] of this.__channel) {
      this.off(event);
    }
  }

  public get size() {
    return this.__channel.size;
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.clear();
    return Promise.resolve(true);
  }

  // private

  /** 信道容器 */
  private __channel: Map<string, NativeEventListener>;

  /**
   * 添加事件监听器
   * @param event 事件
   * @param listener 监听器
   */
  private __addEventListener(event: string, listener: NativeEventListener) {
    try {
      native.jsbBridgeWrapper.addNativeEventListener(event, listener);
      return true;
    } catch (e) {
      this.logger.error(`监听注册失败 >>> ${event}`, e);
      return false;
    }
  }

  /**
   * 移除事件监听器
   * @param event 事件
   */
  private __removeEventListener(event: string, listener: NativeEventListener) {
    try {
      native.jsbBridgeWrapper.removeNativeEventListener(event, listener);
      return true;
    } catch (e) {
      this.logger.error(`监听移除失败 >>> ${event}`, e);
      return false;
    }
  }
}
