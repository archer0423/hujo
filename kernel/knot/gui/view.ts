import { Node } from 'cc';

import { JournalLogger } from '../../core/journal';
import { CargoGuiURI, GuiLayer } from './typings';

/** Gui 视图接口 */
export interface GuiViewApi {
  /** 视图资产标识 */
  readonly uri: CargoGuiURI;
  /** 视图根节点 */
  readonly root: Node;
  /** 视图所属层级 */
  layer: GuiLayer;
  /** 编号（添加到层时由层分配） */
  id: number;
  /** 专属日志记录器 */
  get logger(): JournalLogger;
  /** 打开视图 */
  open(strategy: 'init' | 'focus', args: Record<string, unknown>): Promise<void>;
  /** 尝试关闭视图（自身） */
  close(): Promise<boolean>;
  /** 聚焦 */
  focus(): void;
  /** 失焦 */
  blur(): void;
  /** 进入开始回调 */
  onEnterBegan(): Promise<void>;
  /** 进入结束回调 */
  onEnterEnded(): Promise<void>;
  /** 退出开始回调 */
  onExitBegan(): Promise<void>;
  /** 退出结束回调 */
  onExitEnded(): Promise<void>;
  /** 点击到外部回调 */
  onHitOutside(): void;
}
