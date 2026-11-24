/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/
import { Widget } from 'cc';

import { GuiLayerApsect, GuiLayerApsectApi, GuiLayerApsectOptions } from './layer';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 非模态弹窗层配置 */
export interface GuiPopupOptions extends GuiLayerApsectOptions {}

/** 非模态弹窗层接口 */
export interface GuiPopupApi extends GuiLayerApsectApi {}

/** 非模态弹窗层结点 */
export class GuiPopup extends GuiLayerApsect implements GuiPopupApi {
  // public

  public override get trait(): string {
    return 'popup';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Popup;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    if (this.isOpen(uri)) {
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  }

  public override async preClose(view: GuiViewApi): Promise<boolean> {
    return Promise.resolve(true);
  }

  // protected

  protected override _onDidAttach(): void {
    const wid = this._root.addComponent(Widget);
    wid.target = this._root.parent;
    wid.left = wid.top = wid.right = wid.bottom = 0;
    wid.isAlignLeft = wid.isAlignTop = wid.isAlignBottom = wid.isAlignRight = true;
    wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    wid.updateAlignment();
  }

  // private
}
