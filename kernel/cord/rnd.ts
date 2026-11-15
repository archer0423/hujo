/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Dict } from '../skill/dict';

/**
 * 随机数生产车间
 */
export class RNG {
  // public static

  /** 默认的随机数生产车间 */
  public static readonly M = new RNG();

  // public

  /**
   * 构造
   * @param generator 随机数生成器
   */
  public constructor(generator?: typeof Math.random) {
    this.__generator = generator ?? Math.random;
  }

  /** 获取 [0,1) 随机数 */
  public random(): number {
    return this.__generator();
  }

  /**
   * 随机布尔值
   * @returns 随机 true 或 false
   */
  public randomBool(): boolean {
    return this.random() >= 0.5;
  }

  /**
   * 随机整数 0 或 1
   * @returns 0 或 1 的随机整数
   */
  public random01(): number {
    return this.randomBool() ? 1 : 0;
  }

  /**
   * 随机指定范围内的数
   * @param min - 最小值（有限数，内部按 Math.trunc 截断；超出安全整数范围可能导致精度丢失）
   * @param max - 最大值（有限数，内部按 Math.trunc 截断；超出安全整数范围可能导致精度丢失）
   * @returns min 到 max 之间的随机浮点数
   */
  public randomFromTo(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return min + this.random() * (max - min);
  }

  /**
   * 随机整数
   * 根据 Region 枚举值决定区间开闭情况
   * @param min - 最小值（有限数，内部按 Math.trunc 截断；超出安全整数范围可能导致精度丢失）
   * @param max - 最大值（有限数，内部按 Math.trunc 截断；超出安全整数范围可能导致精度丢失）
   * @param [range='10'] - 区间类型，默认为左闭右开
   * @returns 指定范围内的随机整数
   */
  public randomInteger(min: number, max: number, range: '00' | '01' | '10' | '11' = '10'): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError('RandomInteger requires finite min and max');
    }
    min = Math.trunc(min);
    max = Math.trunc(max);

    if (min === max) return min;
    if (min > max) [min, max] = [max, min];
    switch (range) {
      case '10': // [min, max)
        return min + Math.floor(this.random() * (max - min));
      case '01': // (min, max]
        return min + 1 + Math.floor(this.random() * (max - min));
      case '11': // [min, max]
        return min + Math.floor(this.random() * (max - min + 1));
      case '00': // (min, max)
        if (max - min < 2) throw new RangeError('左右全开区间要求 max - min >= 2');
        return min + 1 + Math.floor(this.random() * (max - min - 1));
    }
  }

  /**
   * 随机 UUID
   * 注意：随机性来自内部伪随机数（Math.random），非加密安全，
   * 仅适合需要唯一标识的非安全场景。
   * @returns UUID
   */
  public randomUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * 随机颜色通道值
   * @returns 0~255 的整数
   */
  public randomChannel(): number {
    return Math.floor(this.random() * 256);
  }

  /**
   * 随机颜色值（大写十六进制）
   * @param channels 通道数，3 为 RGB，4 为 ARGB
   * @returns 3 通道为 #RRGGBB，4 通道为 #AARRGGBB
   */
  public randomColor(channels: 3 | 4 = 3): string {
    const r = this.randomChannel();
    const g = this.randomChannel();
    const b = this.randomChannel();
    if (channels === 4) {
      const a = this.randomChannel();
      const c = ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
      return `#${c.toString(16).padStart(8, '0').toUpperCase()}`;
    } else {
      const c = (r << 16) | (g << 8) | b;
      return `#${c.toString(16).padStart(6, '0').toUpperCase()}`;
    }
  }

  /**
   * 随机圆内的点（按面积均匀分布）
   * @param x - 圆心 x 坐标
   * @param y - 圆心 y 坐标
   * @param r - 圆半径
   * @returns 圆内随机点的坐标
   */
  public randomInCircle(x: number, y: number, r: number): { x: number; y: number } {
    const rad = this.randomFromTo(0, Math.PI * 2);
    // 半径按 sqrt 采样以保证面积均匀（线性采样会向圆心聚集）
    const r2 = r * Math.sqrt(this.random());
    x += r2 * Math.cos(rad);
    y += r2 * Math.sin(rad);
    return { x, y };
  }

  /**
   * 随机圆上的点
   * @param x - 圆心 x 坐标
   * @param y - 圆心 y 坐标
   * @param r - 圆半径
   * @returns 圆上随机点的坐标
   */
  public randomOnCircle(x: number, y: number, r: number): { x: number; y: number } {
    const rad = this.randomFromTo(0, 2 * Math.PI);
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  }

  /**
   * 随机圆弧内的点（按面积均匀分布）
   * 在指定弧度范围内随机生成点
   * @param x - 圆心 x 坐标
   * @param y - 圆心 y 坐标
   * @param startRad - 起始弧度
   * @param endRad - 结束弧度
   * @param r - 半径
   * @returns 圆弧内随机点的坐标
   */
  public randomInRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number,
  ): { x: number; y: number } {
    const rad = this.randomFromTo(startRad, endRad);
    // 半径按 sqrt 采样以保证面积均匀（线性采样会向圆心聚集）
    const r2 = r * Math.sqrt(this.random());
    x += Math.cos(rad) * r2;
    y += Math.sin(rad) * r2;
    return { x, y };
  }

  /**
   * 随机圆弧上的点
   * @param x - 圆心 x 坐坐标
   * @param y - 圆心 y 坐标
   * @param startRad - 起始弧度
   * @param endRad - 结束弧度
   * @param r - 半径
   * @returns 圆弧上随机点的坐标
   */
  public randomOnRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number,
  ): { x: number; y: number } {
    const rad = this.randomFromTo(startRad, endRad);
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  }

  /**
   * 随机矩形内的点
   * @param x - 矩形左上角 x 坐标
   * @param y - 矩形左上角 y 坐标
   * @param w - 矩形宽度
   * @param h - 矩形高度
   * @returns 矩形内随机点的坐标
   */
  public randomInRect(x: number, y: number, w: number, h: number): { x: number; y: number } {
    x += this.randomFromTo(0, w);
    y += this.randomFromTo(0, h);
    return { x, y };
  }

  /**
   * 随机矩形边上的点
   * 随机选择四条边中的一条（等概率，非按周长加权），然后在边上随机位置生成点
   * @param x - 矩形左上角 x 坐标
   * @param y - 矩形左上角 y 坐标
   * @param w - 矩形宽度
   * @param h - 矩形高度
   * @returns 矩形边上随机点的坐标
   */
  public randomOnRect(x: number, y: number, w: number, h: number): { x: number; y: number } {
    const edge = this.randomInteger(0, 4);
    switch (edge) {
      case 0:
        // 左边
        y += this.randomFromTo(0, h);
        break;
      case 1:
        // 上边
        x += this.randomFromTo(0, w);
        y += h;
        break;
      case 2:
        // 右边
        x += w;
        y += this.randomFromTo(0, h);
        break;
      case 3:
        // 下边
        x += this.randomFromTo(0, w);
        break;
    }
    return { x, y };
  }

  /**
   * 随机圆环内的点（按面积均匀分布）
   * 在内外半径之间的环形区域内随机生成点
   * @param x - 圆心 x 坐标
   * @param y - 圆心 y 坐坐标
   * @param r1 - 内半径
   * @param r2 - 外半径
   * @returns 圆环内随机点的坐标
   */
  public randomInRing(x: number, y: number, r1: number, r2: number): { x: number; y: number } {
    const rad = this.randomFromTo(0, 2 * Math.PI);
    // 半径在 r1²~r2² 上均匀采样后再开方，保证环内面积均匀
    const r = Math.sqrt(this.randomFromTo(r1 * r1, r2 * r2));
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  }

  /**
   * 随机权重
   * 注意：默认权重函数对非对象元素或字段缺失/非法时按 0 计；负权重按 0 计入；
   * 无任何有效权重时退化为等概率随机
   * @param arr 目标数组
   * @param weighted 权重计算函数
   * @param key 键
   * @returns 空数组时返回 undefined
   */
  public randomWeight<T>(
    arr: T[],
    weighted?: (t: T) => number,
    key: string = 'weight',
  ): T | undefined {
    if (arr.length === 0) {
      return undefined;
    }
    // 默认权重函数...
    weighted ??= (t: T) =>
      typeof t === 'object' && t !== null ? Number((t as Dict)[key]) || 0 : 0;
    const weights = arr.map((t) => Math.max(weighted(t), 0));
    let total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) {
      return arr[this.randomInteger(0, arr.length)];
    }
    const rate = this.random() * total;
    for (let i = 0; i < arr.length; i++) {
      total -= weights[i];
      if (total <= rate) {
        return arr[i];
      }
    }
    return arr[arr.length - 1];
  }

  /**
   * 随机打乱列表元素顺序
   * @param arr 要打乱的列表
   * @returns 打乱后的列表
   */
  public shuffleArray(arr: unknown[]): unknown[] {
    let pid = -1;
    const length = arr.length;
    while (++pid < length) {
      const nid = this.randomInteger(pid, length);
      [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
    }
    return arr;
  }

  /**
   * 从数组中随机抽取 n 个元素，不复制原数组、不修改原数组。
   *
   * - n <= 0：返回空数组
   * - n >= arr.length：返回全部元素的乱序排列
   * - 否则：基于 Fisher-Yates 部分洗牌，仅交换前 count 次
   *
   * @param arr 目标数组
   * @param n 数量
   * @returns 被选中元素数组
   */
  public randomFromArray<T>(arr: T[], n: number = 1): T[] {
    const len = arr.length;
    if (n <= 0 || len === 0 || !Number.isFinite(n)) return [];
    const count = Math.min(Math.trunc(n), len);
    if (count <= 0) return [];

    const indices = new Array<number>(len);
    for (let i = 0; i < len; i++) indices[i] = i;
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(this.random() * (len - i));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, count).map((i) => arr[i]);
  }

  // private

  /** 随机数生成器 */
  private __generator: typeof Math.random;
}
