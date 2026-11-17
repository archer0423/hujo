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
import { MISC } from '../skill/env';
import { RunSync } from '../skill/might';

/** Cocos Creator Spider */
interface CCSpider {
  /**
   * 获取字段
   * @param trait 字段名称
   */
  get<T>(trait: string): T;
  /**
   * 添加或更新字段
   * @param trait 字段名称
   * @param value 字段值
   */
  add(trait: string, value: string): void;
  /**
   * 更新字段
   * @param trait 字段名称
   * @param value 字段值
   */
  update(trait: string, value: string): void;
  /**
   * 移除字段
   * @param trait 字段名称
   */
  remove(trait: string): void;
  /** 清空所有字段 */
  clear(): void;
  /** 显示面板 */
  show(): void;
  /** 隐藏面板 */
  hide(): void;
}

/** 监视器静态项目 */
export interface SpiderStaticField {
  /** 字段名称 */
  trait: string;
  /** 字段值 */
  value: string;
}

/** 监视器动态项目 */
export interface SpiderDynamicField {
  /** 字段名称 */
  trait: string;
  /** 更新频率 */
  interval: number;
  /** 输出值 */
  output(): string;
}

/** 监视器手动项目 */
export interface SpiderManualField {
  /** 字段名称 */
  trait: string;
  /** 输出值 */
  output(): string;
  /** 初始化 */
  init(): void;
  /** 销毁 */
  destroy(): void;
}

/** 监视器项目（静态、动态、手动） */
export type SpiderFields = SpiderStaticField | SpiderDynamicField | SpiderManualField;

/** 数据监视器配置 */
export interface SpiderOptions extends KnotOptions {
  spider: CCSpider;
}

/** 字段生命周期元数据：清理所需的一切由能力侧自行登记，不依赖 Inspector 内部存储 */
export interface SpiderFieldMeta {
  /**
   * 动态字段的定时器 id
   * @tip 本插件仅在浏览器环境（MISC.BROWSER）工作，setInterval 实际返回 number；
   *      Node 的 clearInterval 亦兼容 number 传入，双端均可正确清除
   */
  timer?: number;
  /** 手动字段描述（Destroy 据此调用） */
  manual?: SpiderManualField;
}

/** 数据监视器插件接口 */
export interface SpiderApi extends KnotApi<SpiderOptions> {
  /** 功能是否可用 */
  get available(): boolean;
  /** 显示面板 */
  showPanel(): void;
  /** 隐藏面板 */
  hidePanel(): void;
  /** 添加字段（Spider 不可用时拒绝并告警） */
  add(field: SpiderFields): void;
  /** 移除字段（不受可用性守卫：容器清理始终执行，面板移除经 RunSync 兜底） */
  remove(name: string): void;
  /** 清空（监视器所持的）所有字段（不受可用性守卫） */
  clear(): void;
}

/**
 * 数据监视器结点
 */
export class Spider extends Knot<SpiderOptions> implements SpiderApi {
  // public

  public constructor() {
    super();

    this.__container = new Map();
  }

  public get trait(): string {
    return 'spider';
  }

  public get available(): boolean {
    return MISC.BROWSER && !!this.options.spider;
  }

  public showPanel(): void {
    if (this.available) {
      this.options.spider.show();
    }
  }

  public hidePanel(): void {
    if (this.available) {
      this.options.spider.hide();
    }
  }

  public add(field: SpiderFields): void {
    const trait = field.trait;
    if (!this.available) {
      // Spider 脚本注入晚于建字段时（时序常见）字段会无声丢失，至少告警一次以供追溯
      this.logger.warn(`Spider 不可用，字段添加被忽略: ${trait}`);
      return;
    }

    // 校验前置：非法间隔拒绝添加且不清理既有同名字段（0/负数/NaN 均会触发浏览器最小间隔高频刷新）
    if ('interval' in field && (!Number.isFinite(field.interval) || field.interval <= 0)) {
      this.logger.error(`interval 须为正数，已拒绝添加: ${field.trait}（当前 ${field.interval}）`);
      return;
    }

    // 同名先清理：旧定时器/旧手动字段资源不再泄漏
    this.remove(field.trait);

    // 判别顺序契约：静态(Value) → 动态(Interval+Output) → 手动(Init+Destroy+Output)；
    // 字段对象不得携带其它分支的特有键，否则按靠前分支处理
    if ('value' in field) {
      // 添加静态字段
      this.__container.set(field.trait, {});
      this.options.spider.add(field.trait, field.value);
      return;
    }

    if ('interval' in field && 'output' in field) {
      // 添加动态字段
      const [output, err] = RunSync(field.output, field);
      if (err) {
        this.logger.error(`动态字段首次更新失败，已拒绝添加: ${field.trait}`);
        return;
      }

      const timer = setInterval(() => {
        const [output, e1] = RunSync(field.output, field);
        if (e1) {
          this.logger.error(`动态字段更新失败: ${field.trait}`);
          return;
        }

        // 经闭包延迟取全局：spider 消失时 ReferenceError 在此收敛，走自动移除路径
        const e2 = RunSync(() => this.options.spider.update(field.trait, output!))[1];
        if (e2) {
          // 反复执行的回调必须隔离：失败即自动移除，避免定时器以原频率持续重抛刷屏
          this.logger.error(`动态字段更新失败，已自动移除: ${field.trait}`, e2);
          this.remove(field.trait);
        }
      }, field.interval) as unknown as number;
      this.__container.set(field.trait, { timer: timer });
      this.options.spider.add(field.trait, output!);
      return;
    }

    if ('init' in field && 'destroy' in field && 'output' in field) {
      // 添加手动字段
      // 先初始化：首次取值方能依赖 init 建立的状态
      const e1 = RunSync(field.init, field)[1];
      if (e1) {
        this.logger.error(`手动字段初始化失败，已拒绝添加: ${field.trait}`, e1);
        return;
      }

      const [output, e2] = RunSync(field.output, field);
      if (e2) {
        this.logger.error(`手动字段首次更新失败，已拒绝添加: ${field.trait}`, e2);
        return;
      }

      this.__container.set(field.trait, { manual: field });
      this.options.spider.add(field.trait, output!);
      return;
    }

    // 三分支全不命中：残缺字段定义（如手动字段缺 Init/Destroy），拒绝并告警
    this.logger.error(`无法识别的字段定义，已拒绝添加: ${trait}`);
  }

  public remove(trait: string): void {
    const meta = this.__container.get(trait);
    if (!meta) {
      return;
    }

    if (meta.timer !== undefined) {
      clearInterval(meta.timer);
    }

    if (meta.manual) {
      const err = RunSync(meta.manual.destroy, meta.manual)[1];
      if (err) {
        this.logger.error(`手动字段销毁调用失败: ${trait}`, err);
      }
    }

    this.__container.delete(trait);
    // 不受 Available 守卫：容器清理是插件内部状态，spider 消失时也必须完成，
    // 否则动态字段定时器泄漏且每拍重抛；面板移除经闭包 + RunSync 兜底收敛
    const err = RunSync(() => this.options.spider.remove(trait))[1];
    if (err) {
      this.logger.error(`监视器字段移除失败: ${trait}`, err);
    }
  }

  public clear(): void {
    for (const [trait] of this.__container) {
      this.remove(trait);
    }
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.clear();
    return Promise.resolve(true);
  }

  // private

  /** 字段容器 */
  private __container: Map<string, SpiderFieldMeta>;
}
