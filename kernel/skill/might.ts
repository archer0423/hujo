/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/** 异步操作函数类型 */
export interface AsyncOperation<P extends unknown[] = [], R = void> {
  (...args: P): Promise<R>;
}

/** 同步操作函数类型 */
export interface SyncOperation<P extends unknown[] = [], R = void> {
  (...args: P): R;
}

/** 将任意抛出值归一化为 Error（跨 realm 的 Error 与 DOMException 不满足 instanceof，会被包装为普通 Error） */
function normalizeError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * 安全的同步调用
 * @param task 方法
 * @param ambient 环境（this 绑定，仅 null/undefined 时回退为空对象）
 * @param args 入参
 * @returns [结果, undefined] 或 [undefined, Error]
 */
export function RunSync<P extends unknown[], T = unknown>(
  task: SyncOperation<P, T>,
  ambient?: unknown,
  ...args: P
): [T?, Error?] {
  try {
    const result = task.apply(ambient ?? Object.create(null), args);
    return [result, undefined];
  } catch (err) {
    return [undefined, normalizeError(err)];
  }
}

/**
 * 安全的异步调用
 * 注意：跨 realm 的 Error 与 DOMException 会被包装为普通 Error
 * @param task Promise 或返回 Promise 的方法
 * @returns [结果, undefined] 或 [undefined, Error]
 */
export async function RunAsync<T = unknown>(
  task: Promise<T> | AsyncOperation<[], T>,
): Promise<[T?, Error?]> {
  try {
    const data = await (typeof task === 'function' ? task() : task);
    return [data, undefined];
  } catch (err) {
    return [undefined, normalizeError(err)];
  }
}
