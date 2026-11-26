/** 时钟详情 */

import { KnotApi, KnotOptions } from '../../core/knot';
import { Clock } from './timer';

/** 时钟统计信息 */
export interface ClockStats {
  /** 标识 */
  trait: string;
  /** 数量 */
  size: number;
  /** 速度 */
  speed: number;
}

/** 闹钟监听器 */
export type TimerListener<P extends unknown[] = []> = (...args: P) => void;

/** 监听器配置（环境与一次性标记，以处方为键实现注册幂等） */
export type TimerListenerOptions = [ambient?: unknown, once?: boolean];

/** 闹钟接口 */
export interface AlarmApi {
  /** 闹钟编号 */
  readonly cid: number;
  /** 是否已完成 */
  readonly done: boolean;
  /** 重置（恢复初始配置并重新计时，监听器保留） */
  reset(): void;
  /**
   * 添加计帧监听器
   * @tip 延迟期内不执行计帧回调，延迟结束后随帧触发
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  addFrameListener(process: (dt: number) => void, ambient: unknown, once: boolean): void; /**
   * 添加计次监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  addCountListener(
    process: (count: number, total: number) => void,
    ambient: unknown,
    once: boolean,
  ): void;
  /**
   * 添加计频监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  addFrequencyListener(process: (frequency: number) => void, ambient: unknown, once: boolean): void;
  /**
   * 添加完成监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  addDoneListener(process: () => void, ambient: unknown, once: boolean): void;
  /**
   * 步进
   * @param dt 时间片
   */
  step(dt: number): void;
}

/** 时钟接口 */
export interface ClockApi {
  /** 速度 */
  speed: number;
  /** 运行状态 */
  readonly running: boolean;
  /** 闹钟数量 */
  readonly size: number;
  /** 运行 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /** 重置 */
  reset(): void;
  /** 停止 */
  stop(): void; /**
   * 移除闹钟
   * @param cid 闹钟标识
   */
  remove(cid: number): void; /**
   * 创建延迟闹钟
   * @param delay 延迟时间
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  delay(delay: number, process: () => void, ambient: unknown): number;
  /**
   * 创建一帧延迟闹钟
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  nextFrame(process: () => void, ambient: unknown): number;
  /**
   * 创建重复执行闹钟
   * @param delay 延迟
   * @param interval 间隔
   * @param total 总数
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  repeat(
    delay: number,
    interval: number,
    total: number,
    process: (count: number, total: number) => void,
    ambient: unknown,
  ): number;
  /**
   * 创建永久执行闹钟
   * @param delay 延迟
   * @param interval 间隔
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  loop(
    delay: number,
    interval: number,
    process: (count: number, total: number) => void,
    ambient: unknown,
  ): number;
  /**
   * 创建每帧执行闹钟
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  everyFrame(process: (dt: number) => void, ambient: unknown): number;
  /**
   * 创建频次执行闹钟
   * @param interval 间隔
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  everyFrequency(interval: number, process: (frequency: number) => void, ambient: unknown): number;
  /**
   * 创建每秒执行闹钟
   * @param process 处方
   * @param ambient 环境
   * @returns 闹钟标识
   */
  everySecond(process: (count: number, total: number) => void, ambient: unknown): number;
  /**
   * 时钟步进
   * @param dt 时间增量
   */
  tick(dt: number): void;
}

/** 定时器配置 */
export interface TimerOptions extends KnotOptions {}

/** 定时器接口 */
export interface TimerApi extends KnotApi<TimerOptions> {
  /** 运行状态（外部控制开关，不会影响到时钟内部的运转状态） */
  get running(): boolean;
  /** 时钟数量 */
  get size(): number;
  /** 时钟详情 */
  get stats(): ClockStats[];
  /** 运转 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /**
   * 创建/获取时钟
   * @param token 时钟标识
   */
  acquire(token: string): Clock;
  /**
   * 移除指定时钟
   * @param token 时钟标识
   */
  remove(token: string): void;
  /**
   * 是否有指定时钟
   * @param token 时钟标识
   */
  has(token: string): boolean;
  /** 移除所有时钟 */
  clear(): void;
  /** 用于公共的时钟 */
  get shared(): ClockApi;
  /** 用于巡检的时钟 */
  get inspector(): ClockApi;
}
