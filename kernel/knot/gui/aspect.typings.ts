/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { KnotApi, KnotOptions } from '../../core/knot';
import { CargoGuiURI, GuiLayer } from './gui.typings';
import { GuiViewApi } from './view.typings';

/** 视图层切片配置 */
export interface GuiApsectOptions extends KnotOptions {}

/** 视图层切片接口 */
export interface GuiApsectApi extends KnotApi<GuiApsectOptions> {
  /** 指定资产标识的视图是否已打开 */
  isOpen(uri: CargoGuiURI): boolean;
  /**
   * 打开视图前置校验
   * @param uri 视图资产标识
   */
  preOpen(uri: CargoGuiURI): Promise<boolean>;
  /**
   * 打开视图
   * @param view 视图
   * @param struct 视图结构构造
   */
  didOpen(view: GuiViewApi): Promise<void>;
  /**
   * 关闭视图前置校验
   * @param view 视图
   */
  preClose(view: GuiViewApi): Promise<boolean>;
  /**
   * 关闭视图
   * @param view 视图
   */
  didClose(view: GuiViewApi): Promise<GuiViewApi>;
  /** 关闭所有视图 */
  closeAll(): Promise<void>;
  /** 视图堆栈 */
  get stack(): GuiViewApi[];
  /** 顶层视图 */
  get top(): GuiViewApi | undefined;
  /** 所属层级 */
  get layer(): GuiLayer;
  /** 视图堆栈深度 */
  get depth(): number;
}
