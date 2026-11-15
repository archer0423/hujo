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
 * 伪随机数生成器
 */
export class PRNG {
  // public static

  /** 随机数哈希字符集 */
  public static readonly HASH_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /**
   * 将字符串转换为数字的哈希值
   * @param str - 要转换的字符串
   * @returns 字符串的哈希值（正整数）
   */
  public static Hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) >>> 0;
    }
    return hash;
  }

  /**
   * 生成随机种子（6 位大写字母和数字组合）
   * @returns 6位随机种子字符串
   */
  public static NewSeed() {
    const characters = PRNG.HASH_CHARACTERS;
    const total = characters.length;
    const { floor, random } = Math;
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(floor(random() * total));
    }
    return result;
  }

  // public

  public constructor() {
    this._seed = PRNG.NewSeed();
    this._hash = PRNG.Hash(this._seed);
  }

  /** 获取随机数种子 */
  public get seed() {
    return this._seed;
  }
  /**
   * 设置随机数种子（重设同一种子也会从头重放序列）
   * 注意：种子空间远大于内部状态数，不同种子可能产生相同序列
   * @param newSeed - 要设置的种子字符串，空字符串视为未提供并重新随机生成
   */
  public set seed(seed: string) {
    if (seed.length < 6) {
      throw new Error(`随机种子不能少于6个字符`);
    }

    if (this._seed === seed) {
      return;
    }

    this._seed = seed;
    this._hash = PRNG.Hash(this._seed);
  }

  /**
   * 获取 [0,1) 随机数
   * 使用线性同余生成器算法
   * @returns 0到1之间的随机浮点数
   */
  public random() {
    this._hash = (this._hash * 9301 + 49297) % 233280;
    return this._hash / 233280;
  }

  // private

  /** 当前随机数种子 */
  private _seed: string;
  /** 当前随机数哈希值 */
  private _hash: number;
}
