/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { journal } from '../core/journal';
import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { FmtString } from '../skill/literal';
import { AffairApi } from './affair';

/** 多语言插件配置 */
export interface I18nOptions extends KnotOptions {
  /** 受支持的语言列表 */
  supported: string[];
  /** 首选语言 */
  preferred: string;
}

/** 多语言插件接口 */
export interface I18nApi extends KnotApi<I18nOptions> {
  /** 当前语言 */
  get language(): string;
  set language(language: string);
  /** 获取语言字典，如果不存在则返回 undefined */
  get(language: string): I18nDictionary | undefined;
  /** 查询语言字典是否存在 */
  has(language: string): boolean;
  /** 获取当前语言翻译（如果翻译失败，则回退到 id） */
  translate(id: string, ...args: unknown[]): string;
}

/**
 * 语言专属词典
 */
export class I18nDictionary {
  // public

  /**
   * 构造
   * @param Language 所属语言
   */
  public constructor(public readonly Language: string) {
    this.__entries = new Map();
  }

  /** 查询词条是否存在 */
  public has(id: string): boolean {
    return this.__entries.has(id);
  }

  /** 获取词条 */
  public get(id: string, ...args: unknown[]): string | undefined {
    if (!this.has(id)) return undefined;
    const text = this.__entries.get(id)!;
    if (args.length) {
      return FmtString(text, ...args);
    }
    return text;
  }

  /** 添加词条（已存在时覆盖并告警） */
  public add(id: string, text: string): void {
    if (this.__entries.has(id)) {
      const prev = this.__entries.get(id);
      this.__logger.warn(`即将覆盖原词条 >>> ${this.Language}::${id} [${prev} -> ${text}]`);
    }
    this.__entries.set(id, text);
  }

  /** 批量添加词条 */
  public addBatch(entries: [id: string, text: string][]): void {
    for (const [id, text] of entries) {
      this.add(id, text);
    }
  }

  /** 移除词条 */
  public remove(id: string): void {
    this.__entries.delete(id);
  }

  /** 批量移除词条 */
  public removeBatch(ids: string[]): void {
    for (const id of ids) {
      this.remove(id);
    }
  }

  /** 清空所有词条 */
  public clear(): void {
    this.__entries.clear();
  }

  // private

  /** 词条容器 */
  private __entries: Map<string, string>;

  private get __logger() {
    return journal.acquire(I18n.prototype.trait);
  }
}

/** 多语言结点 */
export class I18n extends Knot<I18nOptions> implements I18nApi {
  // public static

  /** 内置事件 */
  public static readonly EVENT = {
    /** 语言切换 */
    LANGUAGE_CHANGED: 'i18n:language-changed',
  } as const;

  // public
  declare public readonly affair: AffairApi;

  public constructor() {
    super();
    this.__dictionaries = new Map();
  }

  public get trait() {
    return 'i18n';
  }

  public get deps(): string[] {
    return ['affair'];
  }

  public get language(): string {
    return this.__current;
  }

  public set language(language: string) {
    if (!this.__dictionaries.has(language)) {
      this.logger.warn(`不受支持的语言 >>> ${language}`);
      return;
    }

    if (this.__current !== language) {
      const prev = this.__current;
      this.__current = language;
      this.affair.sys.notify(I18n.EVENT.LANGUAGE_CHANGED, { current: language, prev });
    }
  }

  public get(language: string): I18nDictionary | undefined {
    return this.__dictionaries.get(language);
  }

  public has(language: string): boolean {
    return this.__dictionaries.has(language);
  }

  public translate(id: string, ...args: unknown[]): string {
    // 如果不存在，则回退到 id
    return this.__dictionaries.get(this.__current)?.get(id, ...args) ?? id;
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.__current = this.options.preferred;
    this.__dictionaries = new Map();

    if (this.options.supported.length === 0) {
      this.logger.error('未配置任何支持语言');
      return Promise.resolve(false);
    }

    // 须先填充词典再判断回退，否则 has 恒为 false，PreferredLanguage 会被无条件忽略
    this.options.supported.forEach((lang) => {
      this.__dictionaries.set(lang, new I18nDictionary(lang));
    });

    if (!this.__dictionaries.has(this.__current)) {
      // 首选语言不受支持时回退到受支持的第一个语言并告警
      this.__current = this.options.supported[0];
      this.logger.warn(`首选语言不受支持，将回退到受支持的第一个语言 >>> ${this.__current}`);
    }

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__dictionaries.clear();
    return Promise.resolve(true);
  }

  // private

  /** 当前语言 */
  private __current!: string;
  /** 词典容器 */
  private __dictionaries: Map<string, I18nDictionary>;
}
