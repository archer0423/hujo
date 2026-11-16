/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/** 校验数字是否为负数 */
export function IsNegative(d: number): boolean {
  return Number.isFinite(d) && d < 0;
}

/** 校验数字是否为非负数（包含 0） */
export function IsPositive(d: number): boolean {
  return Number.isFinite(d) && d >= 0;
}

/** 数字是否在指定范围内（包含边界）；min > max 时返回 false */
export function IsInRange(d: number, min: number, max: number) {
  return d >= min && d <= max;
}

/**
 * 获取数字的小数部分
 * 使用 floor 语义，结果范围为 [0, 1)；例如 DecimalOf(-1.25) === 0.75。
 */
export function DecimalOf(d: number): number {
  if (!Number.isFinite(d)) {
    return NaN;
  }
  return d - Math.floor(d);
}

/** 限制数字在指定范围内；min > max 时自动交换 */
export function Clamp(d: number, min: number, max: number): number {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.min(Math.max(d, min), max);
}

/** 限制数字在 0~1 范围内 */
export function Clamp01(d: number): number {
  return Clamp(d, 0, 1);
}

/**
 * 校验数字是否近似等于另一个数字
 * 使用绝对误差；tolerance 必须为非负有限数。
 */
export function ApproximatelyEqualTo(d: number, e: number, tolerance: number = 0.000001): boolean {
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    return false;
  }
  return d === e || Math.abs(d - e) <= tolerance;
}

/** 获取数字的符号（NaN 返回 0） */
export function SignOf(d: number): number {
  return d === 0 || Number.isNaN(d) ? 0 : d < 0 ? -1 : 1;
}

/**
 * 获得数组中的最大值
 * @param arr 数组
 * @returns 最大值（空数组返回 -Infinity）
 */
export function MaxOf(arr: number[]): number {
  return arr.reduce((a, b) => Math.max(a, b), -Infinity);
}

/**
 * 获得数组中的最小值
 * @param arr 数组
 * @returns 最小值（空数组返回 Infinity）
 */
export function MinOf(arr: number[]): number {
  return arr.reduce((a, b) => Math.min(a, b), Infinity);
}

/** 计算数字的和 */
export function SumOf(arr: number[]): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

/** 计算数字的平均值（空集合返回 0） */
export function AverageOf(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((acc, cur) => acc + cur, 0) / arr.length;
}

/** 计算数字的乘积 */
export function ProductOf(arr: number[]): number {
  return arr.reduce((acc, cur) => acc * cur, 1);
}

/**
 * 保留数字的指定小数位数
 * 使用远离 0 方向的半值舍入，并对二进制浮点误差做一次 ULP 修正；
 * 例如 ToPrecise(1.005, 2) === 1.01。
 * @param d 数字
 * @param precision 非负整数，表示小数位数
 * @returns 输入非法、精度非法或精度溢出时返回 NaN
 */
export function ToPrecise(d: number, precision: number): number {
  if (!Number.isFinite(d) || !Number.isInteger(precision) || precision < 0) {
    return NaN;
  }

  const e = Math.pow(10, precision);
  if (!Number.isFinite(e) || e === 0) {
    return NaN;
  }

  const scaled = d * e;
  if (!Number.isFinite(scaled)) {
    return NaN;
  }

  const abs = Math.abs(scaled);
  const adjusted = abs + Number.EPSILON * abs;
  if (!Number.isFinite(adjusted)) {
    return NaN;
  }

  const rounded = Math.round(adjusted);
  return (scaled < 0 ? -rounded : rounded) / e;
}

/** 计算两点之间的距离 */
export function DistanceOf(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 角度转换为弧度 */
export function Angle2Rad(angle: number): number {
  return (angle * Math.PI) / 180;
}

/** 弧度转换为角度 */
export function Rad2Angle(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 计算两点之间的角度，范围为 [-180, 180] */
export function AngleOf(x1: number, y1: number, x2: number, y2: number): number {
  return Rad2Angle(Math.atan2(y2 - y1, x2 - x1));
}

/** 校验圆参数是否有效 */
export function isValidCircle(x: number, y: number, r: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(r) && r >= 0;
}

/**
 * 校验两个圆是否相交（含内切与外切，不含内含）
 * 相同圆视为相交；半径必须为非负有限数，无效输入返回 false。
 */
export function IsCircleCrossed(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  if (!isValidCircle(x1, y1, r1) || !isValidCircle(x2, y2, r2)) {
    return false;
  }
  const d = DistanceOf(x1, y1, x2, y2);
  return d >= Math.abs(r1 - r2) && d <= r1 + r2;
}

/**
 * 校验圆1是否完全位于圆2内部（不含内切）
 * 半径必须为非负有限数；无效输入返回 false。
 */
export function IsCircleContained(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  if (!isValidCircle(x1, y1, r1) || !isValidCircle(x2, y2, r2)) {
    return false;
  }
  return DistanceOf(x1, y1, x2, y2) + r1 < r2;
}

/**
 * 计算二次贝塞尔曲线在指定参数值下的点
 * 参数顺序为：起点 P0 -> 控制点 C -> 终点 P1。
 * @param t 参数值，通常位于 [0, 1]
 */
export function QuadraticBezier(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
  const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
  return [x, y];
}

/**
 * 计算三次贝塞尔曲线在指定参数值下的点
 * 参数顺序为：起点 P0 -> 控制点 C1 -> 控制点 C2 -> 终点 P1。
 * @param t 参数值，通常位于 [0, 1]
 */
export function CubicBezier(
  x0: number,
  y0: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x1: number,
  y1: number,
  t: number,
): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x1;
  const y = mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y1;
  return [x, y];
}

/**
 * 范围生成器，半开区间 [start, end)
 * start < end 时升序；start > end 时降序；start === end 时为空。
 * 非有限数或非安全整数端点返回空序列。
 * 调用方应确保范围规模可控；本函数不对合法但巨大的区间设置额外上限。
 * @param start 开始位置
 * @param end 结束位置（不包含）
 */
export function* Range(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return;
  }

  start = Math.floor(start);
  end = Math.floor(end);

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
    return;
  }

  if (start < end) {
    for (let i = start; i < end; i++) yield i;
  } else {
    for (let i = start; i > end; i--) yield i;
  }
}
