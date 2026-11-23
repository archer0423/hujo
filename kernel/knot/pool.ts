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
import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { RunSync } from '../skill/might';

/** 对象池配置 */
export interface PoolItemOptions<T> {
  /** 对象工厂（必填，创建新对象；必须返回对象类型，原始值会令 WeakSet.add 抛错；异常向上传播由调用方感知） */
  factory: () => T;
  /** 对象创建后的初始化 */
  onCreate?: (obj: T) => void;
  /** 借出前的重置/激活 */
  onGet?: (obj: T) => void;
  /** 回收前的清理/停用 */
  onRecycle?: (obj: T) => void;
  /** 海汰/销毁时的清理 */
  onDestroy?: (obj: T) => void;
  /** 空闲容量上限（非负整数），缺省取 defaultCapacity */
  capacity?: number;
  /** 创建时预热数量，实际补足至 min(preload, capacity) */
  preload?: number;
  /** 安全水位：内存紧张时 relieve 回收空闲至此数量（非负整数），缺省取 defaultSafeIdle */
  safeIdle?: number;
  /** 获取当前帧号（游戏层注入，如导演帧计数；未提供则不启用同帧延迟） */
  getFrameId?: () => number;
  /** 是否启用同帧回收延迟：借出帧 == 回收帧时推迟到 Flush 再入队，规避引擎同帧节点树操作冲突（默认 false） */
  sameFrameDefer?: boolean;
}

/** 池统计 */
export interface PoolStats {
  /** 命名 */
  trait: string;
  /** 容量 */
  capacity: number;
  /** 空闲数 */
  idle: number;
  /** 借出计数（get 累加、recycle 递减；对象遗失未回收时偏高，仅供调优参考） */
  active: number;
  /** 累计创建数 */
  created: number;
  /** 累计回收数 */
  recycled: number;
  /** 累计销毁数（海汰/trim/clear/remove/relieve 均计入） */
  destroyed: number;
}

/** 对象池 */
export interface PoolItemApi<T> {
  /** 池命名 */
  get trait(): string;
  /** 池容量 */
  get capacity(): number;
  /** 空闲数 */
  get idle(): number;
  /** 借出计数（get 累加、recycle 递减；对象遗失未回收时偏高，仅供调优参考） */
  get active(): number;
  /** 池统计 */
  get stats(): PoolStats;
  /** 借出对象：优先取空闲，否则 Factory 新建 */
  get(): T;
  /** 回收对象：非借出对象告警并忽略；空闲满则海汰 */
  recycle(obj: T): void;
  /** 补足预热至 min(total, capacity) */
  preload(total: number): void;
  /** 调整容量并立即海汰超限空闲对象；非法值（非正整数）告警忽略；0 合法 */
  setCapacity(capacity: number): void;
  /** 一次性裁剪空闲至 min(total, 当前空闲)，不改变 capacity 策略 */
  trim(total: number): void;
  /** 安全回收：空闲队列降至 safeIdle 水位（目标取 min(safeIdle, capacity)），从最久未回收端开始销毁，不改 capacity；返回销毁数量 */
  relieve(): number;
  /** 清空空闲队列（销毁全部空闲对象），借出对象照常告警提示 */
  clear(): void;
  /**
   * 将延迟回收的对象转移到空闲队列
   * @tip 启用 sameFrameDefer 时由游戏层每帧调用，推荐在帧首（如 EVENT_BEFORE_UPDATE 中先递增帧号再 flush）；仅处理非当前帧的延迟项
   * @tip 延迟中的对象不计 active 也不计 idle（已归还、暂未入队）
   * @param frameId 当前帧号（可选，缺省时尝试 getFrameId）
   * @returns 处理的延迟项数量（含入队与海汰）
   */
  flush?(frameId?: number): number;
}

/** 对象池插件配置 */
export interface PoolOptions extends KnotOptions {
  /** 全局默认空闲容量（必填，非负整数；建议 10） */
  defaultCapacity: number;
  /** 全局默认安全水位（必填，非负整数；建议 2） */
  defaultSafeIdle: number;
}

/** 对象池插件接口 */
export interface PoolApi extends KnotApi<PoolOptions> {
  /** 池数量 */
  get size(): number;
  /** 各池统计 */
  get stats(): PoolStats[];
  /** 幂等创建/获取命名池（唯一创建入口；重复 trait 返回已存在池并忽略新 options） */
  acquire<T>(trait: string, options: PoolItemOptions<T>): PoolItemApi<T>;
  /** 移除池（只销毁空闲对象，借出对象随用随弃），返回是否存在 */
  remove(trait: string): boolean;
  /** 查询池，返回是否存在 */
  has(trait: string): boolean;
  /** 移除所有池（只销毁空闲对象） */
  clear(): void;
  /** 全池安全回收至各自 SafeIdle 水位，返回总销毁数量 */
  relieve(): number;
}

// implements

/** 是否为非负整数（Number.isInteger 一并拦截 NaN / Infinity / 小数） */
function isCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * 对象池
 *
 * - 空闲队列 LIFO：回收入队尾、借出取队尾（复用最近回收对象）
 * - 借出 WeakSet 弱引用追踪：双重回收/外来对象告警忽略，遗失对象可被 GC 自愈
 */
class PoolItem<T> implements PoolItemApi<T> {
  // private static

  /** 头指针压缩阈值（头指针超过此值且空洞过半时压缩空闲数组，防槽位随海汰循环滞留） */
  private static readonly COMPACT_THRESHOLD: number = 64;

  // public

  /**
   * 对象池构造
   * @tip 仅经 PoolPlugin.Acquire 创建，轻量校验防内部误用
   * @param trait 池名
   * @param options 池配置
   */
  public constructor(trait: string, options: PoolItemOptions<T>) {
    if (typeof options.factory !== 'function') {
      throw new Error('Pool factory must be a function');
    }
    if (!isCount(options.capacity!)) {
      throw new Error('Pool capacity must be a non-negative integer');
    }
    if (!isCount(options.safeIdle!)) {
      throw new Error('Pool safe idle must be a non-negative integer');
    }
    if (options.preload != null && !isCount(options.preload)) {
      throw new Error('Pool preload must be a non-negative integer');
    }

    this.__trait = trait;
    this.__options = options;
    this.__safeIdle = options.safeIdle!;
    this.__capacity = options.capacity!;
    this.__idle = [];
    this.__head = 0;
    this.__borrowFrame = new WeakMap();
    this.__deferred = [];
    this.__deferredFrames = [];
    this.__borrowed = new WeakSet();
    this.__active = 0;
    this.__created = 0;
    this.__recycled = 0;
    this.__destroyed = 0;

    if (options.preload! > 0) {
      this.preload(options.preload!);
    }
  }

  public get trait() {
    return this.__trait;
  }

  public get capacity() {
    return this.__capacity;
  }

  public get idle() {
    return this.__idle.length - this.__head;
  }

  public get active() {
    return this.__active;
  }

  public get stats(): PoolStats {
    return {
      trait: this.__trait,
      capacity: this.__capacity,
      idle: this.__idle.length - this.__head,
      active: this.__active,
      created: this.__created,
      recycled: this.__recycled,
      destroyed: this.__destroyed,
    };
  }

  /** 借出对象：优先取空闲，否则工厂新建 */
  public get(): T {
    let obj: T;
    if (this.__idle.length - this.__head > 0) {
      // LIFO：优先复用最近回收的对象（尾部消费，避免 _idle.pop 修改语义歧义）
      const lastIndex = this.__idle.length - 1;
      obj = this.__idle[lastIndex];
      this.__idle.length = lastIndex;
    } else {
      obj = this.__create();
    }
    this.__borrowed.add(obj as object);
    if (this.__deferEnabled) {
      const frame = this.__options.getFrameId!();
      if (Number.isFinite(frame)) {
        this.__borrowFrame.set(obj as object, frame); // 记录借出帧号，供同帧判定
      } else {
        this.__borrowFrame.delete(obj as object); // 帧号非法视为无法判定，回收时走即时路径
      }
    }
    this.__active++;
    if (this.__options.onGet) {
      this.__runHook('OnGet', this.__options.onGet, obj);
    }
    return obj;
  }

  /**
   * 回收对象
   * @tip 非借出对象（双重回收/外来对象）告警并忽略；空闲满则海汰多余对象
   * @param obj 对象
   */
  public recycle(obj: T): void {
    if (!this.__borrowed.has(obj as object)) {
      this.__logger.warn(`${this.trait} 回收了非借出对象（双重回收或外来对象），已忽略`, obj);
      return;
    }
    this.__borrowed.delete(obj as object);
    this.__active--;
    if (this.__options.onRecycle) {
      this.__runHook('OnRecycle', this.__options.onRecycle, obj);
    }
    // 同帧判定：借出帧 == 回收帧时延迟入队，由帧末 Flush 转移（规避引擎同帧节点树操作冲突）
    if (this.__deferEnabled) {
      const borrowFrame = this.__borrowFrame.get(obj as object);
      this.__borrowFrame.delete(obj as object);
      const recycleFrame = this.__options.getFrameId!();
      if (
        Number.isFinite(borrowFrame) &&
        Number.isFinite(recycleFrame) &&
        borrowFrame === recycleFrame
      ) {
        this.__deferred.push(obj);
        this.__deferredFrames.push(recycleFrame);
        this.__recycled++;
        return;
      }
    }
    if (this.__idle.length - this.__head < this.__capacity) {
      this.__idle.push(obj);
    } else {
      this.__destroy(obj);
    }
    this.__recycled++;
  }

  /**
   * 补足预热至 min(total, Capacity)
   * @tip 只创建不借出：不登记借出集、不计 Active
   * @param total 预热数量
   */
  public preload(total: number): void {
    if (!isCount(total)) {
      this.__logger.warn(`${this.trait} 预热数量非法（${total}），已忽略`);
      return;
    }
    const target = Math.min(total, this.__capacity);
    while (this.__idle.length - this.__head < target) {
      this.__idle.push(this.__create());
    }
  }

  /**
   * 调整容量并立即海汰超限空闲对象
   * @tip 非法值（非负整数以外）告警忽略；0 合法
   * @param capacity 容量
   */
  public setCapacity(capacity: number): void {
    if (!isCount(capacity)) {
      this.__logger.warn(`${this.trait} 容量非法（${capacity}），已忽略`);
      return;
    }
    this.__capacity = capacity;
    this.__evictTo(capacity);
  }

  /**
   * 一次性裁剪空闲至 min(total, 当前空闲)
   * @tip 不改变 Capacity 策略
   * @param total 裁剪目标
   */
  public trim(total: number): void {
    if (!isCount(total)) {
      this.__logger.warn(`${this.trait} 裁剪数量非法（${total}），已忽略`);
      return;
    }
    this.__evictTo(Math.min(total, this.idle));
  }

  /**
   * 安全回收：空闲队列降至 SafeIdle 水位（目标取 min(SafeIdle, Capacity)）
   * @tip 内存紧张时手动调用，从最久未回收端开始销毁，不改 Capacity；借出对象不受影响
   * @returns 销毁数量
   */
  public relieve(): number {
    const before = this.__destroyed;
    this.__evictTo(Math.min(this.__safeIdle, this.__capacity));
    return this.__destroyed - before;
  }

  /** 清空空闲队列（销毁全部空闲与延迟回收对象），借出对象照常告警提示 */
  public clear(): void {
    for (let i = 0; i < this.__deferred.length; i++) {
      this.__destroy(this.__deferred[i]); // 延迟项一并销毁，防止清空后残留
    }
    this.__deferred.length = 0;
    this.__deferredFrames.length = 0;
    this.__evictTo(0);
    if (this.__active > 0) {
      this.__logger.warn(`${this.trait} 有 ${this.__active} 个借出对象未归还`);
    }
  }

  /**
   * 将延迟回收的对象转移到空闲队列
   * @tip 启用 SameFrameDefer 时由游戏层每帧调用，推荐在帧首（先递增帧号再 Flush，回收帧与挂载帧即自然错开）；仅处理非当前帧的延迟项，可安全重复调用
   * @tip 延迟中的对象不计 Active 也不计 Idle（已归还、暂未入队）
   * @param frameId 当前帧号（可选，缺省时尝试 GetFrameId）
   * @returns 处理的延迟项数量（含入队与海汰）
   */
  public flush(frameId?: number): number {
    if (this.__deferred.length === 0) {
      return 0;
    }
    const current = frameId ?? this.__options.getFrameId?.();
    if (!Number.isFinite(current)) {
      return 0;
    }
    let moved = 0;
    let write = 0;
    for (let read = 0; read < this.__deferred.length; read++) {
      const obj = this.__deferred[read];
      const frame = this.__deferredFrames[read];
      if (frame === current) {
        this.__deferred[write] = obj; // 同帧项保守保留，原地压缩待下一帧处理
        this.__deferredFrames[write] = frame;
        write++;
        continue;
      }
      if (this.__idle.length - this.__head < this.__capacity) {
        this.__idle.push(obj);
      } else {
        this.__destroy(obj); // 空闲已满：按既有语义海汰（OnRecycle 已在 Recycle 时执行，不再重复）
      }
      moved++;
    }
    this.__deferred.length = write; // 原地压缩：零分配回收已处理槽位
    this.__deferredFrames.length = write;
    return moved;
  }

  // private

  /** 池名 */
  private readonly __trait: string;
  /** 池配置（容量与安全水位已解析为确定值） */
  private readonly __options: PoolItemOptions<T>;
  /** 安全水位 */
  private readonly __safeIdle: number;
  /** 空闲容量上限 */
  private __capacity: number;
  /** 空闲队列（尾部为最近回收；头指针之前的槽位为海汰空洞） */
  private __idle: T[];
  /** 空闲队列头指针（海汰从头部 O(1) 消费，替代 shift 的整体前移） */
  private __head: number;
  /** 借出对象 -> 借出帧号（仅启用同帧延迟时记录，弱引用不阻碍 GC） */
  private readonly __borrowFrame: WeakMap<object, number>;
  /** 延迟回收队列（同帧回收对象暂存，Flush 时再入队） */
  private __deferred: T[];
  /** 延迟回收对应的回收帧号（与 _deferred 一一对应） */
  private __deferredFrames: number[];
  /** 借出对象弱引用集（T 未经 object 约束，此处以受控断言登记） */
  private __borrowed: WeakSet<object>;
  /** 借出计数（Get 累加、Recycle 递减；遗失未回收时偏高，仅供调优参考） */
  private __active: number;
  /** 累计创建数 */
  private __created: number;
  /** 累计回收数 */
  private __recycled: number;
  /** 累计销毁数 */
  private __destroyed: number;
  /** 日志 */
  private get __logger() {
    return journal.acquire(Pool.prototype.trait);
  }

  /** 是否启用同帧回收延迟（需同时开启 SameFrameDefer 并注入 GetFrameId） */
  private get __deferEnabled(): boolean {
    return (
      this.__options.sameFrameDefer === true && typeof this.__options.getFrameId === 'function'
    );
  }

  /** 经工厂创建新对象并执行创建钩子（工厂异常向上传播） */
  private __create(): T {
    const obj = this.__options.factory();
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Pool factory must return an object (primitive values cannot be tracked)');
    }
    this.__created++;
    if (this.__options.onCreate) {
      this.__runHook('OnCreate', this.__options.onCreate, obj);
    }
    return obj;
  }

  /** 销毁对象并计入统计 */
  private __destroy(obj: T): void {
    if (this.__options.onDestroy) {
      this.__runHook('OnDestroy', this.__options.onDestroy, obj);
    }
    this.__destroyed++;
  }

  /** 从最久未回收端（队首）裁剪空闲至目标数量 */
  private __evictTo(target: number): void {
    const keep = Math.max(0, target);
    while (this.__idle.length - this.__head > keep) {
      this.__destroy(this.__idle[this.__head++]);
    }
    this.__compact();
  }

  /** 压缩空闲数组（头指针消费留下的空洞定期回收，防槽位滞留） */
  private __compact(): void {
    if (this.__head >= PoolItem.COMPACT_THRESHOLD && this.__head * 2 >= this.__idle.length) {
      this.__idle.copyWithin(0, this.__head);
      this.__idle.length -= this.__head;
      this.__head = 0;
    }
  }

  /**
   * 安全执行生命周期钩子（异常记录不中断池操作）
   * @param action 钩子名称
   * @param process 钩子处方
   * @param obj 目标对象
   */
  private __runHook(action: string, process: (obj: T) => void, obj: T): void {
    const err = RunSync(process, undefined, obj)[1];
    if (err) {
      this.__logger.error(`${this.trait} ${action} 钩子回调异常`, err);
    }
  }
}

/**
 * 对象池插件
 *
 * 按 trait 管理多个命名池，池的唯一创建入口
 */
export class Pool extends Knot<PoolOptions> implements PoolApi {
  // public

  public constructor() {
    super();
    this.__pools = new Map();
  }

  public get trait(): string {
    return 'pool';
  }

  public get size() {
    return this.__pools.size;
  }

  public get stats(): PoolStats[] {
    const stats: PoolStats[] = [];
    for (const pool of this.__pools.values()) {
      stats.push(pool.stats);
    }
    return stats;
  }

  /**
   * 幂等创建/获取命名池
   * @tip 重复 trait 返回已存在池并忽略新 options
   * @param trait 池标识
   * @param options 池配置
   */
  public acquire<T>(trait: string, options: PoolItemOptions<T>): PoolItemApi<T> {
    const existing = this.__pools.get(trait);
    if (existing) {
      this.logger.debug(`对象池 ${trait} 已存在，忽略新 options`);
      return existing as PoolItemApi<T>; // 受控断言：trait 与 options 类型由首个调用方决定
    }

    const pool = new PoolItem(trait, {
      ...options,
      capacity: this.__resolve(trait, 'Capacity', options.capacity!, this.options.defaultCapacity),
      safeIdle: this.__resolve(trait, 'SafeIdle', options.safeIdle!, this.options.defaultSafeIdle),
      preload: this.__resolve(trait, 'Preload', options.preload!, 0),
    });
    this.__pools.set(trait, pool);

    return pool;
  }

  /**
   * 移除池（只销毁空闲对象，借出对象随用随弃）
   * @param trait 池标识
   * @returns 是否存在
   */
  public remove(trait: string): boolean {
    const pool = this.__pools.get(trait);
    if (!pool) {
      return false;
    }
    pool.clear();
    this.__pools.delete(trait);
    return true;
  }

  /**
   * 是否有指定池
   * @param trait 池标识
   */
  public has(trait: string): boolean {
    return this.__pools.has(trait);
  }

  /** 移除所有池（只销毁空闲对象） */
  public clear(): void {
    for (const pool of this.__pools.values()) {
      pool.clear();
    }
    this.__pools.clear();
  }

  /** 全池安全回收至各自 safeIdle 水位 */
  public relieve(): number {
    let destroyed = 0;
    for (const pool of this.__pools.values()) {
      destroyed += pool.relieve();
    }
    return destroyed;
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // private

  /** 命名池 */
  private __pools: Map<string, PoolItemApi<unknown>>;

  /**
   * 解析两级默认值：options 显式值 → PoolCfg 默认值
   * @tip options 显式值非法（负数/非整数/NaN）时告警并取 PoolCfg 默认值
   * @param trait 池标识
   * @param item 配置项名称
   * @param explicit 显式值
   * @param fallback 默认值
   */
  private __resolve(trait: string, item: string, explicit: number, fallback: number): number {
    if (isCount(explicit)) {
      return explicit;
    }

    if (explicit === undefined && explicit === null) {
      this.logger.warn(`对象池 ${trait} 的 ${item} 非法（${explicit}），已取默认值 ${fallback}`);
    }

    return fallback;
  }
}
