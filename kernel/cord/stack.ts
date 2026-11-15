/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/**
 * 泛型栈
 *
 * 采用数组作为底层存储；Push/Pop/Peek/Size/IsEmpty 为 O(1)，
 * ToArray/迭代为 O(n)。
 */
export class Stack<T> implements Iterable<T> {
  // public

  /** 栈的当前大小 */
  public get size(): number {
    return this.__items.length;
  }

  /** 是否为空 */
  public get isEmpty(): boolean {
    return this.__items.length === 0;
  }

  /** 读取栈顶元素但不移除 */
  public peek(): T | undefined {
    return this.__items[this.__items.length - 1];
  }

  /** 入栈 */
  public push(item: T): this {
    this.__items.push(item);
    return this;
  }

  /** 出栈，返回栈顶元素 */
  public pop(): T | undefined {
    return this.__items.pop();
  }

  /** 清空栈 */
  public clear(): void {
    this.__items.length = 0;
  }

  /**
   * 以数组形式返回所有元素（从栈顶到栈底的拷贝，修改返回值不会影响栈）
   */
  public toArray(): T[] {
    return [...this.__items].reverse();
  }

  /**
   * 是否包含指定元素（使用严格相等 ===）
   * 从栈顶向栈底查找
   */
  public has(item: T): boolean {
    return this.__items.some((v) => v === item);
  }

  /**
   * 查找第一个满足条件的元素（从栈顶向栈底）
   * @param predicate 判断函数
   * @returns 命中的元素或 undefined
   */
  public find(predicate: (item: T) => boolean): T | undefined {
    // 从栈顶（数组末尾）向下查找
    for (let i = this.__items.length - 1; i >= 0; i--) {
      const v = this.__items[i];
      if (predicate(v)) return v;
    }
    return undefined;
  }

  /**
   * 遍历栈元素（从栈顶 to 底），与 forEach 语义一致
   * 迭代开始时取快照，遍历期间修改栈不影响本次遍历
   */
  public each(visit: (item: T, index: number) => void): void {
    const snapshot = [...this.__items].reverse();
    snapshot.forEach((item, index) => visit(item, index));
  }

  /**
   * 迭代器，支持 for…of；从栈顶向下遍历。
   *
   * 并发修改安全性：迭代开始时对栈取快照（栈顶→底），遍历过程中
   * 对栈的 Push/Pop/Clear 不会影响本次迭代产出，也不会出现 undefined
   * 或越界下标，从而避免边遍历边修改导致的状态不一致。
   */
  public *[Symbol.iterator](): IterableIterator<T> {
    // 快照：避免遍历期间的压入/弹出/清空影响本次迭代
    const snapshot = [...this.__items].reverse();
    for (let i = 0; i < snapshot.length; i++) {
      yield snapshot[i];
    }
  }

  // private

  /** 内部数组 */
  private __items: T[] = [];
}
