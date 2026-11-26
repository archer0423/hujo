/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { AudioSource } from 'cc';

import { KnotApi, KnotOptions } from '../../core/knot';
import { CargoURI } from '../cargo/cargo.typings';

/** 音频类型 */
export type SoundType = 'effect' | 'music' | 'one-shot-effect';

/** 音频注册项 */
export interface SoundRegistry {
  /** 资产标识 */
  uri: CargoURI;
  /** 音频类型 */
  type: SoundType;
  /**
   * 音量缩放倍数
   * @tip 默认 1
   * @tip 仅适用于一次性音效
   */
  scalar?: number;
  /**
   * 是否循环播放
   * @tip 默认 false
   * @tip 仅适用于普通播放模式
   * @tip 一次性音效禁止循环
   */
  loop?: boolean;
  /**
   * 同时播放该音频的数量上限
   * @tip 默认为 0
   * @tip ≤0 表示不限制
   */
  maxInstances?: number;
  /**
   * 在此限定时间内不允许播放该音频的新实例
   * @tip 默认为 0
   * @tip ≤0 表示不限制
   */
  timeAllotted?: number;
}

/** 音频播放会话 */
export interface SoundSession {
  /** 会话编号 */
  id: number;
  /** 音频资产标识 */
  uri: CargoURI;
  /** 音频类型 */
  type: SoundType;
  /** 音频音源 */
  source: AudioSource;
  /** 开始播放时间 */
  timestamp: number;
  /** 播放中 */
  playing: boolean;
}

/** 音频播放器配置 */
export interface SoundOptions extends KnotOptions {
  /** 存档名称 */
  doc: string;
  /** 缓存上限 */
  cacheLimit: number;
}

/** 音频播放器接口 */
export interface SoundApi extends KnotApi<SoundOptions> {
  /** 音效静音；置真时停止全部普通音效实例并中止加载中会话（一次性实例无法停止，自然播完） */
  effectMuted: boolean;
  /** 音乐静音；置真时停止全部普通音乐实例并中止加载中会话 */
  musicMuted: boolean;
  /** 音效主音量（播放中实例不热更新，对下一次播放生效） */
  effectVolume: number;
  /** 音乐主音量（播放中实例不热更新，对下一次播放生效） */
  musicVolume: number;
  /**
   * 注册音频播放配置信息
   * @param options 音频播放配置
   */
  register(registry: SoundRegistry): void;
  /**
   * 播放音频
   * @param uri 音频资产标识
   * @returns Promise 包装的序号，<= 0 表示音频实际上未播放
   */
  play(uri: CargoURI): Promise<number>;
  /**
   * 暂停指定音频播放
   * @param id 会话编号
   */
  pause(id: number): void;
  /**
   * 暂停指定音频播放
   * @param uri 音频资产标识
   */
  pause(uri: CargoURI): void;
  /**
   * 恢复指定音频播放
   * @param id 会话编号
   */
  resume(id: number): void;
  /**
   * 恢复指定音频播放
   * @param uri 音频资产标识
   */
  resume(uri: CargoURI): void;
  /**
   * 停止指定音频播放（不包括一次性；一次性由时长到期自动清理）
   * @param id 会话编号
   */
  stop(id: number): void;
  /**
   * 停止指定音频播放（不包括一次性；一次性由时长到期自动清理）
   * @param uri 音频资产标识
   */
  stop(uri: CargoURI): void;
  /** 暂停所有音频播放（不包括一次性） */
  pauseAll(): void;
  /** 暂停所有音效 */
  pauseEffect(): void;
  /** 暂停所有音乐 */
  pauseMusic(): void;
  /** 恢复所有音频播放（不包括一次性） */
  resumeAll(): void;
  /** 恢复所有音效 */
  resumeEffect(): void;
  /** 恢复所有音乐 */
  resumeMusic(): void;
  /** 停止所有音频播放（不包括一次性） */
  stopAll(type?: SoundType): void;
  /** 停止所有音效 */
  stopEffect(): void;
  /** 停止所有音乐 */
  stopMusic(): void;
}
