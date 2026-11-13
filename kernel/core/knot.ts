/** 结点选项 */
interface KnotOptions {
  /** 依赖项 */
  deps?: KnotCtor<Knot>[];
}

/** 结点构造 */
interface KnotCtor<K extends Knot> {
  new (): K;
}

/** 结点状态 */
enum KnotState {
  /** 初始 */
  Initial,
  /** 连接中 */
  Attaching,
  /** 已连接 */
  Attached,
  /** 断开中 */
  Detaching,
  /** 已断开 */
  Detached,
}

type KnotResult = Promise<[boolean, Error?]>;

/**
 * 结点
 */
abstract class Knot<P extends KnotOptions = {}> {
  // public

  /** 选项 */
  public options!: Readonly<P>;

  public constructor() {
    this.__state = KnotState.Initial;
  }

  /** 是否已连接 */
  public get attached() {
    return this.__state === KnotState.Attached;
  }

  /** 是否已断开 */
  public get detached() {
    return this.__state === KnotState.Detached;
  }

  /**
   * 注册
   * @param options 选项
   */
  public register(options: P): void {
    this.options = Object.freeze(options);
  }

  /** 连接 */
  public async attach(): KnotResult {
    if (this.__asyncAttach) {
      return this.__asyncAttach;
    }

    if (this.__state === KnotState.Initial) {
      this.__state = KnotState.Attaching;
      this.__asyncAttach = this._attach()
        .then(() => {
          this.__state = KnotState.Attached;
          return Promise.resolve([true]) as KnotResult;
        })
        .catch((err) => {
          this.__state = KnotState.Initial;
          return Promise.resolve([false, err]) as KnotResult;
        })
        .finally(() => {
          delete this.__asyncAttach;
        });
    }

    return this.__wrapResult('attach');
  }

  /** 断开 */
  public async detach(): KnotResult {
    if (this.__asyncDetatch) {
      return this.__asyncDetatch;
    }

    if (this.__state === KnotState.Attached) {
      this.__state = KnotState.Detaching;
      this.__asyncDetatch = this._detach()
        .then(() => {
          this.__state = KnotState.Detached;
          return Promise.resolve([true]) as KnotResult;
        })
        .catch((err) => {
          this.__state = KnotState.Attached;
          return Promise.resolve([false, err]) as KnotResult;
        })
        .finally(() => {
          delete this.__asyncDetatch;
        });
    }

    return this.__wrapResult('detach');
  }

  /** 标识 */
  public abstract get trait(): string;

  // protected

  /** 连接执行 */
  protected abstract _attach(): Promise<boolean>;
  /** 断开执行 */
  protected abstract _detach(): Promise<boolean>;

  // private
  /** 状态 */
  private __state: KnotState;
  /** 连接异步等待 */
  private __asyncAttach?: KnotResult;
  /** 断开异步等待 */
  private __asyncDetatch?: KnotResult;
  /**
   * 包装连接/断开状态异常
   * @param action 动作
   * @returns
   */
  private __wrapResult(action: 'attach' | 'detach'): KnotResult {
    return Promise.resolve([
      false,
      new Error(`Knot [${action}] 状态异常 >>> ${this.trait}|${this.__state}`),
    ]);
  }
}

export type { KnotOptions, KnotCtor, KnotState };
export { Knot };
