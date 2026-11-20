/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { AtlasConfig, AtlasFrameDef } from '../typings';

/** plist token：键、值或容器边界 */
type Token = { kind: 'key' | 'value'; value: string } | { kind: 'dict' | 'end' };

/** plist 值：字符串、布尔串或嵌套 dict */
interface PlistDict {
  [key: string]: PlistValue;
}
type PlistValue = string | PlistDict;

/** 原型敏感键：不写入解析结果，避免改写字典原型 */
const UNSAFE_DICT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** XML 实体表（无原型，避免 `&constructor;` 之类键命中继承属性） */
const XML_ENTITIES = Object.assign(Object.create(null), {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}) as Record<string, string>;

/** 仅用于自有属性判定 */
function hasOwnKey(table: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(table, key);
}

/** 解码 XML 实体（TexturePacker 会把 `&` 等字符写成实体） */
function decodeXml(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (raw: string, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code);
      }
      return raw;
    }
    return XML_ENTITIES[body] ?? raw;
  });
}

/** 逐 token 扫描 plist XML（仅覆盖 TexturePacker 用到的子集） */
function* tokenize(xml: string): Generator<Token> {
  const re =
    /<key>([^<]*)<\/key>|<string>([^<]*)<\/string>|<integer>([^<]*)<\/integer>|<real>([^<]*)<\/real>|<(true|false)\/>|<\/?dict>/g;
  let m = re.exec(xml);
  while (m) {
    if (m[1] !== undefined) {
      yield { kind: 'key', value: m[1] };
    } else if (m[2] !== undefined || m[3] !== undefined || m[4] !== undefined) {
      yield { kind: 'value', value: m[2] ?? m[3] ?? m[4] };
    } else if (m[5] !== undefined) {
      yield { kind: 'value', value: m[5] };
    } else if (m[0] === '<dict>') {
      yield { kind: 'dict' };
    } else {
      yield { kind: 'end' };
    }
    m = re.exec(xml);
  }
}

/** 递归解析 dict 结构（消费到对应的 </dict> 为止，手动推进以避免 for...of 关闭生成器） */
function readDict(gen: Generator<Token>): Record<string, PlistValue> {
  // 无原型字典：`__proto__` 不再触发原型 setter，危险键另做显式丢弃
  const out: Record<string, PlistValue> = Object.create(null);
  let lastKey: string | null = null;
  let first = true;
  for (;;) {
    const next = gen.next();
    if (next.done) {
      break;
    }
    const tok = next.value;
    if (tok.kind === 'end') {
      break;
    }
    if (tok.kind === 'dict') {
      // 根层第一个 <dict> 是当前字典自身的开标签，跳过；
      // 其余无键 dict 需要消费，保持 token 流对齐
      if (first) {
        first = false;
        continue;
      }
      const child = readDict(gen);
      if (lastKey !== null && !UNSAFE_DICT_KEYS.has(lastKey)) {
        out[lastKey] = child;
      }
      lastKey = null;
      continue;
    }
    first = false;
    if (tok.kind === 'key') {
      lastKey = decodeXml(tok.value);
      continue;
    }
    if (lastKey !== null && !UNSAFE_DICT_KEYS.has(lastKey)) {
      out[lastKey] = decodeXml((tok as any).value);
    }
    lastKey = null;
  }
  return out;
}

/** 提取大括号串内的数值序列（形如 `{{x,y},{w,h}}`、`{{x,y,w,h}}`、`{0,0}`） */
function readNums(s: string): number[] {
  return (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** 布尔值读取（plist 的 true/false token 已归一为字符串） */
function readBool(v: unknown): boolean {
  return v === 'true' || v === '1';
}

/** 矩形读取（兼容两种大括号简写） */
function readRect(v: unknown): { x: number; y: number; width: number; height: number } {
  const n = readNums(String(v));
  if (n.length < 4) {
    throw new Error(`图集矩形格式非法 >>> ${String(v)}`);
  }
  return { x: n[0], y: n[1], width: n[2], height: n[3] };
}

/** 点值读取 */
function readPoint(v: unknown): { x: number; y: number } {
  const n = readNums(String(v));
  if (n.length < 2) {
    throw new Error(`图集点值格式非法 >>> ${String(v)}`);
  }
  return { x: n[0], y: n[1] };
}

/** 尺寸读取 */
function readSize(v: unknown): { width: number; height: number } {
  const n = readNums(String(v));
  if (n.length < 2) {
    throw new Error(`图集尺寸格式非法 >>> ${String(v)}`);
  }
  return { width: n[0], height: n[1] };
}

/**
 * 解析 TexturePacker 图集 plist
 * @param content .plist 文件内容
 * @returns 归一化的图集配置（兼容 format 2/3，坐标为图像坐标）
 * @throws 内容为空、结构不完整、格式过旧时抛错
 */
export function ParsePlistAtlas(content: string): AtlasConfig {
  const text = (content ?? '').trim();
  if (!text) {
    throw new Error('图集内容为空');
  }

  const root = readDict(tokenize(text));
  const framesDict = hasOwnKey(root, 'frames') ? root.frames : undefined;
  const metaDict = hasOwnKey(root, 'metadata') ? root.metadata : undefined;
  if (!framesDict || !metaDict || typeof framesDict !== 'object' || typeof metaDict !== 'object') {
    throw new Error('图集结构不完整，缺少 frames 或 metadata');
  }
  const meta = metaDict as Record<string, PlistValue>;
  const textureFileRaw = hasOwnKey(meta, 'realTextureFileName')
    ? meta.realTextureFileName
    : hasOwnKey(meta, 'textureFileName')
      ? meta.textureFileName
      : undefined;
  if (typeof textureFileRaw !== 'string' || textureFileRaw.length === 0) {
    throw new Error('图集缺少贴图文件名');
  }
  const textureFile = textureFileRaw;

  const frames: Record<string, AtlasFrameDef> = Object.create(null);
  for (const [name, raw] of Object.entries(framesDict as Record<string, PlistValue>)) {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`图集帧格式非法 >>> ${name}`);
    }
    const fd = raw as Record<string, PlistValue>;
    let def: AtlasFrameDef;
    if (hasOwnKey(fd, 'frame')) {
      // format 2：frame/offset/sourceSize/rotated
      def = {
        rect: readRect(fd.frame),
        rotated: readBool(fd.rotated),
        offset: readPoint(fd.offset),
        originalSize: readSize(fd.sourceSize),
      };
    } else if (hasOwnKey(fd, 'textureRect')) {
      // format 3：textureRect 提供原点，spriteSize 提供存储方向尺寸
      const origin = readRect(fd.textureRect);
      def = {
        rect: {
          x: origin.x,
          y: origin.y,
          width: readSize(fd.spriteSize).width,
          height: readSize(fd.spriteSize).height,
        },
        rotated: readBool(fd.textureRotated),
        offset: readPoint(fd.spriteOffset),
        originalSize: readSize(fd.spriteSourceSize),
      };
    } else {
      throw new Error(`不支持的图集帧格式 >>> ${name}`);
    }
    frames[name] = def;
  }

  return { textureFile, frames };
}
