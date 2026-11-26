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
