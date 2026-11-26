/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Knot } from '../../core/knot';
import { EachProperties } from '../../skill/dict';
import { AccessApi, AccessDelegate, AccessEntry, AccessKey } from './access.typings';

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

  public put(trait: string, env?: AccessEntry) {
    if (this.__workspaces.has(trait)) {
      this.logger.warn(`环境已存在，请勿重复添加 >>> ${trait}`);
      return;
    }

    this.__workspaces.set(trait, this.__delegate(env ?? Object.create(null)));
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.put('global', (globalThis || window || self || frames || {}) as AccessEntry);
    this.put('user');
    this.put('dev');
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
