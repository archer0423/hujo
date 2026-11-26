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
import { GuiTrumpetApi } from './trumpet.typings';
import { GuiViewApi } from './view.typings';

/** 全服通告层结点 */
export class GuiTrumpet extends GuiLayerApsect implements GuiTrumpetApi {
  // public

  public override get trait(): string {
    return 'trumpet';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.Trumpet;
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
