/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { FntCharDef, FntConfig } from '../typings';

/** 属性对正则：形如 `key=value` 或 `key="value"` */
const RE_ATTR = /([a-zA-Z_]\w*)\s*=\s*(?:"([^"]*)"|(\S*))/g;

/** 严格十进制：拒绝 Infinity / NaN / 0x / 0b 等 Number() 会宽松接受的值 */
const DECIMAL_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/** 读取行内全部属性对 */
function readAttrs(line: string): Record<string, string> {
  // 无原型对象：避免 __proto__ 等键改写属性表原型（当前值为字符串，属纵深防御）
  const attrs: Record<string, string> = Object.create(null);
  RE_ATTR.lastIndex = 0;
  let m = RE_ATTR.exec(line);
  while (m) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
    m = RE_ATTR.exec(line);
  }
  return attrs;
}

/** 数值属性读取（缺失、格式非法或非有限数时抛错） */
function readNum(attrs: Record<string, string>, key: string, where: string): number {
  const raw = attrs[key];
  const text = typeof raw === 'string' ? raw.trim() : '';
  // 空串会被 Number 归一为 0；Infinity / 0x10 / 超长数字串同样必须拒收
  if (text === '' || !DECIMAL_PATTERN.test(text)) {
    throw new Error(`位图字体格式非法，${where} 缺少或包含非法 ${key} 字段`);
  }
  const v = Number(text);
  if (!Number.isFinite(v)) {
    throw new Error(`位图字体格式非法，${where} 的 ${key} 超出数值范围`);
  }
  return v;
}

/** 字符码读取（BMFont 的 id/first/second 必须是合法 Unicode 码点） */
function readCharCode(attrs: Record<string, string>, key: string, where: string): number {
  const value = readNum(attrs, key, where);
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) {
    throw new Error(`位图字体格式非法，${where} 的 ${key} 不是合法字符码`);
  }
  return value;
}

/**
 * 解析 BMFont ASCII 文本
 * @param content .fnt 文件内容
 * @returns 与引擎导入器产物同构的字体配置
 * @throws 格式非法、XML 格式、多页字体时抛错
 */
export function ParseFnt(content: string): FntConfig {
  const text = (content ?? '').trim();
  if (!text) {
    throw new Error('位图字体内容为空');
  }
  // 仅支持 BMFont ASCII 格式（首行 info 声明），XML 格式显式拒绝
  if (text[0] === '<') {
    throw new Error('位图字体不支持 XML 格式，请导出为 ASCII 格式');
  }

  // 以 NaN 作未声明哨兵：size/lineHeight 允许负值，不可用 -1 判缺
  let fontSize = Number.NaN;
  let commonHeight = Number.NaN;
  let pages = 1;
  let atlasName = '';
  const fontDefs: Record<string, FntCharDef> = {};
  const kerningDict: Record<string, number> = {};

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    const keyword = line.split(/\s/, 1)[0];
    const attrs = readAttrs(line);
    switch (keyword) {
      case 'info': {
        fontSize = readNum(attrs, 'size', 'info');
        break;
      }
      case 'common': {
        commonHeight = readNum(attrs, 'lineHeight', 'common');
        pages = readNum(attrs, 'pages', 'common');
        if (!Number.isInteger(pages) || pages < 1) {
          throw new Error('位图字体格式非法，pages 必须为正整数');
        }
        if (pages > 1) {
          throw new Error(`位图字体不支持多页贴图 >>> pages=${pages}`);
        }
        break;
      }
      case 'page': {
        atlasName = attrs.file ?? '';
        if (!atlasName) {
          throw new Error('位图字体格式非法，page 缺少 file 字段');
        }
        break;
      }
      case 'char': {
        const id = String(readCharCode(attrs, 'id', 'char'));
        fontDefs[id] = {
          rect: {
            x: readNum(attrs, 'x', 'char'),
            y: readNum(attrs, 'y', 'char'),
            width: readNum(attrs, 'width', 'char'),
            height: readNum(attrs, 'height', 'char'),
          },
          xOffset: readNum(attrs, 'xoffset', 'char'),
          yOffset: readNum(attrs, 'yoffset', 'char'),
          xAdvance: readNum(attrs, 'xadvance', 'char'),
        };
        break;
      }
      case 'kerning': {
        const first = readCharCode(attrs, 'first', 'kerning');
        const second = readCharCode(attrs, 'second', 'kerning');
        kerningDict[(first << 16) | second] = readNum(attrs, 'amount', 'kerning');
        break;
      }
      default:
        break;
    }
  }
  if (Number.isNaN(fontSize) || Number.isNaN(commonHeight)) {
    throw new Error('位图字体格式非法，缺少 info 或 common 声明');
  }
  if (Object.keys(fontDefs).length === 0) {
    throw new Error('位图字体格式非法，缺少字符定义');
  }
  if (!atlasName) {
    throw new Error('位图字体格式非法，缺少 page 声明');
  }
  return { fontSize, commonHeight, atlasName, kerningDict, fontDefDictionary: fontDefs };
}
