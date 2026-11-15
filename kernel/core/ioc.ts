/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Knot, KnotCtor, KnotOptions } from './knot';

/**
 * 依赖容器
 */
class IoC {
  // public

  public constructor() {
    this.__knots = new Map();
    this.__appContext = undefined;
  }

  /**
   * 注册结点
   * @param ctor 结点构造
   * @param options 结点选项
   */
  public register<K extends Knot>(ctor: KnotCtor<K>, options: K['options']) {
    const trait = ctor.prototype.trait;
    if (this.__knots.has(trait)) {
      throw `Knot 已注册 >>> ${trait}`;
    }

    const knot = new ctor();
    knot.register(options!);
    this.__knots.set(trait, knot);
  }

  /**
   * 解析结点
   * @param tin 结点标识或构造
   * @returns
   */
  public resolve<K extends Knot>(tin: string | KnotCtor<K>): K {
    const trait = typeof tin === 'string' ? tin : tin.prototype.trait;
    if (!this.__knots.has(trait)) {
      throw `Knot 未注册 >>> ${trait}`;
    }
    return this.__knots.get(trait) as K;
  }

  /**
   * 连接所有结点
   * @tip 所有结点的连接入口，一生只有一次
   * @param app 应用上下文
   */
  public async attach(app: Record<string, Knot>) {
    if (!this.__appContext) {
      this.__appContext = app;
      for (const [trait, knot] of this.__knots) {
        // 挂载依赖
        knot.options.deps?.forEach((dep) => {
          (<any>knot)[dep.prototype.trait] = this.resolve(dep.prototype.trait);
        });
        // 连接结点
        const [ok, err] = await knot.attach();
        if (ok) {
          app[trait] = knot;
        }
        if (err) {
          throw err;
        }
      }
    }
  }

  /**
   * 断开所有结点
   * @tip 所有结点的断开入口，一生只有一次
   */
  public async detach() {
    for (const [trait, knot] of this.__knots) {
      // 断开结点
      const [ok, err] = await knot.detach();
      if (ok) {
        // 卸载依赖
        knot.options.deps?.forEach((dep) => {
          delete (<any>knot)[dep.prototype.trait];
        });
        delete this.__appContext![trait];
      }
      if (err) {
        throw err;
      }
    }

    delete this.__appContext;
  }

  // private

  /** 所有结点 */
  private __knots: Map<string, Knot<KnotOptions>>;
  /** 应用上下文 */
  private __appContext?: Record<string, Knot>;
}

export const ioc = new IoC();
