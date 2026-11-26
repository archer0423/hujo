/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { director, game, Director } from 'cc';

import { journal } from '../../core/journal';
import { Knot } from '../../core/knot';
import { RunSync } from '../../skill/might';
import {
  AlarmApi,
  ClockApi,
  ClockStats,
  TimerApi,
  TimerListener,
  TimerListenerOptions,
  TimerOptions,
} from './timer.typings';

/** 闹钟 */
export class Alarm implements AlarmApi {
  // public static

  /** 重置编号计数器（仅在所有闹钟清理后安全调用） */
  public static ResetCounter() {
    Alarm.Counter = 0;
  }

  // private static

  /** 单帧计次迭代上限（防止大时间片补帧风暴） */
  private static readonly MAX_STEPS: number = 32;

  /** 闹钟编号计数器 */
  private static Counter: number = 0;

  // public

  /**
   * 闹钟构造
   * @param delay 延迟时间
   * @param interval 计次间隔
   * @param total 计次总数
   */
  public constructor(delay: number, interval: number, total: number) {
    this.__cid = Alarm.Counter++;
    this.__initialDelay = delay;
    this.__initialInterval = interval;
    this.__delay = delay;
    this.__interval = interval;
    this.__total = total;
    this.__count = 0;
    this.__rest = 0;
    this.__accumulated = 0;
    this.__started = false;
    this.__done = false;
  }

  public get cid() {
    return this.__cid;
  }

  public get done() {
    return this.__done;
  }

  public reset(): void {
    this.__delay = this.__initialDelay;
    this.__interval = this.__initialInterval;
    this.__count = 0;
    this.__rest = 0;
    this.__accumulated = 0;
    this.__started = false;
    this.__done = false;
  }

  public addFrameListener(process: (dt: number) => void, ambient: unknown, once: boolean) {
    (this.__frameListeners ??= new Map()).set(process, [ambient, once]); // 同一处方重复注册时覆盖
  }

  public addCountListener(
    process: (count: number, total: number) => void,
    ambient: unknown,
    once: boolean,
  ) {
    (this.__countListeners ??= new Map()).set(process, [ambient, once]); // 同一处方重复注册时覆盖
  }

  public addFrequencyListener(
    process: (frequency: number) => void,
    ambient: unknown,
    once: boolean,
  ) {
    (this.__frequencyListeners ??= new Map()).set(process, [ambient, once]); // 同一处方重复注册时覆盖
  }

  public addDoneListener(process: () => void, ambient: unknown, once: boolean) {
    (this.__doneListeners ??= new Map()).set(process, [ambient, once]); // 同一处方重复注册时覆盖
  }

  public step(dt: number) {
    if (this.__done) return;
    if (!Number.isFinite(dt) || dt < 0) return; // 拒绝非法时间片，防止 NaN 污染累积量与时间倒流

    this.__accumulated += dt;
    if (this.__accumulated < this.__delay) return;

    // 仅把 delay 之后的超量时间记入计次，避免 crossing 帧把延迟时长也计入
    if (!this.__started) {
      this.__started = true;
      this.__rest = Math.max(0, this.__accumulated - this.__delay);
    } else {
      this.__rest += dt;
    }
    this.__runFrameListener(dt);
    if (dt === 0) return; // 时间片为零时计次无法推进，跳过以防死循环

    const step = this.__interval > 0 ? this.__interval : dt; // 步长非法（零、负数或 NaN）时取时间片，否则会死循环
    let budget = Alarm.MAX_STEPS; // 单帧计次预算
    while (this.__rest >= step && budget > 0) {
      this.__rest -= step;
      this.__count++;
      this.__runFrequencyListener(step);
      this.__runCountListener();
      if (this.__total > 0 && this.__count >= this.__total) {
        this.__done = true;
        this.__runDoneListener();
        break;
      }
      budget--;
    }
    if (!this.__done && budget === 0 && this.__rest >= step) {
      this.__rest = 0; // 预算耗尽仍有欠账，丢弃以防后续帧持续饱和
    }
  }

  // private

  /** 闹钟编号 */
  private readonly __cid: number;
  /** 初始延迟时间 */
  private readonly __initialDelay: number;
  /** 初始计次间隔 */
  private readonly __initialInterval: number;
  /** 延迟时间 */
  private __delay: number;
  /** 计次总数 */
  private readonly __total: number;
  /** 计次间隔 */
  private __interval: number;
  /** 当前计次 */
  private __count: number;
  /** 累积时间 */
  private __accumulated: number;
  /** 是否完成 */
  private __done: boolean;
  /** 计次之后的残留时间 */
  private __rest: number;
  /** 是否已越过初始延迟（用于避免 crossing 帧把延迟时长也记入计次） */
  private __started: boolean;
  /** 计次监听器集合 */
  private __countListeners?: Map<
    TimerListener<[count: number, total: number]>,
    TimerListenerOptions
  >;
  /** 计帧监听器集合 */
  private __frameListeners?: Map<TimerListener<[dt: number]>, TimerListenerOptions>;
  /** 计频监听器集合 */
  private __frequencyListeners?: Map<TimerListener<[frequency: number]>, TimerListenerOptions>;
  /** 完成监听器集合 */
  private __doneListeners?: Map<TimerListener, TimerListenerOptions>;

  /** 专属日志记录器 */
  private get __logger() {
    return journal.acquire(Timer.prototype.trait);
  }

  /**
   * 执行计帧监听器
   * @param dt 时间片
   */
  private __runFrameListener(dt: number) {
    const listeners = this.__frameListeners;
    if (listeners && listeners.size > 0) {
      for (const [process, [ambient, once]] of listeners) {
        const err = RunSync(process, ambient, dt)[1];
        if (err) {
          this.__logger.error(`闹钟 ${this.__cid} 计帧监听器回调异常`, err);
        }
        if (once && listeners.has(process)) {
          listeners.delete(process);
        }
      }
    }
  }

  /**
   * 执行计次监听器
   */
  private __runCountListener() {
    const listeners = this.__countListeners;
    if (listeners && listeners.size > 0) {
      for (const [process, [ambient, once]] of listeners) {
        const err = RunSync(process, ambient, this.__count, this.__total)[1];
        if (err) {
          this.__logger.error(`闹钟 ${this.__cid} 计次监听器回调异常`, err);
        }
        if (once && listeners.has(process)) {
          listeners.delete(process);
        }
      }
    }
  }

  /**
   * 执行计频监听器
   * @param frequency 频次
   */
  private __runFrequencyListener(frequency: number) {
    const listeners = this.__frequencyListeners;
    if (listeners && listeners.size > 0) {
      for (const [process, [ambient, once]] of listeners) {
        const err = RunSync(process, ambient, frequency)[1];
        if (err) {
          this.__logger.error(`闹钟 ${this.__cid} 计频监听器回调异常`, err);
        }
        if (once && listeners.has(process)) {
          listeners.delete(process);
        }
      }
    }
  }

  /**
   * 执行完成监听器
   */
  private __runDoneListener() {
    const listeners = this.__doneListeners;
    if (listeners && listeners.size > 0) {
      for (const [process, [ambient, once]] of listeners) {
        const err = RunSync(process, ambient)[1];
        if (err) {
          this.__logger.error(`闹钟 ${this.__cid} 完成监听器回调异常`, err);
        }
        if (once && listeners.has(process)) {
          listeners.delete(process);
        }
      }
    }
  }
}

/** 时钟 */
export class Clock implements ClockApi {
  // public

  public constructor() {
    this.__speed = 1;
    this.__running = true;
    this.__alarms = new Map();
  }

  public get speed() {
    return this.__speed;
  }

  public set speed(speed: number) {
    if (Number.isFinite(speed) && speed >= 0) {
      this.__speed = speed;
    }
  }

  public get running(): boolean {
    return this.__running;
  }

  public get size() {
    return this.__alarms.size;
  }

  public run(): void {
    this.__running = true;
  }

  public pause(): void {
    this.__running = false;
  }

  public reset() {
    this.pause();
    this.__alarms.forEach((alarm) => alarm.reset());
  }

  public stop() {
    this.pause();
    this.__alarms.clear();
  }

  public remove(cid: number) {
    this.__alarms.delete(cid);
  }

  public delay(delay: number, process: () => void, ambient: unknown): number {
    const counter = this.__add(0, delay, 1);
    counter.addDoneListener(process, ambient, true);
    return counter.cid;
  }

  public nextFrame(process: () => void, ambient: unknown): number {
    const counter = this.__add(0, 0, 1);
    counter.addDoneListener(process, ambient, true);
    return counter.cid;
  }

  public repeat(
    delay: number,
    interval: number,
    total: number,
    process: (count: number, total: number) => void,
    ambient: unknown,
  ): number {
    const counter = this.__add(delay, interval, total);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public loop(
    delay: number,
    interval: number,
    process: (count: number, total: number) => void,
    ambient: unknown,
  ): number {
    const counter = this.__add(delay, interval, 0);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public everyFrame(process: (dt: number) => void, ambient: unknown): number {
    const counter = this.__add(0, 0, 0);
    counter.addFrameListener(process, ambient, false);
    return counter.cid;
  }

  public everyFrequency(
    interval: number,
    process: (frequency: number) => void,
    ambient: unknown,
  ): number {
    const counter = this.__add(0, interval, 0);
    counter.addFrequencyListener(process, ambient, false);
    return counter.cid;
  }

  public everySecond(process: (count: number, total: number) => void, ambient: unknown): number {
    const counter = this.__add(0, 1, 0);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public tick(dt: number) {
    if (this.__speed <= 0 || !this.__running) return;

    const step = this.__speed * dt;
    const alarms = [...this.__alarms.values()]; // 快照：监听器内新建的闹钟下一帧再步进
    for (const alarm of alarms) {
      if (!this.__alarms.has(alarm.cid)) continue; // 监听器内已移除的闹钟不再步进
      alarm.step(step);
      if (alarm.done) {
        this.__alarms.delete(alarm.cid);
      }
    }
  }

  // private

  /** 速度（调节时间的流速） */
  private __speed: number;
  /** 运行状态（内部控制时钟的运行和停摆） */
  private __running: boolean;
  /** 闹钟容器 */
  private __alarms: Map<number, Alarm>;

  /**
   * 创建闹钟
   * @param delay 延迟
   * @param interval 间隔
   * @param total 总数
   * @returns 闹钟
   */
  private __add(delay: number, interval: number, total: number): Alarm {
    const alarm = new Alarm(delay, interval, total);
    this.__alarms.set(alarm.cid, alarm);
    return alarm;
  }
}

/**
 * 定时器结点
 */
export class Timer extends Knot<TimerOptions> implements TimerApi {
  // public

  public constructor() {
    super();

    this.__clocks = new Map();
    this.__running = true;
  }

  public get trait(): string {
    return 'timer';
  }

  public get shared() {
    return this.acquire('shared');
  }

  public get inspector() {
    return this.acquire('inspector');
  }

  public get size() {
    return this.__clocks.size;
  }

  public get stats(): ClockStats[] {
    const stats: ClockStats[] = [];
    for (const [token, clock] of this.__clocks) {
      stats.push({ trait: token, size: clock.size, speed: clock.speed });
    }
    return stats;
  }

  public get running() {
    return this.__running;
  }

  public pause() {
    this.__running = false;
  }

  public run() {
    this.__running = true;
  }

  public acquire(name: string): Clock {
    if (!this.__clocks.has(name)) {
      this.__clocks.set(name, new Clock());
    }
    return this.__clocks.get(name)!;
  }

  public remove(name: string) {
    this.__clocks.get(name)?.stop();
    this.__clocks.delete(name);
  }

  public has(name: string): boolean {
    return this.__clocks.has(name);
  }

  public clear() {
    this.__clocks.forEach((clock) => clock.stop());
    this.__clocks.clear();
    // 所有闹钟已清理，重置编号计数器以避免长期运行的 Cid 无界增长
    if (this.__clocks.size === 0) {
      Alarm.ResetCounter();
    }
  }

  // protected

  protected _attach(): Promise<boolean> {
    director.on(Director.EVENT_BEFORE_UPDATE, this.__drive, this);
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    director.off(Director.EVENT_BEFORE_UPDATE, this.__drive, this);
    return Promise.resolve(true);
  }

  // private

  /** 运行状态（外部控制开关，不会影响到时钟内部的运转状态） */
  private __running: boolean;
  /** 时钟 */
  private __clocks: Map<string, Clock>;

  /** 运转 */
  private __drive() {
    if (this.__running) {
      this.__tick(game.deltaTime);
    }
  }

  /**
   * 计时
   * @param dt 时间片
   */
  private __tick(dt: number) {
    const clocks = [...this.__clocks.values()]; // 快照：监听器内新建的时钟下一帧再计时
    for (const clock of clocks) {
      clock.tick(dt);
    }
  }
}
