/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { BlockInputEvents, Widget } from 'cc';

import { GuiApsect, GuiApsectApi, GuiApsectOptions } from './layer';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 紧急模态弹窗层配置 */
export interface GuiAlertOptions extends GuiApsectOptions {}

/** 紧急模态弹窗层接口 */
export interface GuiAlertApi extends GuiApsectApi {}

/** 紧急模态弹窗层结点 */
export class GuiAlert extends GuiApsect implements GuiAlertApi {
  // public

  public override get trait(): string {
    return 'alert';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Alert;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    return Promise.resolve(true);
  }

  public override async preClose(view: GuiViewApi): Promise<boolean> {
    return Promise.resolve(true);
  }

  // protected

  protected override _onDidAttach(): void {
    const wid = this._root.addComponent(Widget);
    this._root.addComponent(BlockInputEvents);
    wid.target = this._root.parent;
    wid.left = wid.top = wid.right = wid.bottom = 0;
    wid.isAlignLeft = wid.isAlignTop = wid.isAlignBottom = wid.isAlignRight = true;
    wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    wid.updateAlignment();
  }

  // private
}
