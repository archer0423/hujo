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
import { GuiViewApi } from './view.typings';
import { GuiWorldApi } from './world.typings';

/** 世界层结点 */
export class GuiWorld extends GuiLayerApsect implements GuiWorldApi {
  // public

  public override get trait(): string {
    return 'world';
  }

  public override get layer(): GuiLayer {
    return GuiLayer.World;
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
