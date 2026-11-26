/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { AudioClip, AudioSource, Layers, Node } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { Now } from '../skill/datetime';
import { Clamp01 } from '../skill/digit';
import { ArchiveApi, ArchiveDocument } from './archive';
import { CargoApi } from './cargo/cargo';
import { CargoURI } from './cargo/typings';
import { ParseCargoURI } from './cargo/util';
import { LauncherApi } from './launcher/launcher.typings';

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

/**
 * 音频播放器结点
 * @tip 一次性实例无法停止、自然播完
 * @tip 播放音频实例之前需要先注册
 * @todo 检查剩下的问题
 * @todo 清理 __cache
 * @todo 增加 effect/music 独立控制通道
 */
export class Sound extends Knot<SoundOptions> implements SoundApi {
  // public static

  /** 存档键：音效静音 */
  public static readonly KEY_EFFECT_MUTED = 'sound:effect-muted@b';
  /** 存档键：音乐静音 */
  public static readonly KEY_MUSIC_MUTED = 'sound:music-muted@b';
  /** 存档键：音效音量 */
  public static readonly KEY_EFFECT_VOLUME = 'sound:effect-volume@n';
  /** 存档键：音乐音量 */
  public static readonly KEY_MUSIC_VOLUME = 'sound:music-volume@n';

  // private static
  /** 节点名称：一次性音效 */
  private static readonly NODE_ONE_SHOT = 'node:one-shot';
  /** 节点名称：音效 */
  private static readonly NODE_EFFECT = 'node:effect';
  /** 节点名称：音乐 */
  private static readonly NODE_MUSIC = 'node:music';

  // public

  declare public readonly archive: ArchiveApi;
  declare public readonly launcher: LauncherApi;
  declare public readonly cargo: CargoApi;

  public constructor() {
    super();

    this.__registry = new Map();
    this.__sessions = new Map();
    this.__cache = [];
    this.__id = 0;
  }

  public get trait() {
    return 'sound';
  }

  public override get deps() {
    return ['archive', 'launcher', 'cargo'];
  }

  public get effectMuted(): boolean {
    return this.__doc.read(Sound.KEY_EFFECT_MUTED);
  }

  public set effectMuted(m: boolean) {
    if (this.effectMuted !== m) {
      this.__doc.write(Sound.KEY_EFFECT_MUTED, m);
      if (m) {
        this.stopEffect();
      }
    }
  }

  public get musicMuted(): boolean {
    return this.__doc.read(Sound.KEY_MUSIC_MUTED);
  }

  public set musicMuted(m: boolean) {
    if (this.musicMuted !== m) {
      this.__doc.write(Sound.KEY_MUSIC_MUTED, m);
      if (m) {
        this.stopMusic();
      }
    }
  }

  public get effectVolume(): number {
    return this.__doc.read(Sound.KEY_EFFECT_VOLUME);
  }

  public set effectVolume(v: number) {
    if (Number.isFinite(v)) {
      v = Math.max(0, Math.min(100, v));
      if (this.effectVolume !== v) {
        this.__doc.write(Sound.KEY_EFFECT_VOLUME, v);
        this.__syncVolume('effect', v * 0.01);
      }
    }
  }

  public get musicVolume(): number {
    return this.__doc.read(Sound.KEY_MUSIC_VOLUME);
  }

  public set musicVolume(v: number) {
    if (Number.isFinite(v)) {
      v = Math.max(0, Math.min(100, v));
      if (this.musicVolume !== v) {
        this.__doc.write(Sound.KEY_MUSIC_VOLUME, v);
        this.__syncVolume('music', v / 100);
      }
    }
  }

  public register(registry: SoundRegistry): void {
    const uri = registry.uri;

    const type = ParseCargoURI(uri)[2];
    if (type !== 'audio') {
      this.logger.warn(`不是有效的音频资产 >>> ${uri}`);
      return;
    }

    if (this.__registry.has(uri)) {
      this.logger.debug(`音频配置已注册，跳过（不允许覆盖） >>> ${uri}`);
      return;
    }

    const derivative = {
      loop: false,
      scalar: 1,
      maxInstances: 0,
      timeAllotted: 0,
      ...registry,
    };

    derivative.scalar = Number.isFinite(derivative.scalar) ? Clamp01(derivative.scalar!) : 1;
    derivative.timeAllotted = Number.isFinite(derivative.timeAllotted)
      ? Math.max(0, derivative.timeAllotted!)
      : 0;
    derivative.maxInstances = Number.isFinite(derivative.maxInstances)
      ? Math.max(0, derivative.maxInstances! | 0)
      : 0;

    if (derivative.type === 'music') {
      derivative.maxInstances = 0; // 音乐会自动挤占当前实例
      derivative.timeAllotted = 0;
    }

    this.__registry.set(uri, derivative);
  }

  public play(uri: CargoURI): Promise<number> {
    return new Promise<number>((resolve) => {
      if (!this.__registry.has(uri)) {
        this.logger.warn(`音频资产未注册 >>> ${uri}`);
        return resolve(0);
      }

      const { type, loop, maxInstances, timeAllotted, scalar } = this.__registry.get(uri)!;

      // 检查静音状态
      if (type === 'music' && this.musicMuted) {
        this.logger.debug(`音乐处于静音状态 >>> ${uri}`);
        return resolve(0);
      }
      if ((type === 'effect' || type === 'one-shot-effect') && this.effectMuted) {
        this.logger.debug(`音效处于静音状态 >>> ${uri}`);
        return resolve(0);
      }

      // 检查多实例共存限制状态
      if (maxInstances! > 0) {
        let instances = 0;
        this.__sessions.forEach((s) => {
          if (s.uri === uri) {
            instances++;
          }
        });
        if (instances >= maxInstances!) {
          this.logger.warn(`触发音频窗口内同时播放实例数上限，跳过 >>> ${uri}`);
          return resolve(0);
        }
      }

      // 检查短时间内播放频率限制状态
      if (timeAllotted! > 0) {
        let recent = 0;
        this.__sessions.forEach((s) => {
          if (s.uri === uri) {
            recent = Math.max(recent, s.timestamp);
          }
        });
        if (Now() - recent >= timeAllotted!) {
          this.logger.warn(`触发音频播放频率上限，跳过 >>> ${uri}`);
          return resolve(0);
        }
      }

      if (type === 'music') {
        // 检查当前是否由音乐播放且是否同一实例
        for (const [_, session] of this.__sessions) {
          if (session.type === 'music') {
            if (session.uri === uri) {
              this.logger.warn(`音乐正在播放中 >>> ${uri}`, session);
              return resolve(0);
            } else {
              // 停止当前音乐
              this.stop(session.id);
            }
          }
        }
      }

      const session = this.__startSession(uri);

      this.cargo.load(uri).then((ok) => {
        if (!ok) {
          this.logger.warn(`音频资产加载失败 >>> ${uri}`);
          resolve(0);
        }

        const clip = this.cargo.get(uri)!.asset as AudioClip;
        switch (type) {
          case 'one-shot-effect':
            {
              // @ts-ignore
              this.cargo.alloc(uri, session.source, `#clip-${session.id}`);
              // 一次性播放
              session.source.playOneShot(clip, scalar!);
              // 超时回收
              setTimeout(() => this.stop(session.id), clip.getDuration() * 1000 + 100);
            }
            break;
          case 'effect':
            {
              this.cargo.alloc(uri, session.source, 'clip');
              session.source.volume = this.effectVolume * scalar! * 0.01;
              session.source.loop = loop!;
              session.source.play();
              session.source.node.once(
                AudioSource.EventType.ENDED,
                () => this.stop(session.id),
                this,
              );
            }
            break;
          case 'music':
            {
              this.cargo.alloc(uri, session.source, 'clip');
              session.source.volume = this.musicVolume * scalar! * 0.01;
              session.source.loop = loop!;
              session.source.play();
              session.source.node.once(
                AudioSource.EventType.ENDED,
                () => this.stop(session.id),
                this,
              );
            }
            break;
        }

        resolve(session.id);
      });
    });
  }

  public pause(id: number): void;
  public pause(uri: CargoURI): void;
  public pause(arg: number | CargoURI): void {
    this.__applyAction(arg, (session) => session.source.pause());
  }
  public pauseEffect(): void {
    this.__sessions.forEach((s) => s.type === 'effect' && this.pause(s.id));
  }
  public pauseMusic(): void {
    this.__sessions.forEach((s) => s.type === 'music' && this.pause(s.id));
  }
  public pauseAll(): void {
    this.__sessions.forEach((s) => this.pause(s.id));
  }

  public resume(id: number): void;
  public resume(uri: CargoURI): void;
  public resume(arg: number | CargoURI): void {
    this.__applyAction(arg, (session) => session.source.play());
  }
  public resumeEffect(): void {
    this.__sessions.forEach((s) => s.type === 'effect' && this.resume(s.id));
  }
  public resumeMusic(): void {
    this.__sessions.forEach((s) => s.type === 'music' && this.resume(s.id));
  }
  public resumeAll(): void {
    this.__sessions.forEach((s) => this.resume(s.id));
  }

  public stop(id: number): void;
  public stop(uri: CargoURI): void;
  public stop(arg: number | CargoURI): void {
    this.__applyAction(arg, (session) => this.__endSession(session.id));
  }
  public stopEffect(): void {
    this.__sessions.forEach((s) => s.type === 'effect' && this.stop(s.id));
  }
  public stopMusic(): void {
    this.__sessions.forEach((s) => s.type === 'music' && this.stop(s.id));
  }
  public stopAll(): void {
    this.__sessions.forEach((s) => this.stop(s.id));
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.__doc = this.archive.create(this.options.doc, [
      [Sound.KEY_EFFECT_MUTED, false],
      [Sound.KEY_MUSIC_MUTED, false],
      [Sound.KEY_EFFECT_VOLUME, 100],
      [Sound.KEY_MUSIC_VOLUME, 100],
    ]);

    this.__nodeOneShot = this.__createPlayer(Sound.NODE_ONE_SHOT, true);
    this.__nodeEffect = this.__createPlayer(Sound.NODE_EFFECT, false);
    this.__nodeMusic = this.__createPlayer(Sound.NODE_MUSIC, true);

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    // 存档保存
    this.__doc.save();

    // 停止所有音频播放实例
    this.stopAll();

    // 清除缓存节点
    if (this.__cache.length) {
      this.__cache.forEach((c) => c.destroy());
      this.__cache.length = 0;
    }

    // 清除注册表和会话表
    this.__registry.clear();
    this.__sessions.clear();

    return Promise.resolve(true);
  }

  // private

  /** 音频相关存档 */
  private __doc!: ArchiveDocument;
  /** 音频注册表 */
  private __registry: Map<CargoURI, SoundRegistry>;
  /** 音频会话表 */
  private __sessions: Map<number, SoundSession>;
  /** 用于挂载一次性音效的音源节点 */
  private __nodeOneShot!: Node;
  /** 用于挂载音效的容器节点 */
  private __nodeEffect!: Node;
  /** 用于挂载音乐的音源节点 */
  private __nodeMusic!: Node;
  /** 音效缓存节点 */
  private __cache: Node[];
  /** 当前会话编号 */
  private __id: number;

  /**
   * 创建音频节点
   * @param name 节点名称
   * @param source 是否音源节点
   * @param parent 父亲节点
   * @returns
   */
  private __createPlayer(name: string, source: boolean, parent?: Node) {
    const node = new Node(name);
    node.layer = Layers.BitMask.NONE;
    node.parent = parent ?? this.launcher.mnt;
    if (source) {
      node.addComponent(AudioSource);
    }
    return node;
  }

  /**
   * 获取音效节点
   * @returns 音效节点
   */
  private __getPlayer() {
    if (this.__cache.length) {
      return this.__cache.pop()!;
    }
    return this.__createPlayer(Sound.NODE_EFFECT, true, this.__nodeEffect);
  }

  /**
   * 回收音频节点
   * @param node 音频节点
   */
  private __putPlayer(node: Node, cache: boolean) {
    if (node && node.isValid) {
      // 注销事件
      node.targetOff(this);
      // 强制停止播放并回收资产
      const source = node.getComponent(AudioSource)!;
      source.stop();
      this.cargo.free(source, 'clip');
      // 与父节点脱离
      node.parent = null;
      // 缓存或丢弃
      if (cache) {
        if (this.__cache.length >= this.options.cacheLimit) {
          // 超过上限直接丢弃
          node.destroy();
        } else {
          // 缓存
          this.__cache.push(node);
        }
      }
    }
  }

  /**
   * 执行动作
   * @param arg 会话编号或音频资产标识
   * @param action 动作
   */
  private __applyAction(arg: number | CargoURI, action: (session: SoundSession) => void) {
    if (typeof arg === 'number') {
      if (this.__sessions.has(arg)) {
        action(this.__sessions.get(arg)!);
      }
    } else {
      this.__sessions.forEach((session) => {
        if (session.uri === arg) {
          action(session);
        }
      });
    }
  }

  /**
   * 开启会话
   * @param uri 音频资产标识
   * @returns 会话
   */
  private __startSession(uri: CargoURI) {
    const registry = this.__registry.get(uri)!;
    const { type } = registry;

    let source: AudioSource;
    if (type === 'one-shot-effect') {
      source = this.__nodeOneShot.getComponent(AudioSource)!;
    } else if (type === 'music') {
      source = this.__nodeMusic.getComponent(AudioSource)!;
    } else {
      source = this.__getPlayer().getComponent(AudioSource)!;
    }

    const session: SoundSession = {
      uri,
      id: ++this.__id,
      type,
      source,
      timestamp: Now(),
      playing: false,
    };

    this.__sessions.set(session.id, session);

    return session;
  }

  /**
   * 关闭会话
   * @param arg 会话或会话序号
   */
  private __endSession(arg: SoundSession | number) {
    const session = typeof arg === 'number' ? this.__sessions.get(arg) : arg;
    if (session) {
      const { id, type, source } = session;
      if (type === 'one-shot-effect') {
        // @ts-ignore
        this.cargo.free(source, `#clip-${id}`);
      } else if (type === 'music') {
        this.__putPlayer(source.node, false);
      } else {
        this.__putPlayer(source.node, true);
      }
      this.__sessions.delete(session.id);
    }
  }

  /** 同步音量变化 */
  private __syncVolume(type: SoundType, volume: number) {
    this.__sessions.forEach((s) => {
      if (s.type === type) {
        const { scalar } = this.__registry.get(s.uri)!;
        s.source.volume = volume * scalar! * 0.01;
      }
    });
  }
}
