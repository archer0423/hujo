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

/** 主菜单层配置 */
export interface GuiMenuOptions extends GuiApsectOptions {}

/** 主菜单层接口 */
export interface GuiMenuApi extends GuiApsectApi {}

/** 主菜单层结点 */
export class GuiMenu extends GuiApsect implements GuiMenuApi {
  // public

  public override get trait(): string {
    return 'menu';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Menu;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    if (this.isOpen(uri)) {
      return Promise.resolve(false);
    }

    // 同时只能存在一个主菜单
    await this.top?.close();

    return Promise.resolve(true);
  }

  public override async preClose(view: GuiViewApi): Promise<boolean> {
    return Promise.resolve(true);
  }

  // protected

  protected override async _onDidOpenBegan(view: GuiViewApi): Promise<void> {
    await this.gui.closeLayer(GuiLayer.Dialog);
    await this.gui.closeLayer(GuiLayer.Popup);
    await this.gui.closeLayer(GuiLayer.Screen);
  }

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
