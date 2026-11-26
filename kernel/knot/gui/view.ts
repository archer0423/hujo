import { js, Component, Constructor, Node } from 'cc';

import { ioc } from '../../core/ioc';
import { journal, JournalLogger } from '../../core/journal';
import { Gui } from './gui';
import { CargoGuiURI, GuiLayer, GuiSchema, GuiStructSchema } from './gui.typings';
import { GuiViewApi } from './view.typings';

/** Presenter (MVP:P) */
export abstract class GuiPresenter<V extends GuiViewApi> {
  // public

  /**
   * 构造
   * @param view 视图
   */
  public constructor(public readonly view: V) {}

  /** 日志记录器 */
  public get logger(): JournalLogger {
    return journal.acquire('gui');
  }

  /** 初始化 */
  public abstract init(): void;

  /** 反初始化 */
  public abstract deinit(): void;

  /** 视图聚焦 */
  public focus() {}

  /** 视图失焦 */
  public blur() {}

  // protected
}

/**
 * View (MVP:V)
 */
export abstract class GuiView<S extends GuiSchema = {}> implements GuiViewApi {
  // public
  declare public readonly uri: CargoGuiURI;
  declare public readonly root: Node;
  declare public readonly layer: GuiLayer;
  declare public readonly id: number;
  declare public readonly alias: string;

  public constructor(
    node: Node,
    struct: GuiStructSchema,
    presenter: Constructor<GuiPresenter<GuiView>>,
  ) {
    this.root = node;
    this.__struct = struct;
    this._presenter = new presenter(this) as GuiPresenter<this>;
  }

  public get logger(): JournalLogger {
    return journal.acquire('gui');
  }

  public build(): void {
    this._schema ??= this.__buildStruct(this.__struct);
    this._init();
  }

  protected _init(): void {
    this._presenter.init();
  }

  protected _deinit(): void {
    this._presenter.deinit();
  }

  public async open(args?: Record<string, unknown>): Promise<void> {
    this._args = args;
  }

  public async close(): Promise<boolean> {
    const promise = ioc.resolve(Gui).close(this);
    promise.then(() => this._deinit());
    return promise;
  }

  public focus(): void {
    this._presenter.focus();
  }

  public blur(): void {
    this._presenter.blur();
  }

  public async onEnterBegan(): Promise<void> {}

  public async onEnterEnded(): Promise<void> {}

  public async onExitBegan(): Promise<void> {}

  public async onExitEnded(): Promise<void> {}

  public onHitOutside(): void {}

  // protected

  /** 视图结构 */
  protected _schema!: S;
  /** 视图呈现器 */
  protected _presenter!: GuiPresenter<this>;
  /** 入参 */
  protected _args: Record<string, unknown> | undefined;

  // private

  /** 视图结构 */
  declare private readonly __struct: GuiStructSchema;

  /** 构建视图结构 */
  private __buildStruct(struct: GuiStructSchema): S {
    const schema: GuiSchema = {};
    for (const alias in struct) {
      const [path, ctor] = struct[alias];
      const name = js.getClassName(ctor);
      const node = path === '' || path === '.' ? this.root : this.root.getChildByPath(path);
      if (!node) {
        schema[alias] = undefined;
        this.logger.warn(`节点不存在 >>> ${alias} | ${this.uri}/${path}`);
        continue;
      }
      if (name === 'cc.Node') {
        schema[alias] = node!;
      } else {
        const comp = node.getComponent(ctor as Constructor<Component>);
        if (!comp) {
          schema[alias] = undefined;
          this.logger.warn(`组件不存在 >>> ${alias} | ${this.uri}/${path}@${name}`);
          continue;
        }
        schema[alias] = comp;
      }
    }
    return schema as S;
  }
}
