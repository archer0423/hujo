/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { __private, Camera, Canvas, Node, Scene } from 'cc';

import { KnotApi, KnotOptions } from '../../core/knot';

/** 语言代码 */
export type LanguageType = __private._pal_system_info_enum_type_language__Language;

/**
 * 应用构建版本
 */
export enum Build {
  /** 内部开发版 */
  Dev = 'dev',
  /** 内部测试版 */
  Alpha = 'alpha',
  /** 公开测试版 */
  Beta = 'beta',
  /** 候选发布版 */
  Candidate = 'candidate',
  /** 正式发布版 */
  Release = 'release',
}

/** 启动器插件配置 */
export interface LauncherOptions extends KnotOptions {
  /** 应用名称 */
  app: string;
  /** 应用版本号 */
  version: string;
  /** 构建版本 */
  build: Build;
  /** 支持语言 */
  language: LanguageType[];
  /** 用户空间标识（仅开发时使用，用于区分独立数据的用户空间，默认 `default`） */
  workspace?: string;
  /** 允许经 URL 覆写的配置键（在默认白名单基础上追加，保留键除外） */
  allowedUrlKeys?: string[];

  [k: string]: unknown;
}

/**
 * 启动器接口
 *
 * - 负责管理启动参数
 *
 * @tip 【单场景架构约束】
 * scene/root/mnt/canvas/cameraUi/stage 仅在首个场景启动时装配一次，并随之发出 STAGE_READY 事件。
 */
export interface LauncherApi extends KnotApi<LauncherOptions> {
  /** 应用名称 */
  readonly app: string;
  /** 应用版本号 */
  readonly version: string;
  /** 构建版本 */
  readonly build: Build;
  /** 是否开发版本 */
  readonly isDev: boolean;
  /** 是否内测版本 */
  readonly isAlpha: boolean;
  /** 是否公测版本 */
  readonly isBeta: boolean;
  /** 是否候选版本 */
  readonly isCandidate: boolean;
  /** 是否正式版本 */
  readonly isRelease: boolean;
  /** 用户空间标识 */
  readonly workspace: string;
  /** 获取当前支持的语言列表 */
  readonly supportedLanguages: LanguageType[];
  /** 是否指定构建版本 */
  isBuildOf(build: Build): boolean;
  /** 是否支持语言 */
  isLanguageSupported(language: LanguageType): boolean;
  /** 场景（场景未启动前为 null，消费方需防护） */
  readonly scene: Scene;
  /** 根节点（场景未启动前为 null，消费方需防护） */
  readonly root: Node;
  /** 挂载节点（场景未启动前为 null，消费方需防护） */
  readonly mnt: Node;
  /** 画布（场景未启动前为 null，消费方需防护） */
  readonly canvas: Canvas;
  /** UI相机（场景未启动前为 null，消费方需防护） */
  readonly cameraUi: Camera;
  /** 舞台（场景未启动前为 null，消费方需防护） */
  readonly stage: Node;
  /** 暂停逻辑 */
  pause(): void;
  /** 恢复逻辑 */
  resume(): void;
  /** 从后台回到前台经历的时间（ms，未经历完整后台往返时为 0） */
  get elapsed(): number;
  /** 运行状态 */
  get running(): boolean;
}
