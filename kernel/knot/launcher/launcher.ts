/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import {
  director,
  game,
  sys,
  Camera,
  Canvas,
  Director,
  Game,
  Layers,
  Node,
  Scene,
  Widget,
} from 'cc';

import { Knot } from '../../core/knot';
import { Now } from '../../skill/datetime';
import { EachProperties, Override } from '../../skill/dict';
import { MISC } from '../../skill/env';
import { GetQueryString } from '../../skill/web';
import { AffairApi } from '../affair/affair.typings';
import { Build, LanguageType, LauncherApi, LauncherOptions } from './launcher.typings';

// implements

/** 允许经 URL 覆写的配置键白名单（可经 config.UrlKeys 追加） */
const LAUNCHER_URL_OVERRIDABLE_KEYS: string[] = ['workspace'];

/** 保留键（扩展白名单也拒绝注入，防止 URL 伪装构建版本等核心语义） */
const LAUNCHER_RESERVED_KEYS: string[] = ['app', 'version', 'build', 'language'];

/**
 * 启动器结点
 */
export class Launcher extends Knot<LauncherOptions> implements LauncherApi {
  /** 事件宏定义 */
  public static readonly EVENT = {
    /** 应用进入后台 */
    ENTER_BACKGROUND: 'app@enter-background',
    /** 应用进入前台 */
    ENTER_FOREGROUND: 'app@enter-foreground',
    /** 应用退出 */
    QUIT: 'app@quit',
    /** 应用低内存告警 */
    LOW_MEMORY: 'app@low-memory',
    /** 场景启动 */
    STAGE_READY: 'app@stage-ready',
  } as const;

  // public
  declare public readonly affair: AffairApi;

  public readonly app!: string;
  public readonly version!: string;
  public readonly build!: Build;
  public readonly isDev!: boolean;
  public readonly isAlpha!: boolean;
  public readonly isBeta!: boolean;
  public readonly isCandidate!: boolean;
  public readonly isRelease!: boolean;
  public readonly workspace!: string;
  public readonly supportedLanguages!: LanguageType[];
  public readonly scene!: Scene;
  public readonly root!: Node;
  public readonly mnt!: Node;
  public readonly canvas!: Canvas;
  public readonly cameraUi!: Camera;
  public readonly stage!: Node;

  public constructor() {
    super();

    this.__runningLogic = true;
    this.__runningInternal = true;
    this.__timingPause = 0;
    this.__elapsed = 0;
  }

  public get trait(): string {
    return 'launcher';
  }

  public override get deps(): string[] {
    return ['affair'];
  }

  /** 是否指定构建版本 */
  public isBuildOf(build: Build): boolean {
    return this.build === build;
  }

  /** 是否支持语言 */
  public isLanguageSupported(language: LanguageType): boolean {
    return this.options.language.includes(language);
  }

  /** 暂停逻辑 */
  public pause(): void {
    this.__runningLogic = false;
  }

  /** 恢复逻辑 */
  public resume(): void {
    this.__runningLogic = true;
  }

  /** 从后台回到前台经历的时间（ms，未经历完整后台往返时为 0） */
  public get elapsed(): number {
    return this.__elapsed;
  }

  /** 运行状态 */
  public get running(): boolean {
    return this.__runningInternal && this.__runningLogic;
  }

  // protected

  protected _attach(): Promise<boolean> {
    // Override 为原地合并：在副本上操作避免变异调用方对象；返回值必须接住，
    // 否则 cfg=null 时兜底写在临时对象上，后续 cfg.Build 读取仍然崩溃
    const options = Override(
      { ...(this.options ?? {}) },
      {
        App: 'hujo',
        Version: '1.0.0',
        Build: Build.Dev,
        Language: [sys.Language.CHINESE, sys.Language.ENGLISH],
        Workspace: 'default',
      },
    ) as LauncherOptions;

    const { build, allowedUrlKeys } = options;

    if (MISC.BROWSER && (build === Build.Dev || build === Build.Alpha)) {
      const qs = GetQueryString();
      const whitelist = [...LAUNCHER_URL_OVERRIDABLE_KEYS, ...(allowedUrlKeys ?? [])];
      EachProperties(qs, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') return; // 危险键拒绝注入
        if (LAUNCHER_RESERVED_KEYS.includes(key)) return; // 保留键拒绝注入
        if (!whitelist.includes(key)) return; // 白名单外的键拒绝注入
        this.options[key] = decodeURIComponent(value);
      });
    }

    const ctx = this as unknown as any;
    ctx.app = options.app;
    ctx.version = options.version;
    ctx.build = options.build;
    ctx.isDev = options.build === Build.Dev;
    ctx.isAlpha = options.build === Build.Alpha;
    ctx.isBeta = options.build === Build.Beta;
    ctx.isCandidate = options.build === Build.Candidate;
    ctx.isRelease = options.build === Build.Release;
    ctx.workspace = options.workspace!;
    ctx.supportedLanguages = options.language;

    this.options = options;

    return new Promise<boolean>((resolve) => {
      director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, this.__onSceneLaunch, this);
      director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, resolve, this);
      game.on(Game.EVENT_SHOW, this.__internalResume, this);
      game.on(Game.EVENT_HIDE, this.__internalPause, this);
      game.on(Game.EVENT_CLOSE, this.__internalClose, this);
      game.on(Game.EVENT_LOW_MEMORY, this.__internalLowMemory, this);
      this.logger.info(`🔥 ${this.app} ${this.version}_${this.build}`);
    });
  }

  protected _detach(): Promise<boolean> {
    director.off(Director.EVENT_BEFORE_SCENE_LAUNCH, this.__onSceneLaunch, this);
    game.off(Game.EVENT_SHOW, this.__internalResume, this);
    game.off(Game.EVENT_HIDE, this.__internalPause, this);
    game.off(Game.EVENT_CLOSE, this.__internalClose, this);
    game.off(Game.EVENT_LOW_MEMORY, this.__internalLowMemory, this);

    return Promise.resolve(true);
  }

  // private

  /** 逻辑运行状态 */
  private __runningLogic: boolean;
  /** 内部运行状态 */
  private __runningInternal: boolean;
  /** 内部暂停计时点（0 表示不在后台往返中） */
  private __timingPause: number;
  /** 最近一次后台滞留时长（未经历完整 hide→show 往返时为 0） */
  private __elapsed: number;

  /** 应用退到后台 */
  private __internalPause() {
    this.__runningInternal = false;
    this.__timingPause = Now();
    this.affair.sys.notify(Launcher.EVENT.ENTER_BACKGROUND);
  }

  /** 应用回到前台 */
  private __internalResume() {
    this.__runningInternal = true;
    if (this.__timingPause > 0) {
      this.__elapsed = Now() - this.__timingPause; // 仅完整的 hide→show 往返计入，首启 SHOW 不产生垃圾值
      this.__timingPause = 0;
    }
    this.affair.sys.notify(Launcher.EVENT.ENTER_FOREGROUND);
  }

  /** 应用退出 */
  private __internalClose() {
    this.affair.sys.notify(Launcher.EVENT.QUIT);
    game.targetOff(this);
    director.targetOff(this);
  }

  /** 内存报警 */
  private __internalLowMemory() {
    // 巡检的节流周期由引擎帧驱动，低内存时须跳过等待立即清扫（此前误传秒值使清扫形同虚设）
    this.affair.sys.notify(Launcher.EVENT.LOW_MEMORY);
  }

  /** 场景启动 */
  private __onSceneLaunch(scene: Scene) {
    const ctx = this as unknown as any;

    // Scene
    ctx.scene = scene;

    // Mnt
    let mnt = scene.getChildByName('Mnt');
    if (!mnt) {
      mnt = new Node('Mnt');
      mnt.layer = Layers.BitMask.NONE;
      scene.insertChild(mnt, 0);
    }
    ctx.mnt = mnt;

    // Root
    const root = scene.getChildByName('Canvas');
    if (!root) {
      // Canvas 是舞台的挂载前提，缺失时中止装配
      throw new Error(`启动错误：场景 ${scene.name} 缺少名为 Canvas 的根节点，舞台装配中止`);
    }
    ctx.root = root;

    // Canvas
    const canvas = root.getComponent(Canvas);
    if (!canvas) {
      throw new Error('Root 缺少 Canvas 组件');
    }
    ctx.canvas = canvas;

    // Stage
    let stage = root.getChildByName('Stage');
    if (!stage) {
      stage = new Node('Stage');
      stage.layer = Layers.BitMask.UI_2D;
      const wid = stage.addComponent(Widget);
      wid.left = wid.top = wid.right = wid.bottom = 0;
      wid.isAlignLeft = wid.isAlignTop = wid.isAlignBottom = wid.isAlignRight = true;
      wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
      wid.updateAlignment();
      root.insertChild(stage, 1);
    }
    ctx.stage = stage;

    // CameraUi
    const cameraUi = root.getChildByName('Camera')?.getComponent(Camera) ?? null;
    if (!cameraUi) {
      throw new Error('Canvas 缺少名为 Camera 的子节点，UI 相机不可用');
    }
    ctx.cameraUi = cameraUi!;

    // dispatch event
    this.affair.sys.notify(Launcher.EVENT.STAGE_READY);
  }
}
