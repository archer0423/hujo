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

/** 引导层配置 */
export interface GuiLeadOptions extends GuiLayerApsectOptions {}

/** 引导层接口 */
export interface GuiLeadApi extends GuiLayerApsectApi {}

/** 引导层结点 */
export class GuiLead extends GuiLayerApsect implements GuiLeadApi {
  // public

  public override get trait(): string {
    return 'lead';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Lead;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    if (this.isOpen(uri)) {
      return Promise.resolve(false);
    }

    // 同时只能存在一个新手引导步骤
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

  // private
}
