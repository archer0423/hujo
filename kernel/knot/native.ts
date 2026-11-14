import { native, sys } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../entry';

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
  /**
   * 向原生层传递事件和数据
   * @param event 事件
   * @param arg 入参
   */
  dispatch(event: string, arg?: NativeRawData): void;
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
    if (!sys.isNative) return;

    if (this.__channel.has(event)) {
      this.off(event);
    }

    this.__addEventListener(event, listener);
  }

  public once(event: string, listener: NativeEventListener) {
    if (!sys.isNative) return;

    if (this.__channel.has(event)) {
      this.off(event);
    }

    this.__addEventListener(event, listener, true);
  }

  public off(event: string) {
    if (!sys.isNative) return;

    if (this.__channel.has(event)) {
      this.__removeEventListener(event, this.__channel.get(event)!);
    }
  }

  public clear() {
    if (!sys.isNative) return;

    for (const [event] of this.__channel) {
      this.off(event);
    }

    this.__channel.clear(); // 保底
  }

  public get size() {
    return this.__channel.size;
  }

  public dispatch(event: string, arg?: NativeRawData): void {
    if (!sys.isNative) return;

    const type = typeof arg;
    if (type === 'undefined') {
      this.__dispatch(event);
    } else {
      let payload: [NativeDataType, NativeRawData];
      if (type === 'string') {
        payload = ['string', arg!];
      } else if (type === 'number' && Number.isFinite(arg)) {
        payload = [Number.isInteger(arg) ? 'int' : 'float', arg!];
      } else if (type === 'boolean') {
        payload = ['boolean', arg!];
      } else if (type === 'object' && arg !== null) {
        payload = ['object', arg!];
      } else {
        this.logger.error(`Send 不支持的数据类型: ${type} >>> ${event}`);
        return;
      }

      try {
        const data = JSON.stringify(payload);
        this.__dispatch(event, data);
      } catch (e) {
        this.logger.error(`Send 数据编码失败 >>> ${event}`, e);
      }
    }
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
  private __addEventListener(event: string, listener: NativeEventListener, once: boolean = false) {
    try {
      const wrapper = (data?: string) => {
        if (once) {
          this.off(event);
        }

        if (typeof data === 'undefined') {
          listener();
        } else {
          try {
            const [type, payload] = JSON.parse(data);
            if (
              (type === 'boolean' ||
                type === 'int' ||
                type === 'float' ||
                type === 'object' ||
                type === 'string') &&
              typeof payload
            ) {
              listener(payload);
            } else {
              this.logger.error(`数据解析错误 >>> ${event}`, data);
            }
          } catch (e) {
            this.logger.error(`数据解析错误 >>> ${event}`, data);
          }
        }
      };
      native.jsbBridgeWrapper.addNativeEventListener(event, wrapper);
      this.__channel.set(event, wrapper as NativeEventListener);
    } catch (e) {
      this.logger.error(`添加事件监听失败 >>> ${event}`, e);
    }
  }

  /**
   * 移除事件监听器
   * @param event 事件
   */
  private __removeEventListener(event: string, listener: NativeEventListener) {
    try {
      native.jsbBridgeWrapper.removeNativeEventListener(event, listener);
      this.__channel.delete(event);
    } catch (e) {
      this.logger.error(`移除事件监听失败 >>> ${event}`, e);
    }
  }

  /**
   * 向原生层传递事件和数据
   * @param event 事件
   * @param payload 数据
   */
  private __dispatch(event: string, payload?: string) {
    try {
      native.jsbBridgeWrapper.dispatchEventToNative(event, payload);
    } catch (e) {
      this.logger.error(`Send 向原生层发送消息失败 >>> ${event}`, e);
    }
  }
}
