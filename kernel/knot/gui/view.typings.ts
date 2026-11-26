/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/
import { Node } from 'cc';

import { JournalLogger } from '../../core/journal';
import { CargoGuiURI, GuiLayer } from './gui.typings';

/** Gui 视图接口 */
export interface GuiViewApi {
  /** 视图资产标识 */
  readonly uri: CargoGuiURI;
  /** 视图根节点 */
  readonly root: Node;
  /** 视图所属层级 */
  readonly layer: GuiLayer;
  /** 视图编号（添加到层时由层分配） */
  readonly id: number;
  /** 视图别名 */
  readonly alias: string;
  /** 专属日志记录器 */
  readonly logger: JournalLogger;
  /** 构建视图结构 */
  build(): void;
  /** 打开视图 */
  open(args?: Record<string, unknown>): Promise<void>;
  /** 尝试关闭视图（自身） */
  close(): Promise<boolean>;
  /** 视图聚焦 */
  focus(): void;
  /** 视图失焦 */
  blur(): void;
  /** 视图进入开始回调 */
  onEnterBegan(): Promise<void>;
  /** 视图进入结束回调 */
  onEnterEnded(): Promise<void>;
  /** 视图退出开始回调 */
  onExitBegan(): Promise<void>;
  /** 视图退出结束回调 */
  onExitEnded(): Promise<void>;
  /** 点击到视图外部回调 */
  onHitOutside(): void;
}
