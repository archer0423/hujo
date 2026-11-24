import { js, Component, Constructor, Node } from 'cc';

import { ioc } from '../../core/ioc';
import { journal, JournalLogger } from '../../core/journal';
import { Gui } from './gui';
import { CargoGuiURI, GuiLayer, GuiSchema, GuiStructSchema } from './typings';

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

/** Presenter (MVP:P) */
export abstract class GuiPresenter<V extends GuiView> {
  // public

  public bindView(view: V) {
    this._view = view;
  }

  public get logger(): JournalLogger {
    return journal.acquire('gui');
  }

  public abstract init(): void;

  public abstract deinit(): void;

  public focus() {}

  public blur() {}

  // protected

  protected _view!: V;
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
  declare private readonly __struct: GuiStructSchema;

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
