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
import { GuiViewApi } from './view.typings';

/** 弹窗遮罩配置 */
export interface GuiMaskOptions extends KnotOptions {
  /** 颜色（包含透明度） */
  color?: string;
}

/** 弹窗遮罩接口 */
export interface GuiMaskApi extends KnotApi<GuiMaskOptions> {
  show(view: GuiViewApi): void;
  hide(): void;
}
