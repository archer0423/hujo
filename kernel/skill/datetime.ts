/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { sys } from 'cc';

/**
 * 可取消的防抖句柄
 */
export interface TimeDebounced {
  /** 触发防抖（参数透传给句柄） */
  (...args: unknown[]): void;
  /** 取消滞留的防抖调用（已排期的回调不再执行） */
  cancel(): void;
}

/** 节流句柄 */
export interface TimeThrottled {
  /** 触发节流（参数透传给句柄） */
  (...args: unknown[]): void;
}

/** 同步操作函数类型 */
export interface TimeConsuming<P extends unknown[] = [], R = void> {
  (...args: P): R;
}

/**
 * 常用数值
 */
export const TIME = {
  /** 以毫秒计 */
  MS: {
    /**  立刻 */
    ZERO: 0,
    /**  1 帧 */
    FRAME: 16,
    /**  1 秒钟 */
    SECOND: 1_000,
    /**  1 分钟 */
    MINUTE: 60_000,
    /**  1 小时 */
    HOUR: 3_600_000,
    /**  1 天 */
    DAY: 86_400_000,
    /**  1 周 */
    WEEK: 604_800_000,
    /** 1 月（按30天计算） */
    MONTH: 2_592_000_000,
  },
  /** 以秒计 */
  SEC: {
    /**  立刻 */
    ZERO: 0,
    /**  1 帧 */
    FRAME: 0.016,
    /**  1 秒钟 */
    SECOND: 1,
    /**  1 分钟 */
    MINUTE: 60,
    /**  1 小时 */
    HOUR: 3_600,
    /**  1 天 */
    DAY: 86_400,
    /**  1 周 */
    WEEK: 604_800,
    /** 1 月（按30天计算） */
    MONTH: 2_592_000,
  },
} as const;

/**
 * 获取当前时间（毫秒为单位）
 * @warn 基于客户端本地时钟，可被修改系统时间篡改；
 * 限时奖励/活动倒计时等防作弊计时请以服务器时间为准，本函数仅适用于 UI 展示与本地测量
 */
export function Now(): number {
  return sys.now();
}

/**
 * 模拟耗时操作（毫秒）
 * @warn 仅测试环境使用
 * @param ms 时间
 * @param max 钳制上限，防止永久阻塞主线程
 */
export function Lag(ms: number, max: number = 1_000): void {
  const end = Now() + Math.min(Math.max(ms, 0), max);
  while (Now() < end) {}
}

/**
 * 毫秒数转换为秒数
 * @param ms - 毫秒数
 * @returns 转换后的秒数
 */
export function Ms2Sec(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * 秒数转换为毫秒数
 * @param sec - 秒数
 * @returns 转换后的毫秒数
 */
export function Sec2Ms(sec: number): number {
  return Math.floor(sec * 1000);
}

/**
 * 秒数转换为时分秒格式（例如：100秒 => 00:01:40）
 * @param seconds - 秒数（非整数与超出 32 位范围的输入按 `seconds | 0` 截断为有符号 32 位整数）
 * @param depth - 降级深度（0:时分秒 1:分秒 2:秒）
 * @returns 时分秒格式字符串
 */
export function Sec2HMS(seconds: number, depth: 0 | 1 | 2 = 0): string {
  seconds = seconds | 0;
  const hour = (seconds / TIME.SEC.HOUR) | 0;
  // 分钟须先对小时取余，否则超过 1 小时后会溢出（如 3700s → 61 分）
  const min = ((seconds % TIME.SEC.HOUR) / TIME.SEC.MINUTE) | 0;
  const sec = seconds % TIME.SEC.MINUTE;
  let ret!: number[];
  switch (depth) {
    case 0:
      ret = [hour, min, sec];
      break;
    case 1:
      if (hour === 0) {
        ret = [min, sec];
      } else {
        ret = [hour, min, sec];
      }
      break;
    case 2:
      if (hour === 0) {
        if (min === 0) {
          ret = [sec];
        } else {
          ret = [min, sec];
        }
      } else {
        ret = [hour, min, sec];
      }
      break;
  }
  return ret.map((v) => v.toString().padStart(2, '0')).join(':');
}

/**
 * 获取当前日期对象
 * @returns 当前日期
 */
export function DateOf(): Date {
  return new Date();
}

/**
 * 获取年份
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年份
 */
export function YearOf(d?: Date): number {
  return (d ?? DateOf()).getFullYear();
}

/**
 * 获取月份（1-12）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 月份
 */
export function MonthOf(d?: Date): number {
  return (d ?? DateOf()).getMonth() + 1;
}

/**
 * 获取日期（月份中的第几天）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 日期
 */
export function DayOf(d?: Date): number {
  return (d ?? DateOf()).getDate();
}

/**
 * 获取小时（24小时制）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 小时
 */
export function HourOf(d?: Date): number {
  return (d ?? DateOf()).getHours();
}

/**
 * 获取分钟
 * @param d - 日期对象，不传则使用当前日期
 * @returns 分钟
 */
export function MinuteOf(d?: Date): number {
  return (d ?? DateOf()).getMinutes();
}

/**
 * 获取秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 秒数
 */
export function SecondOf(d?: Date): number {
  return (d ?? DateOf()).getSeconds();
}

/**
 * 获取毫秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 毫秒数
 */
export function MillisecondOf(d?: Date): number {
  return (d ?? DateOf()).getMilliseconds();
}

/**
 * 获取时间戳
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时间戳（毫秒）
 */
export function TimeOf(d?: Date): number {
  return (d ?? DateOf()).getTime();
}

/**
 * 计算两个日期之间的时间差（绝对值）
 * @param d1 - 第一个日期
 * @param d2 - 第二个日期，不传则使用当前日期
 * @returns 时间差（毫秒）
 */
export function DiffDate(d1: Date, d2?: Date): number {
  return Math.abs((d2 ?? DateOf()).getTime() - d1.getTime());
}

/**
 * 判断是否为闰年
 * @param y - 年份，不传则使用当前年份；非有限/非整数输入回退到当前年份
 * @returns 是否为闰年
 */
export function IsLeapYear(y?: number): boolean {
  if (!Number.isFinite(y)) y = YearOf();
  y = Math.trunc(y as number);
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * 解析日期对象为详细时间信息
 * @param d - 日期对象，不传则使用当前日期
 * @returns 包含年月日时分秒毫秒和时间戳的对象
 */
export function ParseDate(d?: Date): {
  yy: number;
  mm: number;
  dd: number;
  h: number;
  m: number;
  s: number;
  ms: number;
  ts: number;
} {
  d ??= DateOf();
  return {
    yy: YearOf(d),
    mm: MonthOf(d),
    dd: DayOf(d),
    h: HourOf(d),
    m: MinuteOf(d),
    s: SecondOf(d),
    ms: MillisecondOf(d),
    ts: TimeOf(d),
  };
}

/**
 * 格式化日期为年-月-日格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日格式字符串
 */
export function YmdOf(d?: Date): string {
  const s = ParseDate(d ?? DateOf());
  return `${s.yy}-${s.mm}-${s.dd}`;
}

/**
 * 格式化时间为时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒格式字符串
 */
export function HmsOf(d?: Date): string {
  const s = ParseDate(d ?? DateOf());
  return `${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间为时:分:秒.毫秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒.毫秒格式字符串
 */
export function HmsmOf(d?: Date): string {
  const s = ParseDate(d ?? DateOf());
  return `${s.h}:${s.m}:${s.s}.${s.ms}`;
}

/**
 * 格式化日期时间为年-月-日 时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日 时:分:秒格式字符串
 */
export function YmdhmsOf(d?: Date): string {
  const s = ParseDate(d ?? DateOf());
  return `${s.yy}-${s.mm}-${s.dd} ${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间差为可读文本
 * @param stamp - 目标时间戳
 * @param unit - 时间单位配置对象，可选（缺省使用 中文单位：天/时/分/秒）
 * @returns 包含天数、小时数、分钟数、秒数和格式化文本的对象
 */
export function FmtTime(
  stamp: number,
  unit: { day: string; hour: string; minute: string; second: string } = {
    day: '天',
    hour: '时',
    minute: '分',
    second: '秒',
  },
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
} {
  let days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    text = '';
  const nowValue = Now();
  const remaining = stamp - nowValue;
  if (remaining > 0) {
    days = Math.floor(remaining / TIME.MS.DAY);
    hours = Math.floor((remaining % TIME.MS.DAY) / TIME.MS.HOUR);
    minutes = Math.floor((remaining % TIME.MS.HOUR) / TIME.MS.MINUTE);
    seconds = Math.floor((remaining % TIME.MS.MINUTE) / TIME.MS.SECOND);
    if (days > 0) {
      text = `${days} ${unit.day} ${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (hours > 0) {
      text = `${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (minutes > 0) {
      text = `${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else {
      text = `${seconds}${unit.second}`;
    }
  }
  return { days, hours, minutes, seconds, text };
}

/**
 * 等待指定时间
 * @param handle 处理方法或返回值；可为同步/异步函数，或直接返回的值
 * @param ms 时间（毫秒）
 * @param args 透传给 handle 的参数（当 handle 为函数时）
 * @returns 处理结果
 */
export async function Wait<R = unknown>(
  handle: ((...args: unknown[]) => R | PromiseLike<R>) | R,
  ms: number,
  ...args: unknown[]
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result =
          typeof handle === 'function'
            ? await (handle as (...a: unknown[]) => R | PromiseLike<R>)(...args)
            : (handle as R);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }, ms);
  });
}

/**
 * 节流
 * @tip 记忆口诀：到点就干，不到不干
 * @tip 执行规则：固定时间内，最多执行一次
 * @tip 触发频率：高频率触发 → 均匀间隔执行
 * @tip 典型场景：滚动加载、鼠标移动、高频点击、视频播放时间更新
 * @param handle 句柄
 * @param context 上下文
 * @param delay 延迟时间默认 500 ms
 */
export function Throttle(
  handle: TimeConsuming<unknown[], unknown>,
  context = {},
  delay: number = 500,
): TimeThrottled {
  let lastTime = 0; // 记录上次执行时间
  return function (...args: unknown[]) {
    const time = Now();
    // 超过时间间隔才执行
    if (time - lastTime >= delay) {
      handle.apply(context, args);
      lastTime = time;
    }
  };
}

/**
 * 防抖
 * @tip 记忆口诀：等你停手，我再干活
 * @tip 执行规则：停止触发后，延迟执行
 * @tip 触发频率：高频率触发 → 最终只执行 1 次
 * @tip 典型场景：搜索框输入、窗口拉伸、按钮防重复点击
 * @param handle 句柄
 * @param context 上下文
 * @param delay 延迟时间默认 500 ms
 * @returns 带取消句柄的防抖函数，cancel() 可取消滞留的调用（如模块卸载时）
 */
export function Debounce(
  handle: TimeConsuming<unknown[], unknown>,
  context = {},
  delay: number = 500,
): TimeDebounced {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      handle.apply(context, args);
      timer = 0;
    }, delay) as ReturnType<typeof setTimeout>;
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = 0;
  };
  return debounced;
}
