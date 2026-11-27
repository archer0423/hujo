/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { ClearProperties } from '../../skill/dict';
import { RunSync } from '../../skill/might';

/** 监听器 */
type Listener = (newV: any, oldV: any) => void;

/** 数据模型 */
export abstract class DTO<D extends object = {}> {
  // public

  /** 标识（消息号） */
  public abstract get trait(): number;

  /** 数据同步 */
  public abstract sync(data: D): void;

  /** 模型类型 */
  public get mtype(): string {
    return 'dto';
  }

  public constructor() {
    this.__onceMappings = new WeakMap();
    this.__listeners = new Map();
    this.__dirtyFlags = {};
  }

  /** 初始化 */
  public initialize() {}

  /** 重置 */
  public reset() {
    ClearProperties(this.__dirtyFlags);
    this.__listeners.clear();
  }

  /**
   * 添加属性监听
   * @param property 属性
   * @param listener 监听器
   * @param once 是否一次性
   */
  public on(property: string, listener: Listener, once: boolean = false): void {
    if (typeof (<any>this)[property] !== undefined) {
      if (this.__listeners.has(property)) {
        this.__listeners.get(property)!.add(listener);
      } else {
        this.__listeners.set(property, new Set([listener]));
      }
      this.__onceMappings.set(listener, once);
    }
  }

  /**
   * 解除属性监听
   * @param property 属性
   * @param listener 监听器
   */
  public off(property: string, listener: Listener): void {
    this.__listeners.get(property)?.delete(listener);
  }

  /**
   * 解除指定属性上的所有监听
   * @param property 属性
   */
  public offProperty(property: string): void {
    this.__listeners.delete(property);
  }

  /** 解除所有监听 */
  public offAll() {
    this.__listeners.clear();
  }

  // protected

  /**
   * 属性是否被主动修改了
   * @param property 属性
   * @returns
   */
  protected _isPropertyDirty(property: string) {
    return !!this.__dirtyFlags[property];
  }

  /**
   * 为属性设置脏标记
   * @param property 属性
   * @param dirty 脏标记
   */
  protected _setPropertyDirty(property: string, dirty: boolean = true) {
    this.__dirtyFlags[property] = dirty;
  }

  /**
   * 便捷监听
   * @param property 属性
   * @param once 是否一次性
   */
  protected _watch(property: string, once: boolean = false) {
    this.on(property, this._notify.bind(this, property), once);
  }

  /**
   * 通知属性内容变化
   * @param property 属性
   * @param newV 新值
   * @param oldV 旧值
   */
  protected _notify(property: string, newV: any, oldV: any): void {
    if (this.__listeners.has(property)) {
      const items = this.__listeners.get(property)!;
      for (const item of items) {
        RunSync(item, undefined, newV, oldV);
        if (this.__onceMappings.get(item)) {
          items.delete(item);
        }
      }
      if (items.size === 0) {
        this.__listeners.delete(property);
      }
    }
  }

  // private

  /** 监听器容器  */
  private __listeners: Map<string, Set<Listener>>;
  /** 一次性监听器映射表 */
  private __onceMappings: WeakMap<Listener, boolean>;
  /** 数据是否被主动修改（是，通知服务器应用修改） */
  private __dirtyFlags: Record<string, boolean>;
}
