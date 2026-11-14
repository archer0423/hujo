/** Base64 字符表 */
const BASE64_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64 字符表索引映射 */
const BASE64_TABLE_INDEX: Record<string, number> = (() => {
  const table: Record<string, number> = {};
  for (let i = 0; i < 64; i++) {
    table[BASE64_TABLE.charAt(i)] = i;
  }
  return table;
})();

/**
 * 将字符串转换为 UTF-8 字节数组（代理对按标准 4 字节序列编码）
 */
function stringToUtf8ByteArray(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    // 高位代理与后继低位代理拼接为完整码点
    if (charCode >= 0xd800 && charCode <= 0xdbff && i + 1 < str.length) {
      const low = str.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        charCode = 0x10000 + ((charCode - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0x10000) {
      bytes.push(
        0xe0 | (charCode >> 12),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    }
  }
  return bytes;
}

/**
 * 读取 UTF-8 续字节
 * @tip 越界（数据截断）或不在 0x80-0xBF 区间均视为损坏，返回掩码后的低 6 位
 * @throws 损坏时抛错，避免静默解出乱码
 */
function takeContinuation(bytes: number[], index: number): number {
  const b = bytes[index];
  if (b === undefined || b < 0x80 || b > 0xbf) {
    throw new Error('Base64 解码失败：非法 UTF-8 编码');
  }
  return b & 0x3f;
}

/**
 * 将 UTF-8 字节数组转换为字符串（4 字节序列还原为代理对）
 *
 * 严格校验：截断、非法续字节、超长编码（overlong）均抛错，避免损坏数据静默解出乱码；
 * 3 字节序列允许代理区码点，孤立代理按 WTF-8 语义往返
 */
function utf8ByteArrayToString(bytes: number[]): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if (byte1 < 0xc0) {
      throw new Error('Base64 解码失败：非法 UTF-8 编码');
    } else if (byte1 < 0xe0) {
      const byte2 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x1f) << 6) | byte2;
      // 拒绝超长编码（如 0xC0 0x80 冒充 NUL）
      if (code < 0x80) {
        throw new Error('Base64 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(code);
    } else if (byte1 < 0xf0) {
      const byte2 = takeContinuation(bytes, ++i);
      const byte3 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3;
      if (code < 0x800) {
        throw new Error('Base64 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(code);
    } else if (byte1 < 0xf8) {
      const byte2 = takeContinuation(bytes, ++i);
      const byte3 = takeContinuation(bytes, ++i);
      const byte4 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
      // 4 字节序列必为增补平面码点，越界即损坏
      if (code < 0x10000 || code > 0x10ffff) {
        throw new Error('Base64 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(
        0xd800 + ((code - 0x10000) >> 10),
        0xdc00 + ((code - 0x10000) & 0x3ff),
      );
    } else {
      throw new Error('Base64 解码失败：非法 UTF-8 编码');
    }
  }
  return str;
}

/**
 * 将字符串编码为 Base64
 *
 * @param data - 原始字符串
 * @returns Base64 编码后的字符串
 * @throws 入参非字符串时抛出错误
 */
export function EncodeBase64(data: string): string {
  if (typeof data !== 'string') {
    throw new Error('Base64 编码失败：入参须为字符串');
  }
  const input = stringToUtf8ByteArray(data);
  const output: string[] = [];

  for (let i = 0; i < input.length; i += 3) {
    const byte1 = input[i];
    const byte2 = i + 1 < input.length ? input[i + 1] : 0;
    const byte3 = i + 2 < input.length ? input[i + 2] : 0;

    const triple = (byte1 << 16) | (byte2 << 8) | byte3;

    output.push(BASE64_TABLE.charAt(triple >> 18));
    output.push(BASE64_TABLE.charAt((triple >> 12) & 63));
    output.push(i + 1 < input.length ? BASE64_TABLE.charAt((triple >> 6) & 63) : '=');
    output.push(i + 2 < input.length ? BASE64_TABLE.charAt(triple & 63) : '=');
  }

  return output.join('');
}

/**
 * 将 Base64 字符串解码
 *
 * 宽容处理空白符（含换行，兼容 MIME 分行）；其余非法字符、非法长度、
 * 错位 padding、损坏 UTF-8 一律抛错，避免损坏数据静默解出乱码
 *
 * @param raw - Base64 编码的字符串
 * @returns 解码后的原始字符串
 * @throws 解码失败时抛出错误
 */
export function DecodeBase64(raw: string): string {
  if (typeof raw !== 'string') {
    throw new Error('Base64 解码失败：入参须为字符串');
  }
  // 仅剥离空白符（含换行，兼容 MIME 分行），其余非法字符直接报错
  const input = raw.replace(/\s+/g, '');
  if (/[^A-Za-z0-9+/=]/.test(input)) {
    throw new Error('Base64 解码失败：非法字符');
  }
  // padding 前正文长度为 4k+1 时尾组仅 6bit，无法构成任何字节
  const bodyEnd = input.indexOf('=');
  const body = bodyEnd === -1 ? input : input.slice(0, bodyEnd);
  if (body.length % 4 === 1) {
    throw new Error('Base64 解码失败：长度非法');
  }
  // padding 只能出现在末尾（AB=C / AA==BB 均为错位）
  if (bodyEnd !== -1 && input.slice(bodyEnd).replace(/=/g, '') !== '') {
    throw new Error('Base64 解码失败：padding 错位');
  }
  const output: number[] = [];

  for (let i = 0; i < input.length; i += 4) {
    const enc1 = BASE64_TABLE_INDEX[input.charAt(i)];
    const enc2 = BASE64_TABLE_INDEX[input.charAt(i + 1)];
    const enc3 = BASE64_TABLE_INDEX[input.charAt(i + 2)];
    const enc4 = BASE64_TABLE_INDEX[input.charAt(i + 3)];

    if (enc1 === undefined || enc2 === undefined) {
      throw new Error('Base64 解码失败：非法字符');
    }

    const triple = (enc1 << 18) | (enc2 << 12) | ((enc3 || 0) << 6) | (enc4 || 0);

    output.push((triple >> 16) & 0xff);
    if (enc3 !== undefined) {
      output.push((triple >> 8) & 0xff);
    }
    if (enc4 !== undefined) {
      output.push(triple & 0xff);
    }
  }

  return utf8ByteArrayToString(output);
}
