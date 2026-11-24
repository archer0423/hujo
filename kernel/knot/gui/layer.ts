/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Layers, Node, UITransform } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { SetProperty } from '../../skill/dict';
import { Launcher } from '../launcher';
import { GuiApi } from './gui';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 视图层切片配置 */
export interface GuiLayerApsectOptions extends KnotOptions {}

/** 视图层切片接口 */
export interface GuiLayerApsectApi extends KnotApi<GuiLayerApsectOptions> {
  /** 指定资产标识的视图是否已打开 */
  isOpen(uri: CargoGuiURI): boolean;
  /**
   * 打开视图前置校验
   * @param uri 视图资产标识
   */
  preOpen(uri: CargoGuiURI): Promise<boolean>;
  /**
   * 打开视图
   * @param view 视图
   * @param struct 视图结构构造
   */
  didOpen(view: GuiViewApi): Promise<void>;
  /**
   * 关闭视图前置校验
   * @param view 视图
   */
  preClose(view: GuiViewApi): Promise<boolean>;
  /**
   * 关闭视图
   * @param view 视图
   */
  didClose(view: GuiViewApi): Promise<GuiViewApi>;
  /** 关闭所有视图 */
  closeAll(): Promise<void>;
  /** 视图堆栈 */
  get stack(): GuiViewApi[];
  /** 顶层视图 */
  get top(): GuiViewApi | undefined;
  /** 所属层级 */
  get layer(): GuiLayer;
  /** 视图堆栈深度 */
  get depth(): number;
}

/** 视图层切片结点 */
export abstract class GuiLayerApsect
  extends Knot<GuiLayerApsectOptions>
  implements GuiLayerApsectApi
{
  // public

  declare public readonly launcher: Launcher;
  declare public readonly gui: GuiApi;

  public constructor() {
    super();

    this._openList = new Map();
  }

  public abstract get layer(): GuiLayer;

  public override get deps(): string[] {
    return ['gui', 'launcher'];
  }

  public get stack(): GuiViewApi[] {
    return [...this._openList.values()];
  }

  public get top() {
    return this.stack.pop();
  }

  public get depth(): number {
    return this._openList.size;
  }

  public isOpen(uri: CargoGuiURI) {
    for (const [, view] of this._openList) {
      if (view.uri === uri) {
        return true;
      }
    }
    return false;
  }

  public abstract preOpen(uri: CargoGuiURI): Promise<boolean>;
  public abstract preClose(view: GuiViewApi): Promise<boolean>;

  public async didOpen(view: GuiViewApi): Promise<void> {
    // 添加视图：视图动画与预备
    const id = ++this.__id;
    SetProperty(view, 'id', id);
    this._openList.set(id, view);
    this._root.addChild(view.root);
    view.build();
    await this._onDidOpenBegan(view);
    await view.onEnterBegan();
    await view.onEnterEnded();
    await this._onDidOpenEnded(view);

    return Promise.resolve();
  }

  public async didClose(view: GuiViewApi) {
    // 移除视图：视图动画与清理
    this._openList.delete(view.id);
    await this._onDidCloseBegan(view);
    await view.onExitBegan();
    await view.onExitEnded();
    await this._onDidCloseEnded(view);
    view.root.removeFromParent();

    return Promise.resolve(view);
  }

  public async closeAll() {
    for (const view of this.stack.reverse()) {
      await this.gui.close(view);
    }
  }

  // protected

  /** 视图根节点 */
  protected _root!: Node;

  /** 已打开视图列表 */
  protected _openList: Map<number, GuiViewApi>;

  protected _attach(): Promise<boolean> {
    const root = new Node(this.trait);
    root.layer = Layers.BitMask.UI_2D;
    root.addComponent(UITransform);
    this._root = root;
    this.launcher.stage.addChild(root);

    this._onDidAttach();

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /** 视图层级就绪回调 */
  protected _onDidAttach() {}

  /** 视图打开回调（进入前） */
  protected _onDidOpenBegan(view: GuiViewApi): Promise<void> {
    return Promise.resolve();
  }
  /** 视图打开回调（进入后） */
  protected _onDidOpenEnded(view: GuiViewApi): Promise<void> {
    return Promise.resolve();
  }
  /** 视图关闭回调（退出前） */
  protected _onDidCloseBegan(view: GuiViewApi): Promise<void> {
    return Promise.resolve();
  }
  /** 视图关闭回调（退出后） */
  protected _onDidCloseEnded(view: GuiViewApi): Promise<void> {
    return Promise.resolve();
  }

  // private

  /** 视图编号自增计数器 */
  private __id: number = 0;
}
