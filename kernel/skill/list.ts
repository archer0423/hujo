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
 * 向列表中添加唯一元素
 * 注意：无 compare 时按严格相等判重，NaN 不与任何值相等、可重复添加
 * @param arr 列表
 * @param item 元素
 * @param compare 比较方法
 */
export function AddUnique<T>(arr: T[], item: T, compare?: (a: T, b: T) => boolean): void {
  if (compare) {
    if (arr.findIndex((v) => compare(v, item)) === -1) {
      arr.push(item);
    }
  } else {
    if (arr.indexOf(item) === -1) {
      arr.push(item);
    }
  }
}

/**
 * 前进/后退 n 步
 * @param arr 数组
 * @param [step=1] 步数
 */
export function Advance(arr: unknown[], step: number = 1): unknown[] {
  if (!Array.isArray(arr) || arr.length <= 1 || !Number.isFinite(step)) {
    return arr;
  }
  step = Math.trunc(step);
  step %= arr.length;
  if (step === 0) {
    return arr;
  }
  if (step > 0) {
    arr.unshift(...arr.splice(arr.length - step, step));
  } else {
    arr.push(...arr.splice(0, -step));
  }
  return arr;
}

/**
 * 管道
 * @param fns 函数列表
 * @returns
 */
export function Pipe<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I {
  return (i: I) => fns.reduce((v, f) => f(v), i);
}

/**
 * 反向管道
 * @param fns 函数列表
 * @returns
 */
export function Compose<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I {
  return (i: I) => fns.reduceRight((v, f) => f(v), i);
}

/**
 * 遍历
 * 注意：遍历中增删元素会导致跳过或重复访问，需要边遍历边删除请使用 RemoveIf
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒叙遍历
 */
export function Each<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => void,
  reverse: boolean = false,
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) visit(arr[i], i, arr);
  } else {
    for (let i = 0; i < len; i++) visit(arr[i], i, arr);
  }
}

/**
 * 遍历，符合条件时打断
 * 注意：遍历中增删元素会导致跳过或重复访问，需要边遍历边删除请使用 RemoveIf
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒序遍历
 */
export function EachUntil<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
  reverse: boolean = false,
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) if (visit(arr[i], i, arr) === true) break;
  } else {
    for (let i = 0; i < len; i++) if (visit(arr[i], i, arr) === true) break;
  }
}

/**
 * 数组扁平化
 * @param arrays 目标数组
 */
export function Flatten(arrays: unknown[]): unknown[] {
  return arrays.reduce<unknown[]>((a, v) => a.concat(Array.isArray(v) ? Flatten(v) : v), []);
}

/**
 * 频次统计
 * @param arr 目标数组
 * @returns 无原型的新字典
 */
export function FrequencyOf(arr: (number | string)[]): Record<string, number> {
  return arr.reduce((a, v) => {
    a[v] = (a[v] || 0) + 1;
    return a;
  }, Object.create(null));
}

/**
 * 保留最小的几个（从小到大排序）
 * @param arr 数组（需预先按升序排列）
 * @param count 保留数量
 * @param input 输入值
 */
export function KeepLeast(arr: number[], count: number, input: number): number[] {
  if (arr.length < count) {
    arr.push(input);
  } else {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] > input) {
        arr[i] = input;
        break;
      }
    }
  }
  return arr.sort((a, b) => a - b).slice(0, count);
}

/**
 * 合并数组
 * @param arrays 数组列表
 * @returns 合并后的数组
 */
export function Concat(...arrays: unknown[][]): unknown[] {
  return arrays.reduce((a, v) => a.concat(v), []);
}

/**
 * 提取元素索引
 * @param arr 数组
 * @param target 目标元素
 * @param match 比较方法
 * @param sequence 是否按顺序输出（默认逆序）
 * @returns
 */
export function PickIndices(
  arr: unknown[],
  target: unknown,
  match: (a: unknown, b: unknown) => boolean,
  sequence?: boolean,
): number[] {
  const ret: number[] = [];
  arr.forEach((v, i) => {
    if (match(target, v)) {
      if (sequence) {
        ret.push(i);
      } else {
        ret.unshift(i);
      }
    }
  });
  return ret;
}

/**
 * 提取元素
 * @param arr 数组
 * @param target 目标元素
 * @param match 比较方法
 * @param sequence 是否按顺序输出（默认逆序）
 * @returns
 */
export function PickValues(
  arr: unknown[],
  target: unknown,
  match: (a: unknown, b: unknown) => boolean,
  sequence?: boolean,
): unknown[] {
  const ret: unknown[] = [];
  arr.forEach((v) => {
    if (match(target, v)) {
      if (sequence) {
        ret.push(v);
      } else {
        ret.unshift(v);
      }
    }
  });
  return ret;
}

/**
 * 删除指定数量的元素
 * @param arr 数组
 * @param count 数量
 * @param before 删除回调
 */
export function RemoveBatch(
  arr: unknown[],
  count: number,
  before?: (item: unknown) => unknown,
): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (--count < 0) {
      break;
    }
    before?.(arr[i]);
    arr.splice(i, 1);
  }
}

/**
 * 删除列表中的重复元素
 * @param arr 列表
 * @returns 去重后的列表
 */
export function RemoveDuplicates(arr: unknown[]): unknown[] {
  const seen = new Set<unknown>();
  return arr.filter((v) => {
    if (Number.isNaN(v)) {
      // 与 AddUnique 的严格相等语义保持一致：NaN 不与任何值相等、每个 NaN 均保留
      return true;
    }
    if (seen.has(v)) {
      return false;
    }
    seen.add(v);
    return true;
  });
}

/**
 * 删除所有符合条件的元素
 * @param arr 列表
 * @param match 列表项处理方法
 * @param reverse 倒序遍历
 */
export function RemoveIf<ItemType>(
  arr: ItemType[],
  match: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
  reverse?: boolean,
): void {
  let l = arr.length;
  if (l == 0) return;
  reverse ??= false;
  if (reverse) {
    for (let i = l - 1; i >= 0; i--)
      if (match(arr[i], i, arr) === true) {
        arr.splice(i, 1);
      }
  } else {
    for (let i = 0; i < l; i++)
      if (match(arr[i], i, arr) === true) {
        arr.splice(i, 1);
        i--;
        l--;
      }
  }
}

/**
 * 删除指定索引范围内的所有元素
 * 注意：越界与重复索引会被忽略（负索引不表示从尾部数）
 * @param arr 数组
 * @param indices 索引数组
 */
export function RemoveIndices(arr: unknown[], indices: number[]): unknown[] {
  // 过滤越界与重复索引后按降序删除，避免删除位移影响后续索引
  SortIn(
    indices.filter((i, k, a) => i >= 0 && i < arr.length && a.indexOf(i) === k),
    false,
  ).forEach((i) => {
    arr.splice(i, 1);
  });
  return arr;
}

/**
 * 删除所有指定值的元素
 * @param arr 数组
 * @param val 目标值
 * @param reverse 是否逆向删除（默认正向）
 */
export function RemoveOne(arr: unknown[], val: unknown, reverse: boolean = false): void {
  const index = reverse ? arr.lastIndexOf(val) : arr.indexOf(val);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

/**
 * 数值数组排序
 * @param arr 数值数组
 * @param [ascending=true] 是否按顺序输出（默认正序：升序）
 * @returns 排序后的数组
 */
export function SortIn(arr: number[], ascending: boolean = true): number[] {
  return arr.sort((a, b) => (ascending ? a - b : b - a));
}

/**
 * 根据字段对数组排序
 * @param arr 数值数组
 * @param field 字段
 * @param [ascending=true] 是否按顺序输出（默认正序：升序）
 * @warn 必要条件：元素必须是字典，字段必须存在，字段类型为 number
 * @returns 排序后的数组
 */
export function SortBy(
  arr: Record<string, number>[],
  field: string,
  ascending: boolean = true,
): Record<string, number | unknown>[] {
  return arr.sort((a, b) => (ascending ? a[field] - b[field] : b[field] - a[field]));
}

/**
 * 将列表拆分成多个子列表，每个子列表的最大元素数量为 maxGroupSize
 * @param arr 列表
 * @param maxGroupSize 每个子列表的最大元素数量
 * @returns 拆分后的子列表数组
 */
export function Split<T>(arr: T[], maxGroupSize?: number): T[][] {
  const result: T[][] = [];
  if (!Array.isArray(arr) || arr.length === 0) {
    return result;
  }
  const size =
    Number.isFinite(maxGroupSize) && (maxGroupSize as number) > 0
      ? Math.floor(maxGroupSize as number)
      : arr.length;
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 交换数组中的两个元素（越界索引时忽略、不修改数组）
 * @param arr 数组
 * @param pid 索引 1
 * @param nid 索引 2
 */
export function Swap(arr: unknown[], pid: number, nid: number): unknown[] {
  if (pid < 0 || nid < 0 || pid >= arr.length || nid >= arr.length) {
    return arr;
  }
  [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
  return arr;
}

/**
 * 数组压缩（以第一个数组的长度为准，较短数组以 undefined 填充；无参时返回空数组）
 * @param arrays 数组列表
 * @returns 压缩后的数组
 */
export function Zip(...arrays: unknown[][]): unknown[] {
  const len = arrays[0]?.length ?? 0;
  return [...Array(len)].map((_: unknown, i: number) => {
    return arrays.map((array) => array[i]);
  });
}
