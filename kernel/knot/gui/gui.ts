/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { LRU } from '../../cord/lru';
import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { SetProperty } from '../../skill/dict';
import { Cargo } from '../cargo/cargo';
import { CargoRegistryApi } from '../cargo/registry';
import { IsTargetedCargoURI } from '../cargo/util';
import { GuiAlertApi } from './alert';
import { GuiDialogApi } from './dialog';
import { GuiLeadApi } from './lead';
import { GuiLoadApi } from './load';
import { GuiMaskApi } from './mask';
import { GuiMenuApi } from './menu';
import { GuiPopupApi } from './popup';
import { GuiScreenApi } from './screen';
import { GuiToastApi } from './toast';
import { GuiTopApi } from './top';
import { GuiTransitionApi } from './transition';
import { GuiTrumpetApi } from './trumpet';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';
import { GuiWorldApi } from './world';

/** Gui 系统配置 */
export interface GuiOotions extends KnotOptions {
  /** LRU 缓存上限（默认 3） */
  lru?: number;
}

/** Gui 系统接口 */
export interface GuiApi extends KnotApi<GuiOotions> {
  /**
   * 打开视图
   * @param uri 视图资产标识
   */
  open(uri: CargoGuiURI, args?: Record<string, unknown>): Promise<boolean>;
  /**
   * 关闭视图
   * @param view 视图
   */
  close(view: GuiViewApi): Promise<boolean>;
  /**
   * 关闭视图层级
   * @param layer 视图层级
   */
  closeLayer(layer: GuiLayer): Promise<void>;
  /** 返回 */
  back(): Promise<boolean>;
  /** 聚焦到下一个顶层视图 */
  focus(): void;
  /** 使上一个顶层视图失焦 */
  blur(): void;
  /** 刷新遮罩 */
  refreshMask(): void;
}

/** Gui 系统结点 */
export class Gui extends Knot<GuiOotions> implements GuiApi {
  // public

  declare public readonly cargo: Cargo;
  declare public readonly registry: CargoRegistryApi;
  declare public readonly mask: GuiMaskApi;
  declare public readonly world: GuiWorldApi;
  declare public readonly menu: GuiMenuApi;
  declare public readonly screen: GuiScreenApi;
  declare public readonly popup: GuiPopupApi;
  declare public readonly dialog: GuiDialogApi;
  declare public readonly toast: GuiToastApi;
  declare public readonly trumpet: GuiTrumpetApi;
  declare public readonly lead: GuiLeadApi;
  declare public readonly load: GuiLoadApi;
  declare public readonly transition: GuiTransitionApi;
  declare public readonly alert: GuiAlertApi;
  declare public readonly top: GuiTopApi;

  public constructor() {
    super();

    this.__requests = new Map();
  }

  public get trait(): string {
    return 'gui';
  }

  public override get deps(): string[] {
    return [
      'cargo',
      'registry',
      'mask',
      'world',
      'menu',
      'screen',
      'popup',
      'dialog',
      'toast',
      'trumpet',
      'lead',
      'load',
      'transition',
      'alert',
      'top',
    ];
  }

  public get stack(): GuiViewApi[] {
    return [...this.screen.stack, ...this.popup.stack, ...this.dialog.stack];
  }

  public back(): Promise<boolean> {
    const stack = this.stack;
    if (stack.length === 0) {
      return Promise.resolve(false);
    }

    const top = stack[stack.length - 1];
    return this.close(top);
  }

  public async open(uri: CargoGuiURI, args?: Record<string, unknown>): Promise<boolean> {
    if (this.__requests.has(uri)) {
      return this.__requests.get(uri)!;
    }

    const promise = this.__open(uri, args);
    promise.then((ok) => {
      if (ok) {
        this.refreshMask();
      }
      this.__requests.delete(uri);
    });
    this.__requests.set(uri, promise);
    return promise;
  }

  public async close(view: GuiViewApi): Promise<boolean> {
    if (!view) {
      this.logger.warn(`无效的视图`, view);
      return Promise.resolve(false);
    }

    const { lru, layer } = this.registry.get(view.uri)!;
    const layerInst = this.__getLayerOf(layer!)!;
    const ok = await layerInst.preClose(view);
    if (!ok) {
      return Promise.resolve(false);
    }

    // 关闭视图
    await layerInst.didClose(view);

    if (lru) {
      // 缓存视图
      this.__lru.set(view.uri, view);
    } else {
      // 释放视图
      this.cargo.deinstantiate(view.root);
    }

    // 聚焦到下一个顶层视图
    this.focus();
    this.refreshMask();

    return Promise.resolve(true);
  }

  public async closeLayer(layer: GuiLayer): Promise<void> {
    const layerInst = this.__getLayerOf(layer);
    if (layerInst) {
      return layerInst.closeAll();
    }
  }

  public focus() {
    if (this.alert.depth) {
      this.alert.top!.focus();
    } else if (this.dialog.depth) {
      this.dialog.top!.focus();
    } else if (this.popup.depth) {
      this.popup.top!.focus();
    } else if (this.screen.depth) {
      this.screen.top!.focus();
    } else if (this.menu.depth) {
      this.menu.top!.focus();
    }
  }

  public blur() {
    if (this.alert.depth) {
      this.alert.top!.blur();
    } else if (this.dialog.depth) {
      this.dialog.top!.blur();
    } else if (this.popup.depth) {
      this.popup.top!.blur();
    } else if (this.screen.depth) {
      this.screen.top!.blur();
    } else if (this.menu.depth) {
      this.menu.top!.blur();
    }
  }

  /** 刷新遮罩 */
  public refreshMask() {
    if (this.alert.depth) {
      this.mask.show(this.alert.top!);
    } else if (this.dialog.depth) {
      this.mask.show(this.dialog.top!);
    } else if (this.popup.depth) {
      this.mask.show(this.popup.top!);
    } else if (this.screen.depth) {
      this.mask.show(this.screen.top!);
    } else {
      this.mask.hide();
    }
  }

  // protected

  protected _attach(): Promise<boolean> {
    const { lru } = this.options;
    this.options.lru = Math.max(1, Number.isFinite(lru) ? lru! | 0 : 3);
    this.__lru = new LRU(this.options.lru!);
    this.__lru.onRemoved = (view) => this.cargo.deinstantiate(view.root);

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__lru.each((view) => this.__lru.onRemoved?.(view));
    this.__lru.clear();

    return Promise.resolve(true);
  }

  // private

  /** 打开请求 */
  private __requests: Map<CargoGuiURI, Promise<boolean>>;
  /** 视图缓存 */
  private __lru!: LRU<CargoGuiURI, GuiViewApi>;

  /**
   * 获取视图层级结点
   * @param layer 视图层级
   * @returns
   */
  private __getLayerOf(layer: GuiLayer) {
    switch (layer) {
      case GuiLayer.World:
        return this.world;
      case GuiLayer.Menu:
        return this.menu;
      case GuiLayer.Screen:
        return this.screen;
      case GuiLayer.Popup:
        return this.popup;
      case GuiLayer.Dialog:
        return this.dialog;
      case GuiLayer.Toast:
        return this.toast;
      case GuiLayer.Trumpet:
        return this.trumpet;
      case GuiLayer.Lead:
        return this.lead;
      case GuiLayer.Load:
        return this.load;
      case GuiLayer.Transition:
        return this.transition;
      case GuiLayer.Alert:
        return this.alert;
      case GuiLayer.Top:
        return this.top;
      default:
        break;
    }
  }

  private async __open(uri: CargoGuiURI, args?: Record<string, unknown>) {
    // 前置校验是否有效的视图资产
    if (!IsTargetedCargoURI(uri, 'prefab')) {
      this.logger.warn(`无效的视图资产标识 >>> ${uri}`);
      return Promise.resolve(false);
    }

    if (!this.registry.has(uri)) {
      this.logger.warn(`视图资产未注册 >>> ${uri}`);
      return Promise.resolve(false);
    }

    // 校验注册参数
    const { layer, alias, view, presenter, schema } = this.registry.get(uri)!;

    if (
      layer === undefined ||
      !Number.isInteger(layer) ||
      layer < GuiLayer.World ||
      layer > GuiLayer.Top
    ) {
      this.logger.warn(`视图所属层级错误 >>> ${uri}|layer(${layer})`);
      return Promise.resolve(false);
    }

    if (alias === undefined) {
      this.logger.warn(`视图别名未定义 >>> ${uri}`);
      return Promise.resolve(false);
    }

    if (view === undefined) {
      this.logger.warn(`View 工厂未定义 >>> ${uri}`);
      return Promise.resolve(false);
    }

    if (presenter === undefined) {
      this.logger.warn(`Presenter 工厂未定义 >>> ${uri}`);
      return Promise.resolve(false);
    }

    if (schema === undefined) {
      this.logger.warn(`视图结构未定义 >>> ${uri}`);
      return Promise.resolve(false);
    }

    // 视图层级打开的前置校验
    const layerInst = this.__getLayerOf(layer!)!;
    const ok = await layerInst.preOpen(uri);
    if (!ok) {
      this.logger.warn(`不允许打开该视图 >>> ${uri}|layer(${GuiLayer[layer]})`);
      return Promise.resolve(false);
    }

    // 尝试从缓存中取
    if (this.__lru.has(uri)) {
      const page = this.__lru.get(uri)!;
      this.__lru.delete(uri);
      await layerInst.didOpen(page);
      await page.open(args);
      return Promise.resolve(true);
    }

    // 加载资产
    const loaded = await this.cargo.load(uri);
    if (!loaded) {
      this.logger.warn(`视图资产加载失败 >>> ${uri}`);
      return Promise.resolve(false);
    }

    // 使上一个顶层视图失焦
    this.blur();

    // 实例化资产
    const root = this.cargo.instantiate(uri)!;
    const page = new view(root, schema, presenter);
    SetProperty(page, 'root', root);
    SetProperty(page, 'uri', uri);
    SetProperty(page, 'alias', alias);
    SetProperty(page, 'layer', layer);

    await layerInst.didOpen(page);
    await page.open(args);

    return Promise.resolve(true);
  }
}
