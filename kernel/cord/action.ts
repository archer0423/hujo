/** 动作结果 */
export type ActionResult = Promise<[boolean, Error?]>;

/** 动作状态 */
export enum ActionState {
  Idle,
  Playing,
  Success,
  Failure,
}

/**
 * 动作
 */
export class Action {
  // public

  public constructor(private readonly __input: () => Promise<boolean>) {
    this.__state = ActionState.Idle;
  }

  /** 播放 */
  public play(): ActionResult {
    if (this.__executor) {
      return this.__executor;
    }

    this.__state = ActionState.Playing;
    this.__executor = this.__input()
      .then(() => {
        this.__state = ActionState.Success;
        return (this.__result = Promise.resolve([true]));
      })
      .catch((e) => {
        this.__state = ActionState.Failure;
        return (this.__result = Promise.resolve([false, e]));
      });

    return this.__executor;
  }

  /** 异步等待 */
  public get promise() {
    return this.__executor;
  }

  /** 结果 */
  public get result() {
    return this.__result;
  }

  /** 当前状态 */
  public get state() {
    return this.__state;
  }

  /** 是否空闲状态 */
  public get idle() {
    return this.__state === ActionState.Idle;
  }

  /** 是否播放状态 */
  public get playing() {
    return this.__state === ActionState.Playing;
  }

  /** 是否成功状态 */
  public get success() {
    return this.__state === ActionState.Success;
  }

  /** 是否失败状态 */
  public get failure() {
    return this.__state === ActionState.Failure;
  }

  // private

  /** 状态 */
  private __state: ActionState;
  /** 播放异步等待 */
  private __executor?: ActionResult;
  /** 结果 */
  private __result?: ActionResult;
}
