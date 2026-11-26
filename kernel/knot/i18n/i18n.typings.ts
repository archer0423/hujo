/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { KnotApi, KnotOptions } from '../../core/knot';
import { I18nDictionary } from './i18n';

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
