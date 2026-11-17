/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { EachProperties } from '../skill/dict';

/** 访问键 */
export type AccessKey = string | symbol;

/** 可访问环境 */
export type AccessEntry = Record<AccessKey, unknown>;

/** 可访问环境代理 */
export interface AccessDelegate {
  /**
   * 查询键值对
   * @param k 键
   * @returns 是否存在键值对
   */
  has(k: AccessKey): boolean;
  /**
   * 获取键值对的值
   * @param k 键
   * @returns 键值对的值
   */
  get(k: AccessKey): unknown;
  /**
   * 设置键值对
   * @param k 键
   * @param v 值
   */
  set(k: AccessKey, v: unknown): boolean;
  /**
   * 移除键值对
   * @param k 键
   * @returns 操作成功与否
   */
  delete(k: AccessKey): boolean;
  /**
   * 清空键值对
   */
  clear(): void;
  /**
   * 遍历键值对
   * @param visit 访问方法
   */
  each(visit: (v: unknown, k: AccessKey) => void): void;
}

/** 可访问环境接口 */
export interface AccessApi extends KnotApi<KnotOptions> {
  /** 全局环境 */
  global: AccessDelegate;
  /** 用户环境 */
  user: AccessDelegate;
  /** 开发环境 */
  dev: AccessDelegate;
  /** 是否存在环境 */
  has(trait: string): boolean;
  /** 获取指定环境 */
  get(trait: string): AccessDelegate | undefined;
  /**
   * 注入环境
   * @param trait 标识
   * @param env 环境
   */
  inject(trait: string, env: AccessEntry): void;
}

/** 可访问环境结点 */
export class Access extends Knot implements AccessApi {
  // public

  public constructor() {
    super();

    this.__workspaces = new Map();
  }

  public get trait(): string {
    return 'access';
  }

  public get global() {
    return this.__workspaces.get('global')!;
  }

  public get user() {
    return this.__workspaces.get('user')!;
  }

  public get dev() {
    return this.__workspaces.get('dev')!;
  }

  public has(trait: string) {
    return this.__workspaces.has(trait);
  }

  public get(trait: string) {
    return this.__workspaces.get(trait);
  }

  public inject(trait: string, env?: AccessEntry) {
    if (this.__workspaces.has(trait)) {
      this.logger.warn(`环境已存在，请勿重复添加 >>> ${trait}`);
      return;
    }

    this.__workspaces.set(trait, this.__delegate(env ?? Object.create(null)));
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.inject('global', (globalThis || window || self || frames || {}) as AccessEntry);
    this.inject('user');
    this.inject('dev');
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__workspaces.clear();
    return Promise.resolve(true);
  }

  // private

  /**
   * 代理可访问环境
   * @param access 插件
   * @param env 可访问环境
   * @returns
   */
  private __delegate(env: AccessEntry): AccessDelegate {
    const self = this;

    return {
      has(k: AccessKey) {
        return Object.prototype.hasOwnProperty.call(env, k);
      },
      get(k: AccessKey) {
        if (this.has(k)) {
          return env[k];
        }
        return undefined;
      },
      set(k: AccessKey, v: unknown) {
        try {
          env[k] = v;
          return true;
        } catch (e) {
          self.logger.warn(`修改属性失败:`, e);
          return false;
        }
      },
      delete(k: AccessKey) {
        if (Object.prototype.hasOwnProperty.call(env, k)) {
          return delete env[k];
        }
        return false;
      },
      clear() {
        EachProperties(env, (k) => this.delete(k));
      },
      each(visit: (v: unknown, k: AccessKey) => void) {
        EachProperties(env, (k) => {
          // 快照可能包含遍历中被回调移除的键，跳过以保证 visit 收到的值存在
          if (this.has(k)) {
            visit(env[k], k);
          }
        });
      },
    };
  }

  private __workspaces: Map<string, AccessDelegate>;
}
