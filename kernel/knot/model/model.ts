/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Constructor } from 'cc';

import { Knot } from '../../core/knot';
import { DTO } from './dto';
import { ModelApi, ModelOptions } from './model.typings';
import { VO } from './vo';

/** 数据模型结点 */
export class Model extends Knot<ModelOptions> implements ModelApi {
  // public
  public constructor() {
    super();

    this.__vo = new Map();
    this.__dto = new Map();
    this.__dtoSolo = new Map();
    this.__voSolo = new Map();
  }

  public override get trait(): string {
    return 'model';
  }

  public register(o: Constructor<DTO> | Constructor<VO>): void {
    const { trait, mtype } = o.prototype;
    if (mtype === 'vo') {
      if (this.__vo.has(trait)) {
        this.logger.warn(`视图模型已存在，请勿重复注册 >>> ${trait}`);
        return;
      }
      this.__vo.set(trait, o as Constructor<VO>);
    } else if (mtype === 'dto') {
      if (this.__dto.has(trait)) {
        this.logger.warn(`数据模型已存在，请勿重复注册 >>> ${trait}`);
        return;
      }
      this.__dto.set(trait, o as Constructor<DTO>);
    }
  }

  public registerBatch(items: (Constructor<DTO> | Constructor<VO>)[]): void {
    for (const item of items) {
      this.register(item);
    }
  }

  public vo<V extends VO>(trait: string, solo: boolean = false): V {
    if (!this.__vo.has(trait)) {
      throw `视图模型未注册 >>> ${trait}`;
    }

    if (solo && this.__voSolo.has(trait)) {
      return this.__voSolo.get(trait)! as V;
    }

    const ctor = this.__vo.get(trait)!;
    const inst = new ctor() as V;
    inst.initialize();
    if (solo) {
      this.__voSolo.set(trait, inst);
    }

    return inst;
  }

  public dto<D extends DTO>(trait: number, solo: boolean = false): D {
    if (!this.__dto.has(trait)) {
      throw `数据模型未注册 >>> ${trait}`;
    }

    if (solo && this.__dtoSolo.has(trait)) {
      return this.__dtoSolo.get(trait)! as D;
    }

    const ctor = this.__dto.get(trait)!;
    const inst = new ctor() as D;
    inst.initialize();
    if (solo) {
      this.__dtoSolo.set(trait, inst);
    }

    return inst;
  }

  // protected

  protected override _attach(): Promise<boolean> {
    this.registerBatch(this.options.models);

    return Promise.resolve(true);
  }

  protected override _detach(): Promise<boolean> {
    this.__dto.clear();
    this.__vo.clear();
    this.__dtoSolo.clear();
    this.__voSolo.clear();

    return Promise.resolve(true);
  }

  // private

  /** 数据模型 */
  private __dto: Map<number, Constructor<DTO>>;
  /** 视图模型 */
  private __vo: Map<string, Constructor<VO>>;
  private __dtoSolo: Map<number, DTO>;
  private __voSolo: Map<string, VO>;
}
