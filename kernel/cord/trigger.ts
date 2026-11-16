/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { journal } from '../core/journal';
import { RunSync } from '../skill/might';

/** 回调方法 */
export interface Handler {
  (...args: unknown[]): unknown;
}

/**
 * 触发器
 */
export class Trigger {
  // public

  /**
   * @param __handler 回调方法
   * @param __ctx 回调上下文
   * @param __once 是否一次性
   * @param __args 回调入参
   */
  public constructor(
    private __handler: Handler,
    private __ctx: unknown,
    private __once: boolean = false,
    private __args: unknown[] = [],
  ) {
    // 直传的数组引用可能被外部变异，构造时快照隔离
    this.__args = __args.slice();
  }

  /**
   * 是否有效
   */
  public get isValid() {
    return !!this.__handler;
  }

  /** 是否一次性 */
  public get once() {
    return this.__once;
  }

  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  public equals(trigger: Trigger) {
    // null 入参不算一致（容器 Del 透传外部值时不可崩溃）
    return !!trigger && this.__handler === trigger.__handler && this.__ctx === trigger.__ctx;
  }

  /**
   * 比较触发器是否一致
   * @param handle 回调方法
   * @param context 回调上下文
   * @returns
   */
  public equalsWith(handle: Handler, context: unknown) {
    return this.__handler === handle && this.__ctx === context;
  }

  /**
   * 运行触发器
   */
  public run() {
    if (this.isValid) {
      const [, err] = RunSync(this.__handler!, this.__ctx!, ...this.__args);
      if (err) {
        journal.system.error('[Trigger] 运行时报错:', err);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   *
   * @tip context 将作为回调的 this；若为 null/undefined，则 RunSync 回退到空对象。
   */
  public runWith(...args: unknown[]) {
    if (this.isValid) {
      const [, err] = RunSync(this.__handler!, this.__ctx!, ...args.concat(this.__args));
      if (err) {
        journal.system.error('[Trigger] 运行时报错:', err);
      }
    }
  }
}

/**
 * 触发器容器
 */
export class Triggers {
  // public

  /**
   * 触发器数量
   */
  public get size(): number {
    return this.__container.length;
  }

  /** 是否为空 */
  public get isEmpty(): boolean {
    return this.__container.length === 0;
  }

  /**
   * 清空触发器
   */
  public clear() {
    this.__container.length = 0;
  }

  /**
   * 添加触发器
   * @param handle 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   * @returns 新建的触发器实例
   */
  public add(
    handle: Handler,
    context: unknown,
    once: boolean = false,
    ...args: unknown[]
  ): Trigger {
    const trigger = new Trigger(handle, context, once, args);
    this.__container.push(trigger);
    return trigger;
  }

  /**
   * 移除触发器（移除全部匹配项）
   * @param trigger 触发器
   * @returns 移除的数量
   */
  public delete(trigger: Trigger): number {
    return this.__removeIf((tr) => tr.equals(trigger));
  }

  /**
   * 移除触发器（移除全部匹配项）
   * @param handle 回调方法
   * @param context 回调上下文
   * @returns 移除的数量
   */
  public deleteWith(handle: Handler, context: unknown): number {
    return this.__removeIf((tr) => tr.equalsWith(handle, context));
  }

  /**
   * 是否包含指定触发器（按 Equals 相等性）
   */
  public has(trigger: Trigger): boolean {
    return this.__container.some((tr) => tr.equals(trigger));
  }

  /**
   * 是否包含指定 handle/context（按 EqualsWith 相等性）
   */
  public hasWith(handle: Handler, context: unknown): boolean {
    return this.__container.some((tr) => tr.equalsWith(handle, context));
  }

  /**
   * 返回容器快照（从注册顺序到当前）
   */
  public toArray(): Trigger[] {
    return this.__container.slice();
  }

  /**
   * 遍历触发器（注册顺序；开始时取快照，遍历中修改容器不影响本次遍历）
   */
  public each(visit: (trigger: Trigger, index: number) => void): void {
    this.__container.slice().forEach((trigger, index) => visit(trigger, index));
  }

  /**
   * 运行触发器
   */
  public run(): void {
    this.__fire((trigger) => trigger.run());
  }

  /**
   * 运行触发器（按添加顺序，快照语义：本轮名单在触发时刻确定）
   * @param args 额外入参（插入到原始入参之前）
   * @returns 本轮实际执行的触发器数量
   */
  public runWith(...args: unknown[]): void {
    this.__fire((trigger) => trigger.runWith(...args));
  }

  // private

  /** 触发器列表 */
  private __container: Trigger[] = [];

  /**
   * 运行触发器并原地压缩移除所有无效和一次性项目
   */
  private __fire(run: (trigger: Trigger) => void): void {
    let write = 0;
    for (const trigger of this.__container) {
      if (trigger.isValid) {
        run(trigger);
        if (!trigger.once) {
          write++;
        }
      }
    }
    this.__container.length = write;
  }

  /** 原地压缩移除匹配项：零分配，批量删除不退化，相对顺序不变 */
  private __removeIf(match: (trigger: Trigger) => boolean): number {
    let write = 0;
    let removed = 0;
    for (let i = 0; i < this.__container.length; i++) {
      const trigger = this.__container[i];
      if (match(trigger)) {
        removed++;
      } else {
        this.__container[write++] = trigger;
      }
    }
    this.__container.length = write;
    return removed;
  }
}
