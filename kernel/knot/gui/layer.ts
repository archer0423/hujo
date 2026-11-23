/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { js, Component, Constructor, Layers, Node, UITransform } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { GuiApi } from './gui';
import { CargoGuiURI, GuiLayer, GuiSchema, GuiStructSchema } from './typings';
import { GuiViewApi } from './view';

/** 视图层切片配置 */
export interface GuiApsectOptions extends KnotOptions {}

/** 视图层切片接口 */
export interface GuiApsectApi extends KnotApi<GuiApsectOptions> {
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
  didOpen(view: GuiViewApi, struct: GuiStructSchema): Promise<void>;
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
  /** 所属层级 */
  get layer(): GuiLayer;
  /** 视图堆栈深度 */
  get depth(): number;
}

/** 视图层切片结点 */
export abstract class GuiApsect extends Knot<GuiApsectOptions> implements GuiApsectApi {
  // public

  declare public readonly gui: GuiApi;

  /** 视图结构 */
  public schema!: GuiSchema;

  public constructor() {
    super();

    this._openList = new Map();
  }

  public abstract get layer(): GuiLayer;

  public override get deps(): string[] {
    return ['gui'];
  }

  public get stack(): GuiViewApi[] {
    return [...this._openList.values()];
  }

  public get depth(): number {
    return this._openList.size;
  }

  public abstract preOpen(uri: CargoGuiURI): Promise<boolean>;
  public abstract preClose(view: GuiViewApi): Promise<boolean>;

  public async didOpen(view: GuiViewApi, struct: GuiStructSchema): Promise<void> {
    // 构建视图结构
    const schema: GuiSchema = {};
    for (const alias in struct) {
      const [path, ctor] = struct[alias];
      const name = js.getClassName(ctor);
      const node = view.root.getChildByPath(path);
      if (!node) {
        schema[alias] = undefined;
        this.logger.warn(`节点不存在 >>> ${alias} | ${view.uri}/${path}`);
        continue;
      }
      if (name === 'cc.Node') {
        schema[alias] = node!;
      } else {
        const comp = node.getComponent(ctor as Constructor<Component>);
        if (!comp) {
          schema[alias] = undefined;
          this.logger.warn(`组件不存在 >>> ${alias} | ${view.uri}/${path}@${name}`);
          continue;
        }
        schema[alias] = comp;
      }
    }
    this.schema = Object.freeze(schema);

    // 添加视图
    const id = ++this.__id;
    view.id = id;
    this._openList.set(id, view);
    this._root.addChild(view.root);

    // 视图动画与预备
    await view.onEnterBegan();
    await view.onEnterEnded();

    return Promise.resolve();
  }

  public async didClose(view: GuiViewApi) {
    this._openList.delete(view.id);
    await view.onExitBegan();
    await view.onExitEnded();
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

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // private

  /** 视图编号自增计数器 */
  private __id: number = 0;
}
