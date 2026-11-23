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

import { GuiApsect, GuiApsectApi, GuiApsectOptions } from './layer';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 全屏窗口层配置 */
export interface GuiScreenOptions extends GuiApsectOptions {}

/** 全屏窗口层接口 */
export interface GuiScreenApi extends GuiApsectApi {}

/** 全屏窗口层结点 */
export class GuiScreen extends GuiApsect implements GuiScreenApi {
  // public

  public override get trait(): string {
    return 'screen';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Screen;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    if (this.isOpen(uri)) {
      return Promise.resolve(false);
    }

    // 同时只能存在一个全屏窗口
    await this.top?.close();

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

  protected override async _onDidOpenBegan(view: GuiViewApi): Promise<void> {
    await this.gui.closeLayer(GuiLayer.Dialog);
    await this.gui.closeLayer(GuiLayer.Popup);
  }

  // private
}
