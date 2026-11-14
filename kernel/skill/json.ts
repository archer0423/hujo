/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { journal } from '../entry';

/**
 * 将数据编码为 JSON 字符串
 *
 * @param input - 要编码的数据
 * @returns JSON 字符串，编码失败返回 null（循环引用 / BigInt / 顶层 undefined / 函数 / Symbol 等）
 * @tip Infinity / NaN 会被编码为 null（JSON 标准行为），不视为编码失败
 * @tip 嵌套属性中的 undefined / 函数 / Symbol 按 JSON.stringify 规范处理：对象属性会被省略，数组元素会变为 null
 * @tip toJSON 抛错、循环引用、BigInt 等原生序列化异常会被捕获并返回 null
 */
export function EncodeJson<T>(input: T): string | null {
  try {
    const result = JSON.stringify(input);
    // stringify 对顶层 undefined / 函数 / Symbol 不抛错而是返回 undefined，须并入失败兜底
    if (result === undefined) {
      throw new Error('[JSON] 不可序列化的值（undefined / 函数 / Symbol）');
    }
    return result;
  } catch (err) {
    journal.system.error('[JSON] 编码失败', err);
    return null;
  }
}

/**
 * 将 JSON 字符串解码为数据
 *
 * @param input - JSON 字符串
 * @returns 解码后的数据，解码失败返回 null
 * @tip 合法的 'null' 输入同样返回 null，与失败不可区分；需区分时请在数据外层包裹对象再编解码
 * @tip 本函数仅做 JSON.parse 与基础输入类型防御，不进行运行时 schema/结构校验；泛型 T 仅为编译期断言，不可信输入请在上层做校验
 */
export function DecodeJson<T>(input: string): T | null {
  if (typeof input !== 'string') {
    journal.system.error('[JSON] 输入必须为字符串', input);
    return null;
  }
  try {
    return JSON.parse(input) as T;
  } catch (err) {
    journal.system.error('[JSON] 解码失败', err);
    return null;
  }
}
