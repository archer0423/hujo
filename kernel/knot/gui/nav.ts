/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Knot, KnotApi, KnotOptions } from '../../core/knot';
import { CargoGuiURI } from './typings';

export interface GuiNavigatorOptions extends KnotOptions {}

export interface GuiNavigatorApi extends KnotApi<GuiNavigatorOptions> {
  /**
   * 打开视图
   * @param uri 视图资产标识
   */
  open(uri: CargoGuiURI): Promise<void>;
  /** 返回 */
  back(): Promise<void>;
  /** 导航栈深度 */
  readonly depth: number;
  /** 关闭导航栈内的所有视图 */
  closeAll(): Promise<void>;
  /** 关闭导航栈内除第一个外的所有视图 */
  closeToRoot(): Promise<void>;
  /** 关闭指定深度以上的所有视图 */
  closeToDepth(depth: number): Promise<void>;
}

export class GuiNavigator extends Knot<GuiNavigatorOptions> implements GuiNavigatorApi {
  // public

  public constructor() {
    super();

    this.__stack = [];
  }

  public get trait(): string {
    return 'navigator';
  }

  public get depth() {
    return this.__stack.length;
  }

  open(uri: CargoGuiURI): Promise<void> {}

  back(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.__stack.length === 0) {
        return resolve();
      }
    });
  }

  closeAll(): Promise<void> {}

  closeToDepth(depth: number): Promise<void> {}

  closeToRoot(): Promise<void> {
    return this.closeToDepth(1);
  }

  // protected

  protected _attach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // private

  private __stack: CargoGuiURI[];
}
