/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { journal } from '../../core/journal';
import { Knot } from '../../core/knot';
import { RunSync } from '../../skill/might';
import {
  AffairApi,
  AffairChannelApi,
  AffairListener,
  AffairOptions,
  AffairPacket,
  AffairStats,
} from './affair.typings';

/**
 * 事件消息
 * @final
 */
export class AffairMessage<T = unknown> implements AffairPacket<T> {
  /** 不带数据包的消息 */
  public static NoPayload(event: string) {
    return new AffairMessage<undefined>(event);
  }

  /** 带数据包的消息 */
  public static WithPayload<D>(event: string, payload: D) {
    return new AffairMessage<D>(event, payload);
  }

  public readonly event: string;
  public readonly payload: T;

  // 重载1：T 不是 undefined，data 必须传
  private constructor(event: string, data: T);

  // 重载2：T 是 undefined，data 可省略
  private constructor(event: string, data?: undefined);

  private constructor(event: string, data?: T) {
    this.event = event;
    this.payload = data as T;
  }
}

/**
 * 事件渠道
 */
export class AffairChannel implements AffairChannelApi {
  // public

  public readonly channel: string;

  public constructor(channel: string) {
    this.channel = channel;
    this.__listeners = new Map();
  }

  public get size(): number {
    let count = 0;
    this.__listeners.forEach((processMap) => {
      processMap.forEach((ambientMap) => {
        count += ambientMap.size;
      });
    });
    return count;
  }

  public get stats(): AffairStats[] {
    const stats: AffairStats[] = [];
    this.__listeners.forEach((processMap, event) => {
      let listeners = 0;
      processMap.forEach((ambientMap) => {
        listeners += ambientMap.size;
      });
      stats.push({ channel: this.channel, event: event, count: listeners });
    });

    return stats;
  }

  public has(event: string): boolean {
    return this.__listeners.has(event);
  }

  public add(
    event: string,
    process: (message: AffairPacket) => void,
    ambient: unknown,
    once?: boolean,
  ): void {
    if (ambient === undefined || ambient === null) {
      this.__logger.error('<AffairChannel> ambient 不允许为空');
      return;
    }

    if (!this.__listeners.has(event)) {
      this.__listeners.set(event, new Map());
    }

    const processMap = this.__listeners.get(event)!;

    // 获取或创建该 process 的 ambient 映射
    let ambientMap = processMap.get(process);
    if (!ambientMap) {
      ambientMap = new Map();
      processMap.set(process, ambientMap);
    }

    // O(1) 检查是否已存在（以首次注册为准，once 不可通过重复 Add 更新）
    if (ambientMap.has(ambient)) {
      return;
    }

    const listener: AffairListener = [process, ambient, once!];
    ambientMap.set(ambient, listener);
  }

  public remove(event: string, process: (message: AffairPacket) => void, ambient: unknown): void {
    if (this.__listeners.has(event)) {
      const processMap = this.__listeners.get(event)!;
      const ambientMap = processMap.get(process);
      if (ambientMap) {
        // O(1) 删除
        ambientMap.delete(ambient);

        // 如果该 process 没有其他 ambient 了，清理 processMap 条目
        if (ambientMap.size === 0) {
          processMap.delete(process);

          // 如果该 event 没有其他 process 了，清理 event 条目
          if (processMap.size === 0) {
            this.__listeners.delete(event);
          }
        }
      }
    }
  }

  public removeAmbient(ambient: unknown, event?: string): void {
    if (event) {
      if (this.__listeners.has(event)) {
        const processMap = this.__listeners.get(event)!;
        // 遍历所有 process，删除指定 ambient
        // 注意：这里仍然是 O(n)，但通常 unlistenAmbient 使用较少
        for (const [process, ambientMap] of processMap) {
          ambientMap.delete(ambient);
          if (ambientMap.size === 0) {
            processMap.delete(process);
          }
        }

        // 如果该 event 已无任何监听器，清理 event 条目
        if (processMap.size === 0) {
          this.__listeners.delete(event);
        }
      }
    } else {
      this.__listeners.forEach((_, event) => {
        this.removeAmbient(ambient, event);
      });
    }
  }

  public removeEvent(event: string): void {
    this.__listeners.delete(event);
  }

  public clear(): void {
    this.__listeners.clear();
  }

  public notify(msg: AffairPacket | string, payload?: AffairPacket['payload']): void {
    if (typeof msg === 'string') {
      if (typeof payload === 'undefined') {
        msg = AffairMessage.NoPayload(msg);
      } else {
        msg = AffairMessage.WithPayload(msg, payload);
      }
    }

    if (msg === null || msg === undefined) {
      this.__logger.error('<AffairChannel> 通报失败：消息不可为空');
      return;
    }
    if (!msg.event || typeof msg.event !== 'string') {
      this.__logger.error('<AffairChannel> 通报失败：消息 Event 必须为非空字符串');
      return;
    }

    const processMap = this.__listeners.get(msg.event);
    if (!processMap) {
      return;
    }

    // 快照迭代，避免在回调中修改 Map 导致迭代异常
    const processEntries = Array.from(processMap.entries());
    for (const [process, ambientMap] of processEntries) {
      const currentProcessMap = this.__listeners.get(msg.event);
      if (!currentProcessMap) {
        break;
      }
      const currentAmbientMap = currentProcessMap.get(process);
      if (!currentAmbientMap) {
        continue;
      }
      const ambientEntries = Array.from(currentAmbientMap.entries());
      for (const [ambient, listener] of ambientEntries) {
        // 检查监听器是否仍存在（可能已被 Remove/RemoveAmbient 移除）
        if (!currentAmbientMap.has(ambient)) {
          continue;
        }
        const [processFn, ambientObj, once] = listener;
        // once 先删后执行：回调内嵌套 Notify 不会重复执行
        if (once) {
          currentAmbientMap.delete(ambient);
          if (currentAmbientMap.size === 0) {
            currentProcessMap.delete(process);
            if (currentProcessMap.size === 0) {
              this.__listeners.delete(msg.event);
              break;
            }
          }
        }
        const err = RunSync(processFn, ambientObj, msg)[1];
        if (err) this.__logger.error('<AffairChannel> 监听器执行报错：', err);
      }
      // 如果 event 已被删除，跳出外层循环
      if (!this.__listeners.has(msg.event)) {
        break;
      }
    }
  }

  // private

  /**
   * 数据结构：Map<event, Map<process, Map<ambient, listener>>>
   *
   * - 外层 Map：按 event 分组
   * - 中层 Map：按 process 分组
   * - 内层 Map：按 ambient 分组，支持同一 process 的多个 ambient
   *
   * 查找复杂度：O(1)
   */
  private __listeners: Map<string, Map<AffairListener[0], Map<AffairListener[1], AffairListener>>>;

  /** 专属日志记录器 */
  private get __logger() {
    return journal.acquire(Affair.prototype.trait);
  }
}

/**
 * 事件总线结点
 */
export class Affair extends Knot<AffairOptions> implements AffairApi {
  // public

  public get trait(): string {
    return 'affair';
  }

  public constructor() {
    super();
    this.__channels = new Map();
  }

  public get size(): number {
    return this.__channels.size;
  }

  public get stats(): AffairStats[] {
    const stats: AffairStats[] = [];
    this.__channels.forEach((channel) => {
      stats.push(...channel.stats);
    });
    return stats;
  }

  public get sys(): AffairChannel {
    return this.acquire('sys');
  }

  public get gui(): AffairChannel {
    return this.acquire('gui');
  }

  public get http(): AffairChannel {
    return this.acquire('http');
  }

  public get net(): AffairChannel {
    return this.acquire('net');
  }

  public get red(): AffairChannel {
    return this.acquire('red');
  }

  public acquire(channel: string): AffairChannel {
    if (this.__channels.has(channel)) {
      return this.__channels.get(channel)!;
    } else {
      const instance = new AffairChannel(channel);
      this.__channels.set(channel, instance);
      return instance;
    }
  }

  public remove(channel: string) {
    if (this.__channels.has(channel)) {
      this.__channels.get(channel)!.clear();
      this.__channels.delete(channel);
    }
  }

  public clear() {
    this.__channels.forEach((channel) => channel.clear());
    this.__channels.clear();
  }

  public has(channel: string): boolean {
    return this.__channels.has(channel);
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

  /** 事件渠道容器 */
  private __channels: Map<string, AffairChannel>;
}
