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
 * 格式化
 * 注意：占位符值为 null/undefined 时保留原文；不支持 {{key}} 转义
 * @param template 模板
 * @param args 参数列表
 * @returns 格式化后的字符串
 */
export function FmtString(template: string, ...args: any[]) {
  // 如果没有参数，则直接返回模板字符串
  if (args.length === 0) {
    return template;
  }
  // 如果只有一个参数且为对象，则使用命名参数格式化
  if (args.length === 1) {
    const params = args[0];
    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      return template.replace(/{([^{}]*)}/g, (match, key) => {
        // 仅读取自有键，防止 __proto__/constructor 等原型链键输出垃圾
        const value = Object.prototype.hasOwnProperty.call(params, key) ? params[key] : undefined;
        return value !== undefined && value !== null ? String(value) : match;
      });
    }
  }
  // 否则使用位置参数进行格式化
  return template.replace(/{(\d+)}/g, (match, index) => {
    const value = args[parseInt(index, 10)];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * 是否空字符串
 * @param str 输入字符串
 * @returns 是否空字符串
 */
export function IsEmptyString(str: string) {
  return typeof str !== 'string' || str === null || str.length === 0;
}

/**
 * 是否空白字符串
 * @param str 输入字符串
 * @returns 是否空白字符串
 */
export function IsBlankString(str: string) {
  return typeof str !== 'string' || str.trim().length === 0;
}

/**
 * 截断字符串（按 Unicode 码点截断，代理对不会截半；放不下省略号时直接截断）
 * @param str 输入字符串
 * @param maxLength 截断长度
 * @param ellipsis 省略号（默认"..."）
 * @returns 截断后的字符串
 */
export function TruncateString(str: string, maxLength: number, ellipsis: string = '...') {
  const chars = [...str];
  if (chars.length <= maxLength) {
    return chars.join('');
  }
  const ellipsisLength = [...ellipsis].length;
  if (maxLength <= ellipsisLength) {
    return chars.slice(0, maxLength).join('');
  }
  return chars.slice(0, maxLength - ellipsisLength).join('') + ellipsis;
}

/**
 * 首字母大写（按 Unicode 码点处理首字符，代理对安全）
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
export function Capitalize(str: string) {
  if (!str || str.length === 0) {
    return str;
  }
  const chars = [...str];
  return chars[0].toUpperCase() + chars.slice(1).join('');
}

/**
 * 首字母小写（按 Unicode 码点处理首字符，代理对安全）
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
export function Uncapitalize(str: string) {
  if (!str || str.length === 0) {
    return str;
  }
  const chars = [...str];
  return chars[0].toLowerCase() + chars.slice(1).join('');
}

/**
 * 字符串翻转
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
export function ReverseString(str: string) {
  return [...str].reverse().join('');
}

/**
 * 字符串前置填充（与 String.prototype.padStart 语义一致，结果恰好为目标长度）
 * @param str 输入字符串
 * @param targetLength 目标长度
 * @param padString 填充字符串
 * @returns 填充后的字符串
 */
export function PadStart(str: string, targetLength: number, padString: string) {
  if (!padString) return str;
  const strLen = GetCharCount(str);
  if (strLen >= targetLength) return str;
  const padLen = targetLength - strLen;
  const repeatTimes = Math.ceil(padLen / GetCharCount(padString));
  let pad = '';
  for (let i = 0; i < repeatTimes; i++) pad += padString;
  const padArray = [...pad];
  pad = padArray.slice(0, padLen).join('');
  return pad + str;
}

/**
 * 字符串后置填充（与 String.prototype.padEnd 语义一致，结果恰好为目标长度）
 * @param str 输入字符串
 * @param targetLength 目标长度
 * @param padString 填充字符串
 * @returns 填充后的字符串
 */
export function PadEnd(str: string, targetLength: number, padString: string) {
  if (!padString) return str;
  const strLen = GetCharCount(str);
  if (strLen >= targetLength) return str;
  const padLen = targetLength - strLen;
  const repeatTimes = Math.ceil(padLen / GetCharCount(padString));
  let pad = '';
  for (let i = 0; i < repeatTimes; i++) pad += padString;
  const padArray = [...pad];
  pad = padArray.slice(0, padLen).join('');
  return str + pad;
}

/**
 * 获取 Unicode 字符的数量（按码点计数，代理对算 1 个；组合字符按多个码点计）
 * @param str 输入字符串
 * @returns Unicode 字符的数量
 */
export function GetCharCount(str: string) {
  return Array.from(str).length;
}
