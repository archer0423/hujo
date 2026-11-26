/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/
import { GuiLayerApsect } from './aspect';
import { CargoGuiURI, GuiLayer } from './gui.typings';
import { GuiToastApi } from './toast.typings';
import { GuiViewApi } from './view.typings';

/** 消息提示层结点 */
export class GuiToast extends GuiLayerApsect implements GuiToastApi {
  // public

  public override get trait(): string {
    return 'toast';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Toast;
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
