/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/** 页块专属属性键（region 块不含这些键，用于区分两种无缩进行） */
const PAGE_KEYS = new Set(['size', 'format', 'filter', 'repeat', 'pma']);

/** 区域块专属属性键 */
const REGION_KEYS = new Set(['rotate', 'xy', 'orig', 'offset', 'index']);

/** 前瞻某无缩进行之后最近的一个非空行的身份（页属性行返回其键名，区域属性行或另一名字行返回 null） */
function findNextKey(lines: string[], from: number): string | null {
  for (let j = from + 1; j < lines.length; j++) {
    const line = lines[j];
    if (!line || !line.trim()) {
      continue;
    }
    // 缩进行 = 区域属性行，说明当前行是区域名
    if (line[0] === ' ' || line[0] === '\t') {
      return null;
    }
    // 无缩进属性行 = 页属性行，返回其键名
    const colon = line.indexOf(':');
    if (colon > 0) {
      return line.slice(0, colon).trim();
    }
    return null;
  }
  return null;
}

/** 探测某行之后最近的一个非空行是否为缩进行（老格式页名的确认特征：后随区域属性行） */
function nextIndented(lines: string[], from: number): boolean {
  for (let j = from + 1; j < lines.length; j++) {
    if (!lines[j] || !lines[j].trim()) {
      continue;
    }
    return lines[j][0] === ' ' || lines[j][0] === '\t';
  }
  return false;
}

/**
 * 解析 spine atlas 文本，提取贴图页名列表
 * - 区域信息由 spine runtime 自行解析（atlasText 原样传入 SkeletonData）
 * @param content .atlas 文件内容
 * @returns 页名列表（与 atlas 内页序一致）
 * @throws 内容为空或无法识别任何页时抛错
 */
export function ParseSpineAtlas(content: string): string[] {
  const lines = (content ?? '').split(/\r?\n/);
  const pages: string[] = [];

  // 收集全部无缩进行，并按其后属性块判定身份
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) {
      continue;
    }
    if (line[0] === ' ' || line[0] === '\t') {
      continue;
    }
    // 无缩进属性行（页属性 key: value）不是名字行
    if (line.indexOf(':') > 0) {
      continue;
    }
    // 前瞻最近的一个缩进属性行，按其键名判定本行是页名还是区域名
    const key = findNextKey(lines, i);
    if (key === null) {
      // 无页属性行的老格式：名字行后须跟随区域缩进行才确认为页名（孤立名字行视为垃圾文本拒收）
      // @tip 老格式多页的区域名与后续页名局部同形、结构上不可判定，仅支持单页
      if (pages.length === 0 && nextIndented(lines, i)) {
        pages.push(line.trim());
      }
      continue;
    }
    if (PAGE_KEYS.has(key)) {
      pages.push(line.trim());
    } else if (!REGION_KEYS.has(key)) {
      throw new Error(`spine atlas 属性键无法识别 >>> ${key}`);
    }
  }
  if (pages.length === 0) {
    throw new Error('spine atlas 无法识别任何贴图页');
  }
  return pages;
}
