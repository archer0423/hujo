/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { GuiApsect, GuiApsectApi, GuiApsectOptions } from './layer';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 普通模态弹窗层配置 */
export interface GuiDialogOptions extends GuiApsectOptions {}

/** 普通模态弹窗层接口 */
export interface GuiDialogApi extends GuiApsectApi {}

/** 普通模态弹窗层结点 */
export class GuiDialog extends GuiApsect implements GuiDialogApi {
  // public

  public override get trait(): string {
    return 'dialog';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Dialog;
  }

  public override async preOpen(uri: CargoGuiURI): Promise<boolean> {
    return Promise.resolve(true);
  }

  public override async preClose(view: GuiViewApi): Promise<boolean> {
    return Promise.resolve(true);
  }

  // protected

  // private
}
