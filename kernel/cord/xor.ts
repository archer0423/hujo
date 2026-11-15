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
 * 将字符串转换为 UTF-8 字节数组（代理对按标准 4 字节序列编码）
 */
function toUtf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    // 高位代理与后继低位代理拼接为完整码点
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const low = str.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

/**
 * 将十六进制字符串解析为字节数组（严格校验：偶数长度且仅含十六进制字符）
 */
function fromHexBytes(hex: string): number[] {
  // 非字符串输入（如 undefined）统一归入非法密文，避免裸 TypeError 误导排错
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
    throw new Error('XOR 解码失败：非法十六进制密文');
  }
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * 读取 UTF-8 续字节
 * @tip 越界（密文截断）或不在 0x80-0xBF 区间均视为损坏，返回掩码后的低 6 位
 * @throws 损坏时抛错，避免静默解出乱码
 */
function takeContinuation(bytes: number[], index: number): number {
  const b = bytes[index];
  if (b === undefined || b < 0x80 || b > 0xbf) {
    throw new Error('XOR 解码失败：非法 UTF-8 编码');
  }
  return b & 0x3f;
}

/**
 * 将 UTF-8 字节数组转换为字符串（4 字节序列还原为代理对）
 *
 * 严格校验：截断、非法续字节、超长编码（overlong）均抛错，避免损坏密文静默解出乱码；
 * 3 字节序列允许代理区码点，孤立代理按 WTF-8 语义往返
 */
function utf8BytesToString(bytes: number[]): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if (byte1 < 0xc0) {
      throw new Error('XOR 解码失败：非法 UTF-8 编码');
    } else if (byte1 < 0xe0) {
      const byte2 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x1f) << 6) | byte2;
      // 拒绝超长编码（如 0xC0 0x80 冒充 NUL）
      if (code < 0x80) {
        throw new Error('XOR 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(code);
    } else if (byte1 < 0xf0) {
      const byte2 = takeContinuation(bytes, ++i);
      const byte3 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3;
      if (code < 0x800) {
        throw new Error('XOR 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(code);
    } else {
      const byte2 = takeContinuation(bytes, ++i);
      const byte3 = takeContinuation(bytes, ++i);
      const byte4 = takeContinuation(bytes, ++i);
      const code = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
      // 4 字节序列必为增补平面码点，越界即损坏
      if (code < 0x10000 || code > 0x10ffff) {
        throw new Error('XOR 解码失败：非法 UTF-8 编码');
      }
      str += String.fromCharCode(
        0xd800 + ((code - 0x10000) >> 10),
        0xdc00 + ((code - 0x10000) & 0x3ff),
      );
    }
  }
  return str;
}

/**
 * XOR 编解码器
 *
 * 在 UTF-8 字节层面循环异或密钥，密文以十六进制表示。
 * 输出为纯 ASCII，可安全经过 JSON / UTF-8 / 网络传输等边界。
 *
 * @tip 仅用于混淆，非加密：XOR 抗已知明文能力弱，密钥复用下易被还原
 * @tip 密文长度为原文 UTF-8 字节数的 2 倍，大体积数据注意膨胀
 */
export class Xor {
  // public

  /**
   * 构造函数
   *
   * @param key - XOR 密钥（非空）
   */
  public constructor(key: string) {
    // 空密钥会使异或退化为恒等变换，静默失去混淆作用
    if (key.length < 6) {
      throw new Error('Xor 密钥不得少于6个字符');
    }
    this.__keyBytes = toUtf8Bytes(key);
  }

  /**
   * 编码
   * @param data 未编码的数据
   * @returns UTF-8 字节异或后的十六进制密文
   */
  public encode(data: string): string {
    const bytes = this.__xorBytes(toUtf8Bytes(data));
    // 每字节两位十六进制，保证输出为纯 ASCII
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 解码
   * @param data 十六进制密文
   * @returns 还原后的原文，密文非法或损坏时抛错
   */
  public decode(data: string): string {
    return utf8BytesToString(this.__xorBytes(fromHexBytes(data)));
  }

  // private

  /** 密钥的 UTF-8 字节 */
  private readonly __keyBytes: number[];

  /** 对字节数组循环异或密钥字节 */
  private __xorBytes(bytes: number[]): number[] {
    const key = this.__keyBytes;
    return bytes.map((b, i) => b ^ key[i % key.length]);
  }
}
