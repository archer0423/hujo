/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { LRU } from '../cord/lru';
import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { Override } from '../skill/dict';

/** 敏感词审计员插件配置 */
export interface AuditorOptions extends KnotOptions {
  /**
   * 敏感词替换字符
   * @default '█'
   */
  replacement?: string;
  /**
   * 是否启用缓存
   * @default true
   */
  cacheEnabled?: boolean;
  /**
   * 缓存大小
   * @default 1000
   * @tip 须为正整数，非法值构造期显式报错（无论是否启用缓存均校验）
   */
  cacheSize?: number;
  /**
   * 是否忽略大小写
   * @default false
   * @tip 仅归一 ASCII 字母（A-Z↔a-z），逐码点等长替换不影响位置索引；
   *      全角字母/数字等全半角变体不归一
   */
  ignoreCase?: boolean;
}

/** 匹配位置信息 */
export interface AuditorMatchPosition {
  /** 匹配到的敏感词 */
  word: string;
  /**
   * 起始位置（**码点索引**，`Array.from` 语义）
   * @tip 非 UTF-16 下标：文本含 emoji 等代理对时，直接 `str.slice(Start, End)` 会切错位置
   */
  start: number;
  /**
   * 结束位置（码点索引，不包含）
   * @tip 同上，切分须按码点进行（如 `Array.from(str).slice(Start, End)`）
   */
  end: number;
}

/** 匹配结果 */
export interface AuditorMatchResult {
  /** 是否匹配到敏感词 */
  matched: boolean;
  /** 匹配到的敏感词列表（去重，按首次出现顺序） */
  words: string[];
  /** 所有匹配位置信息 */
  matches: AuditorMatchPosition[];
}

/** AC 自动机节点接口 */
export interface ACNode {
  /** 子节点映射 */
  children: Map<string, ACNode>;
  /** 失败指针 */
  fail: ACNode | null;
  /** 该节点自身的完整敏感词（词尾节点非空） */
  words: string[];
  /** 匹配输出（自身词 + fail 链词，构建时由 words 重新生成） */
  output: string[];
}

/** AC 自动机匹配结果（与外部匹配位置结构一致，复用同一形状避免重复定义） */
export type ACMatchResult = AuditorMatchPosition;

/** 敏感词审计员结点接口 */
export interface AuditorApi extends KnotApi<AuditorOptions> {
  /**
   * 检测文本是否包含敏感词
   * @param text 待检测的文本
   * @returns 是否包含敏感词
   */
  test(text: string): boolean;
  /**
   * 查找文本中的所有敏感词
   * @param text 待查找的文本
   * @returns 匹配结果（匹配位置为码点索引）
   */
  find(text: string): AuditorMatchResult;
  /**
   * 替换文本中的敏感词
   *
   * - 每个匹配区间（重叠匹配先合并为不重叠区间）整体替换为一个
   *   replacement 串（非逐字符屏蔽）
   * - 区间内的干扰字符一并被替换（变体表达整体屏蔽）
   * @param text 待替换的文本
   * @param replacement 替换串，缺省使用配置的替换字符；传空串为删除敏感词语义
   * @returns 替换后的文本
   */
  replace(text: string, replacement?: string): string;
  /**
   * 注入敏感词
   * @tip 重复注入已存在的词为幂等操作，不触发自动机重建与缓存清理
   * @param words 敏感词列表
   */
  injectSensitiveWords(words: string[]): void;
  /**
   * 注入干扰词
   *
   * - 干扰词在匹配时被跳过（如 "敏 感 词" 仍命中），仅单字符
   *   生效，多字符词将被忽略并告警
   * - 构造期默认注入空白字符（空格/制表符/回车/换行），故全新实例的
   *   GetInterferenceWordCount 返回 4
   * - 敏感词本身包含干扰字符时该词将无法命中，注入时须避开词库字符
   * @param words 干扰词列表
   */
  injectInterferenceWords(words: string[]): void;
  /**
   * 获取当前敏感词数量
   * @returns 敏感词数量
   */
  getSensitiveWordCount(): number;
  /**
   * 获取当前干扰词数量
   * @returns 干扰词数量（含构造期默认注入的空白字符）
   */
  getInterferenceWordCount(): number;
  /** 清空所有敏感词 */
  clearSensitiveWords(): void;
  /**
   * 清空所有干扰词（含构造期默认注入的空白字符）
   * @tip 清空后 "敏 感 词" 这类夹空白的变体不再命中
   */
  clearInterferenceWords(): void;
}

// implements
/** AC 自动机 */
class ACAutomaton {
  // public

  /**
   * 构造
   * @param ignoreCase 是否忽略大小写
   */
  public constructor(ignoreCase = false) {
    this.__root = {
      children: new Map(),
      fail: null,
      words: [],
      output: [],
    };
    this.__built = false;
    this.__interferenceWords = new Set();
    this.__ignoreCase = ignoreCase;
    this.__wordChars = new Map();
  }

  /**
   * 添加敏感词
   * @param word 敏感词
   */
  public addWord(word: string): void {
    if (!word || word.length === 0) {
      return;
    }

    let current = this.__root;
    const chars = Array.from(this.__normalize(word)); // 归一后分词(ignoreCase 关闭时原样返回)

    for (const char of chars) {
      let child = current.children.get(char);
      if (!child) {
        child = {
          children: new Map(),
          fail: null,
          words: [],
          output: [],
        };
        current.children.set(char, child);
      }
      current = child;
    }

    // 归一后同一路径只保留首词：ignoreCase 下 "abc"/"ABC" 共享路径，
    // 变体重复入表会让 Match 对同一区间输出多条重复结果（下游命中计数虚高）
    if (current.words.length === 0) {
      current.words.push(word);
      this.__wordChars.set(word, chars);
      this.__built = false; // 标记需要重新构建 fail 指针
    }
  }

  /**
   * 构建 fail 指针（使用 BFS）
   */
  public build(): void {
    if (this.__built) {
      return;
    }

    const queue: ACNode[] = [];

    // 第一层节点的 fail 指针指向 root
    for (const child of this.__root.children.values()) {
      child.fail = this.__root;
      child.output = [...child.words]; // 由自身词重新生成（fail 为 root，无合并项）
      queue.push(child);
    }

    // BFS 构建 fail 指针（头指针索引出队：array.shift 为 O(n)，万级节点的大词库构建退化为 O(n²)）
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];

      for (const [char, child] of current.children) {
        queue.push(child);

        // 查找 fail 指针
        let fail = current.fail;
        while (fail && !fail.children.has(char)) {
          fail = fail.fail;
        }

        child.fail = fail ? fail.children.get(char) || this.__root : this.__root;

        // 合并 output：由自身词重新生成（幂等，重复构建不再累积；fail 节点层级更浅、已先构建完成）
        child.output = [...child.words, ...child.fail.output];
      }
    }

    this.__built = true;
  }

  /**
   * 匹配文本，返回所有匹配结果
   * @param text 待匹配的文本
   * @returns 匹配结果列表
   */
  public match(text: string): ACMatchResult[] {
    if (!this.__built) {
      this.build();
    }

    const results: ACMatchResult[] = [];
    let current = this.__root;
    const chars = Array.from(this.__normalize(text)); // 归一后分词(逐码点等长,位置索引不变)

    // 记录匹配时的原始位置
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      // 如果是干扰字符，跳过
      if (this.__interferenceWords.has(char)) {
        continue;
      }

      // 沿着 fail 指针查找匹配的子节点
      while (current !== this.__root && !current.children.has(char)) {
        current = current.fail!;
      }

      if (current.children.has(char)) {
        current = current.children.get(char)!;

        // 输出所有匹配的敏感词
        for (const word of current.output) {
          // 计算在原始文本中的起始位置（跳过干扰字符）
          let j = i;
          // 从当前位置向前查找匹配的起始位置（AddWord 已缓存归一后的码点数组）
          const wordChars = this.__wordChars.get(word)!;
          let wordIndex = wordChars.length - 1;

          // 从后向前匹配，找到原始文本中的位置
          while (j >= 0 && wordIndex >= 0) {
            if (this.__interferenceWords.has(chars[j])) {
              j--;
              continue;
            }
            if (chars[j] === wordChars[wordIndex]) {
              wordIndex--;
            }
            j--;
          }

          // 回扫必须完整命中：前向 AC 已保证该词是当前位置的后缀（两侧对称跳过干扰字符），
          // wordIndex >= 0 说明不变量被破坏（理论不可达），防御性跳过而非产出错误区间
          if (wordIndex >= 0) {
            continue;
          }

          results.push({
            word: word,
            start: j + 1,
            end: i + 1,
          });
        }
      }
    }

    return results;
  }

  /**
   * 检测文本是否包含敏感词
   * @param text 待检测的文本
   * @returns 是否包含敏感词
   */
  public test(text: string): boolean {
    if (!this.__built) {
      this.build();
    }

    let current = this.__root;
    const chars = Array.from(this.__normalize(text));

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      // 如果是干扰字符，跳过
      if (this.__interferenceWords.has(char)) {
        continue;
      }

      while (current !== this.__root && !current.children.has(char)) {
        current = current.fail!;
      }

      if (current.children.has(char)) {
        current = current.children.get(char)!;

        if (current.output.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this.__root = {
      children: new Map(),
      fail: null,
      words: [],
      output: [],
    };
    this.__wordChars.clear();
    this.__built = false;
  }

  /**
   * 注入干扰词（仅单字符生效：匹配按单字符查表）
   * @param words 干扰词列表
   * @returns 被忽略的多字符词（由调用方决定告警方式，保持算法类无日志副作用）
   */
  public addInterferenceWords(words: string[]): string[] {
    const ignored: string[] = [];
    for (const word of words) {
      if (!word || word.length === 0) {
        continue;
      }
      const chars = Array.from(this.__normalize(word));
      if (chars.length !== 1) {
        // 多字符干扰词在按字符匹配的查表中永不命中——返回给调用方显式告警而非静默失效
        ignored.push(word);
        continue;
      }
      this.__interferenceWords.add(chars[0]);
    }
    return ignored;
  }

  /**
   * 清空干扰词
   */
  public clearInterferenceWords(): void {
    this.__interferenceWords.clear();
  }

  /**
   * 获取干扰词数量
   */
  public getInterferenceWordCount(): number {
    return this.__interferenceWords.size;
  }

  // private

  /** 自动机根节点 */
  private __root: ACNode;
  /** 是否已构建 */
  private __built: boolean;
  /** 干扰词容器 */
  private __interferenceWords: Set<string>;
  /** 是否忽略大小写 */
  private __ignoreCase: boolean;
  /** 词 → 归一后的码点数组缓存：避免 Match 热点对每个命中重复归一与分词 */
  private __wordChars: Map<string, string[]>;

  /**
   * 大小写归一（仅 ASCII 字母，逐码点等长替换，保证匹配位置与原始文本索引一致）
   */
  private __normalize(text: string): string {
    if (!this.__ignoreCase) {
      return text;
    }
    let out = '';
    for (const ch of text) {
      const code = ch.codePointAt(0)!;
      out += code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : ch;
    }
    return out;
  }
}

/**
 * 敏感词审计员插件
 */
export class Auditor extends Knot<AuditorOptions> implements AuditorApi {
  // public

  public get trait(): string {
    return 'auditor';
  }

  public test(text: string): boolean {
    if (!text || text.length === 0) {
      return false;
    }

    // 检查缓存
    if (this.__testCache) {
      const cached = this.__testCache.get(text);
      if (cached !== null) {
        return cached;
      }
    }

    const result = this.__acAutomaton.test(text);

    // 更新缓存
    if (this.__testCache) {
      this.__testCache.set(text, result);
    }

    return result;
  }

  public find(text: string): AuditorMatchResult {
    if (!text || text.length === 0) {
      return { matched: false, words: [], matches: [] };
    }

    // 检查缓存
    if (this.__findCache) {
      const cached = this.__findCache.get(text);
      if (cached !== null) {
        // 返回浅拷贝，防止外部修改影响缓存
        return {
          matched: cached.matched,
          words: [...cached.words],
          matches: cached.matches.map((m) => ({ ...m })),
        };
      }
    }

    // 匹配文本，自动跳过干扰词
    const matches = this.__acAutomaton.match(text);

    // 去重敏感词
    const wordSet = new Set<string>();
    for (const match of matches) {
      wordSet.add(match.word);
    }

    const result: AuditorMatchResult = {
      matched: matches.length > 0,
      words: Array.from(wordSet),
      matches: matches,
    };

    // 更新缓存（存储副本，防止后续修改影响缓存）
    if (this.__findCache) {
      this.__findCache.set(text, {
        matched: result.matched,
        words: [...result.words],
        matches: result.matches.map((m) => ({ ...m })),
      });
    }

    return result;
  }

  public replace(text: string, replacement?: string): string {
    if (!text || text.length === 0) {
      return text;
    }

    // 检查缓存（JSON 编码组合键：字符串拼接的 "_" 分隔符可出现在 text/replacement 中造成碰撞）
    const cacheKey = JSON.stringify([text, replacement ?? this.options.replacement!]);
    if (this.__replaceCache) {
      const cached = this.__replaceCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = this.find(text);
    if (!result.matched) {
      // 干净文本是最高频流量，同样入缓存（组合键已防碰撞），避免反复全量匹配
      this.__replaceCache?.set(cacheKey, text);
      return text;
    }

    // 在码点数组上操作：matches 的位置基于 Array.from 分词（码点索引），
    // 直接对原字符串 slice 会因代理对（emoji 等）长度不一致而切错位置
    const chars = Array.from(text);

    // 合并重叠区间：重叠匹配若逐个替换，从后向前切片会互相错位（吞字或残留敏感片段）
    const sorted = [...result.matches].sort((a, b) => a.start - b.start);
    const ranges: Array<{ start: number; end: number }> = [];
    for (const match of sorted) {
      const last = ranges[ranges.length - 1];
      if (last && match.start < last.end) {
        last.end = Math.max(last.end, match.end); // 重叠：并入上一区间
      } else {
        ranges.push({ start: match.start, end: match.end });
      }
    }

    // 每个合并区间整体替换为一个 replacement 串（非逐字符屏蔽）；空串为合法替换值（删除敏感词）
    const replaceChar = replacement ?? this.options.replacement!;
    for (let i = ranges.length - 1; i >= 0; i--) {
      const { start, end } = ranges[i];
      chars.splice(start, end - start, replaceChar); // 从后向前，前面的索引不受影响
    }

    const replacedText = chars.join('');

    // 更新缓存
    if (this.__replaceCache) {
      this.__replaceCache.set(cacheKey, replacedText);
    }

    return replacedText;
  }

  public injectSensitiveWords(words: string[]): void {
    let added = false;
    for (const word of words) {
      if (word && word.length > 0 && !this.__sensitiveWords.has(word)) {
        this.__sensitiveWords.add(word);
        added = true;
      }
    }
    // 无新增词时词库未变：跳过自动机重建与缓存清理，重复注入不打断既有缓存
    if (!added) {
      return;
    }
    this.__buildAutomaton();
    this.__clearCache();
  }

  public injectInterferenceWords(words: string[]): void {
    const ignored = this.__acAutomaton.addInterferenceWords(words);
    // 多字符干扰词永不命中：经插件日志显式告警（词库内容不落 console）
    if (ignored.length > 0) {
      for (const word of ignored) {
        this.logger.warn(`干扰词须为单个字符，已忽略 >>> ${word}`);
      }
    }
    this.__clearCache();
  }

  public getSensitiveWordCount(): number {
    return this.__sensitiveWords.size;
  }

  public getInterferenceWordCount(): number {
    return this.__acAutomaton.getInterferenceWordCount();
  }

  public clearSensitiveWords(): void {
    this.__sensitiveWords.clear();
    this.__buildAutomaton();
    this.__clearCache();
  }

  public clearInterferenceWords(): void {
    this.__acAutomaton.clearInterferenceWords();
    this.__clearCache();
  }

  // protected

  protected _attach(): Promise<boolean> {
    const cfg = this.options;

    // 默认值填充
    Override(cfg, {
      replacement: '█',
      ignoreCase: false,
      cacheSize: 1000,
    });

    // 缓存容量须为正整数：无论是否启用缓存都在构造期校验，配置错误不留到运行期
    if (!Number.isInteger(cfg.cacheSize) || cfg.cacheSize! <= 0) {
      this.logger.error(`cacheSize 须为正整数 >>> ${cfg.cacheSize}`);
      cfg.cacheSize = 1000;
    }

    this.__acAutomaton = new ACAutomaton(cfg.ignoreCase);
    this.__sensitiveWords = new Set();
    this.__acAutomaton.addInterferenceWords(' \t\r\n'.split(''));

    if (cfg.cacheEnabled) {
      this.__testCache = new LRU(cfg.cacheSize!);
      this.__findCache = new LRU(cfg.cacheSize!);
      this.__replaceCache = new LRU(cfg.cacheSize!);
    } else {
      this.__testCache = null;
      this.__findCache = null;
      this.__replaceCache = null;
    }

    // 构建敏感词自动机
    this.__buildAutomaton();

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__clearCache();
    return Promise.resolve(true);
  }

  // private

  /** 自动机 */
  private __acAutomaton!: ACAutomaton;
  /** 测试缓存 */
  private __testCache!: LRU<string, boolean> | null;
  /** 查找缓存 */
  private __findCache!: LRU<string, AuditorMatchResult> | null;
  /** 替换缓存 */
  private __replaceCache!: LRU<string, string> | null;
  /** 敏感词容器 */
  private __sensitiveWords!: Set<string>;

  /** 构建自动机 */
  private __buildAutomaton(): void {
    this.__acAutomaton.clear();
    const words = this.__sensitiveWords;
    for (const word of words) {
      this.__acAutomaton.addWord(word);
    }
    this.__acAutomaton.build();
  }

  /** 清空缓存 */
  private __clearCache(): void {
    this.__testCache?.clear();
    this.__findCache?.clear();
    this.__replaceCache?.clear();
  }
}
