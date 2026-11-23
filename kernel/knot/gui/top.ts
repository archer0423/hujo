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

/** 视图顶层配置 */
export interface GuiTopOptions extends GuiApsectOptions {}

/** 视图顶层接口 */
export interface GuiTopApi extends GuiApsectApi {}

/** 视图顶层结点 */
export class GuiTop extends GuiApsect implements GuiTopApi {
  // public

  public override get trait(): string {
    return 'top';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Top;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    // Top 不允许添加任意视图
    return Promise.resolve(false);
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
