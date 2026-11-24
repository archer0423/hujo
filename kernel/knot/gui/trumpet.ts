/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/
import { GuiLayerApsect, GuiLayerApsectApi, GuiLayerApsectOptions } from './layer';
import { CargoGuiURI, GuiLayer } from './typings';
import { GuiViewApi } from './view';

/** 全服通告层配置 */
export interface GuiTrumpetOptions extends GuiLayerApsectOptions {}

/** 全服通告层接口 */
export interface GuiTrumpetApi extends GuiLayerApsectApi {}

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
