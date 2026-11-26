/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import {
  KnotApi,
  KnotOptions,
} from '../../core/knot';

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
