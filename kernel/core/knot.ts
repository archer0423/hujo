/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Action, ActionResult } from '../cord/action';
import { journal, JournalLogger } from './journal';

/** 结点选项 */
export interface KnotOptions {}

/** 结点构造 */
export interface KnotCtor<K extends Knot> {
  new (): K;
  readonly Deps?: string[];
}

/** 结点接口 */
export interface KnotApi<P extends KnotOptions> {
  /** 选项（在连接完成后转换为不可变对象） */
  options: Readonly<P>;
  /** 依赖 */
  deps: Readonly<string[]>;
  /** 标识 */
  readonly trait: string;
  /** 专属日志 */
  readonly logger: JournalLogger;
  /** 是否已连接 */
  readonly attached: boolean;
  /** 是否已断开 */
  readonly detached: boolean;
  /**
   * 连接结点
   * @param options 选项
   */
  link(options: P): void;
  /** 连接 */
  attach(): ActionResult;
  /** 断开 */
  detach(): ActionResult;
}

/**
 * 结点
 */
export abstract class Knot<P extends KnotOptions = {}> implements KnotApi<P> {
  // public

  public abstract get trait(): string;

  public get deps(): string[] {
    return [];
  }

  public options!: P;

  public get logger() {
    return journal.acquire(this.trait);
  }

  public get attached() {
    return this.__actionAttach?.success ?? false;
  }

  public get detached() {
    return this.__actionDetach?.success ?? false;
  }

  public link(options: P): void {
    this.options = options;
  }

  public async attach(): ActionResult {
    if (this.__actionAttach) {
      return this.__actionAttach.promise!;
    }

    this.__actionAttach = new Action(this._attach.bind(this));
    await this.__actionAttach.play();

    // 定型
    this.options = Object.freeze(this.options);

    return this.__actionAttach.result!;
  }

  public async detach(): ActionResult {
    if (this.__actionDetach) {
      return this.__actionDetach.promise!;
    }

    this.__actionDetach = new Action(this._detach.bind(this));
    await this.__actionDetach.play();
    return this.__actionDetach.result!;
  }

  // protected

  /** 执行连接 */
  protected abstract _attach(): Promise<boolean>;

  /** 执行断开 */
  protected abstract _detach(): Promise<boolean>;

  // private

  /** 连接动作 */
  private __actionAttach?: Action;
  /** 断开动作 */
  private __actionDetach?: Action;
}
