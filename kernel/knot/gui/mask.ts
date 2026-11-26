/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Color, EventTouch, Graphics, Layers, Node, Widget } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { LauncherApi } from '../launcher/launcher.typings';
import { GuiApi } from './gui';
import { GuiViewApi } from './view';

/** 弹窗遮罩配置 */
export interface GuiMaskOptions extends KnotOptions {
  /** 颜色（包含透明度） */
  color?: string;
}

/** 弹窗遮罩接口 */
export interface GuiMaskApi extends KnotApi<GuiMaskOptions> {
  show(view: GuiViewApi): void;
  hide(): void;
}

/** 弹窗遮罩结点 */
export class GuiMask extends Knot<GuiMaskOptions> implements GuiMaskApi {
  // public

  declare public readonly launcher: LauncherApi;
  declare public readonly gui: GuiApi;

  public constructor() {
    super();

    this._root = null;
    this.__view = null;
    this.__hits = 0;
  }

  public override get trait(): string {
    return 'mask';
  }

  public override get deps(): string[] {
    return ['gui', 'launcher'];
  }

  public show(view: GuiViewApi): void {
    if (!view || this.__view === view) {
      return;
    }

    this.__view = view;
    this._root!.active = true;
    view.root.parent!.insertChild(this._root!, Math.max(0, view.root.getSiblingIndex() - 1));
    this._root!.active = true;
    this.__repaint();
  }

  public hide() {
    this.__view = null;
    this._root!.active = false;
  }

  // protected

  /** 遮罩根节点 */
  protected _root: Node | null;

  protected override _attach(): Promise<boolean> {
    this.options.color ??= '#00000088';
    const root = new Node('mask');
    this.launcher.stage.addChild(root);
    const wid = root.addComponent(Widget);
    root.addComponent(Graphics);
    root.layer = Layers.BitMask.UI_2D;
    wid.target = this.launcher.stage;
    wid.left = wid.top = wid.right = wid.bottom = 0;
    wid.isAlignLeft = wid.isAlignTop = wid.isAlignBottom = wid.isAlignRight = true;
    wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    wid.updateAlignment();
    root.on(Node.EventType.SIZE_CHANGED, this.__repaint, this);
    root.on(Node.EventType.TOUCH_START, this.__onTouchStart, this, true);
    root.on(Node.EventType.TOUCH_END, this.__onTouchEnd, this, true);
    root.active = false;
    this._root = root;

    this.hide();

    return Promise.resolve(true);
  }

  protected override _detach(): Promise<boolean> {
    this._root!.targetOff(this);
    this._root!.removeFromParent();
    this._root = null;

    return Promise.resolve(true);
  }

  // private

  /** 当前视图 */
  private __view: GuiViewApi | null;
  /** 点击到当前视图的次数 */
  private __hits: number;

  /** 重绘 */
  private __repaint() {
    const graphics = this._root!.getComponent(Graphics)!;
    const { width, height } = this._root!._uiProps.uiTransformComp!;
    Color.fromHEX(graphics.fillColor, this.options.color!);
    graphics.clear();
    graphics.fillRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8);
  }

  /** 触摸开始回调 */
  private __onTouchStart(event: EventTouch) {
    event.propagationStopped = true;
    event.propagationImmediateStopped = true;
    event.preventSwallow = false;
    this.__hits = 0;
    this.__hitView(event);
  }

  /** 触摸结束回调 */
  private __onTouchEnd(event: EventTouch) {
    event.preventSwallow = false;
    if (this.__view && this.__hits === 0 && !this.__hitView(event)) {
      this.__view.onHitOutside();
    }
  }

  /** 是否点击到视图 */
  private __hitView(event: EventTouch) {
    if (this.__view) {
      const pos = event.getLocation();
      if (this.__view.root._uiProps.uiTransformComp!.hitTest(pos)) {
        this.__hits++;
      }
    }
    return this.__hits > 0;
  }
}
