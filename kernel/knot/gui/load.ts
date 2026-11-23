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

/** 加载层配置 */
export interface GuiLoadOptions extends GuiApsectOptions {}

/** 加载层接口 */
export interface GuiLoadApi extends GuiApsectApi {}

/** 加载层结点 */
export class GuiLoad extends GuiApsect implements GuiLoadApi {
  // public

  public override get trait(): string {
    return 'load';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Load;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    if (this.isOpen(uri)) {
      return Promise.resolve(false);
    }

    // 同时只能存在一个加载视图
    await this.top?.close();

    return Promise.resolve(true);
  }

  public override async preClose(view: GuiViewApi): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected override async _onDidOpenBegan(view: GuiViewApi): Promise<void> {
    await this.gui.closeLayer(GuiLayer.Dialog);
    await this.gui.closeLayer(GuiLayer.Popup);
    await this.gui.closeLayer(GuiLayer.Screen);
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
