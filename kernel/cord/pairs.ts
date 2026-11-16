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
 * 轻量级键值对映射容器
 *
 * 适用于处理极小规模的数据
 */
export class Pairs<V extends number | boolean | string> {
  // public

  /**
   * 键值对构造
   * @param pair 原始键值对（非法值将被忽略）
   */
  public constructor(pair?: Record<string, V>) {
    this.__pairs = Object.create(null);
    this.__size = 0;
    if (pair) {
      Object.keys(pair).forEach((k) => this.set(k, pair[k]));
    }
  }

  /**
   * 查询键值对
   * @param k 键
   * @returns 是否存在键值对
   */
  public has(k: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.__pairs, k);
  }

  /**
   * 获取键值对的值
   * @param k 键
   * @returns 键值对的值
   */
  public get(k: string): V | undefined {
    return this.__pairs[k] as V | undefined;
  }

  /**
   * 设置键值对（非法值将被忽略）
   * @param k 键
   * @param v 值
   * @returns 是否设置成功
   */
  public set(k: string, v: V): boolean {
    if (this.__isIllegal(v)) {
      return false;
    }

    const existed = this.has(k);
    if (!existed) {
      this.__size++;
    }
    this.__pairs[k] = v;
    return true;
  }

  /**
   * 更新键值对
   * @param k 键
   * @param v 值
   * @returns 是否更新成功（键存在且值发生变化）
   */
  public update(k: string, v: V): boolean {
    if (this.__isIllegal(v)) {
      return false;
    }

    if (!this.has(k)) {
      return false;
    }

    if (this.get(k) === v) {
      return false;
    }

    this.__pairs[k] = v;
    return true;
  }

  /**
   * 移除键值对
   * @param k 键
   * @returns 操作成功与否
   */
  public delete(k: string): boolean {
    if (Object.prototype.hasOwnProperty.call(this.__pairs, k)) {
      delete this.__pairs[k];
      this.__size--;
      return true;
    }
    return false;
  }

  /**
   * 清空键值对
   */
  public clear(): void {
    const d = this.__pairs;
    for (const key in d) {
      if (Object.prototype.hasOwnProperty.call(d, key)) {
        delete d[key];
      }
    }
    this.__size = 0;
  }

  /**
   * 键值对个数
   */
  public get size(): number {
    return this.__size;
  }

  /**
   * 遍历键值对
   * @param visit 访问方法
   */
  public each(visit: (v: V, k: string) => void): void {
    Object.keys(this.__pairs).forEach((k) => {
      // 快照可能包含遍历中被回调移除的键，跳过以保证 visit 收到的值存在
      if (this.has(k)) {
        visit(this.__pairs[k], k);
      }
    });
  }

  /**
   * 获取所有键的数组
   */
  public keys(): string[] {
    return Object.keys(this.__pairs);
  }

  /**
   * 键的迭代器，使其支持 for...of 循环，产出 [key, value] 元组
   */
  public *[Symbol.iterator](): Iterator<[string, V]> {
    for (const k of this.keys()) {
      if (this.has(k)) {
        yield [k, this.__pairs[k]];
      }
    }
  }

  /**
   * 获取所有值的数组
   */
  public values(): V[] {
    return Object.keys(this.__pairs).map((k) => this.__pairs[k]);
  }

  /**
   * 获取所有键值对的数组
   */
  public entries(): [string, V][] {
    return Object.keys(this.__pairs).map((k) => [k, this.__pairs[k]]);
  }

  // private

  /** 键值对容器 */
  private readonly __pairs: Record<string, V>;

  /** 数据量 */
  private __size: number;

  /**
   * 是否不合法的值
   * 1. 如果值为空，应该使用 Remove 删除键值对
   * 2. 不允许 NaN 和无限数值存在
   * @param v 值
   * @returns 值是否不合法
   */
  private __isIllegal(v: V): boolean {
    return v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v));
  }
}
