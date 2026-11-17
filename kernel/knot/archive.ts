import { sys } from 'cc';

import { Knot, KnotApi, KnotOptions } from '../core/knot';
import { journal } from '../entry';

/** 存储值类型（只允许布尔值/数值/字符串） */
export type ArchiveItemValue = boolean | number | string;

/** 存储字段形式 */
export type ArchiveItemKey = `${string}@${'b' | 'n' | 's'}`;

/** 存储项配置 */
export type ArchiveField<V extends ArchiveItemValue> = [trait: ArchiveItemKey, defalut: V];

/** 存档配置 */
export interface ArchiveOptions extends KnotOptions {
  /** 应用名称 */
  app: string;
  /** 序列化 */
  serialize?: (text: string) => string;
  /** 反序列化 */
  deserialize?: (text: string) => string;
  /** 自动保存时间间隔（默认 30 秒） */
  autoSaveInterval?: number;
}

/** 存档结点接口 */
export interface ArchiveApi extends KnotApi<ArchiveOptions> {
  /**
   * 获取/创建存档
   * @param doc 存档标识
   * @param fields 字段
   * @throws 如果存档已存在则会抛出错误
   * @returns
   */
  create(doc: string, fields: ArchiveField<ArchiveItemValue>[]): ArchiveDocument;
  /**
   * 获取存档
   * @param doc 存档标识
   * @returns 存档
   */
  get(doc: string): ArchiveDocument | undefined;
  /**
   * 删除存档
   * @param doc 存档标识
   */
  delete(doc: string): void;
  /** 保存所有存档 */
  save(): void;
}

/** 存档监听器 */
export type ArchiveListener = (curr: ArchiveItemValue, prev: ArchiveItemValue) => void;

/** 存档 */
export class ArchiveDocument {
  // public

  /**
   * 构造
   * @param doc 存档标识
   * @param app 应用标识
   * @param __serialize 序列化方法
   * @param __deserialize 反序列化方法
   * @param __fire 字段内容变化回调
   */
  public constructor(
    public readonly doc: string,
    public readonly app: string,
    private readonly __serialize: ArchiveOptions['serialize'],
    private readonly __deserialize: ArchiveOptions['deserialize'],
  ) {
    this.__fields = new Map();
    this.__dirtyFields = new Set();
    this.__listeners = new Map();
  }

  /**
   * 安装所有字段（一次性）
   * @param fields 字段入参
   */
  public install(fields: ArchiveField<ArchiveItemValue>[]) {
    if (this.__fields.size === 0) {
      for (const [trait, value] of fields) {
        this.__load(trait, value);
      }
    }
  }

  /**
   * 读取字段
   * @param trait 字段标识
   * @returns 字段内容
   */
  public read<V extends ArchiveItemValue>(trait: ArchiveItemKey) {
    const key = `${this.app}@${this.doc}:${trait}`;

    if (!this.__fields.has(trait)) {
      throw `不存在的项目标识 >>> ${key}`;
    }

    const expected = this.__pinch(trait)[1];
    const ret = this.__fields.get(trait)!;
    const type = (typeof ret)[0];
    if (type !== expected) {
      throw `不匹配的数据类型 (${type} ≠ ${expected}) >>> ${key}`;
    }

    return ret as V;
  }

  /**
   * 写入字段
   * @param trait 字段标识
   * @param value 字段内容
   * @returns
   */
  public write<V extends ArchiveItemValue>(trait: ArchiveItemKey, value: V) {
    const key = `${this.app}@${this.doc}:${trait}`;

    if (!this.__fields.has(trait)) {
      throw `不存在的项目标识 >>> ${key}`;
    }

    if (typeof value === 'undefined' || value === null) {
      throw `不允许写入 undefined/null >>> ${key}`;
    }

    const expected = this.__pinch(trait)[1];
    const type = (typeof value)[0];
    if (type !== expected) {
      throw `不匹配的数据类型 (${type} ≠ ${expected}) >>> ${key}`;
    }

    const prev = this.__fields.get(trait)!;
    if (prev === value) {
      return;
    }

    this.__fields.set(trait, value);
    this.__dirtyFields.add(trait);
    this.__fire(trait, value, prev);
  }

  /** 保存脏字段 */
  public saveDirty() {
    if (this.__dirtyFields.size) {
      for (const trait of this.__dirtyFields) {
        this.__save(trait);
      }
    }
  }

  /** 强制保存存档 */
  public save() {
    for (const [trait] of this.__fields) {
      this.__save(trait);
    }
  }

  /** 删除存档 */
  public prune() {
    for (const [trait] of this.__fields) {
      const key = `${this.app}@${this.doc}:${trait}`;
      sys.localStorage.removeItem(key);
    }
    this.__fields.clear();
    this.__listeners.clear();
  }

  /**
   * 添加字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   */
  public on(trait: ArchiveItemKey, listener: ArchiveListener) {
    if (this.__listeners.has(trait)) {
      this.__listeners.get(trait)!.add(listener);
    } else {
      this.__listeners.set(trait, new Set([listener]));
    }
  }

  /**
   * 添加一次性字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   * @returns 包装后的监听器（用于手动移除监听器）
   */
  public once(trait: ArchiveItemKey, listener: ArchiveListener): ArchiveListener {
    const wrapper = (curr: ArchiveItemValue, prev: ArchiveItemValue) => {
      listener(curr, prev);
      this.off(trait, wrapper);
    };
    if (this.__listeners.has(trait)) {
      this.__listeners.get(trait)!.add(wrapper);
    } else {
      this.__listeners.set(trait, new Set([wrapper]));
    }
    return wrapper;
  }

  /**
   * 移除字段监听器
   * @param trait 字段标识
   * @param listener 监听器
   */
  public off(trait: ArchiveItemKey, listener: ArchiveListener) {
    if (this.__listeners.has(trait)) {
      this.__listeners.get(trait)!.delete(listener);
      if (this.__listeners.get(trait)!.size === 0) {
        this.__listeners.delete(trait);
      }
    }
  }

  /**
   * 移除指定字段的所有监听器
   * @param trait 字段标识
   */
  public offTargeted(trait: ArchiveItemKey) {
    this.__listeners.delete(trait);
  }

  /** 移除所有字段监听器 */
  public offAll() {
    this.__listeners.clear();
  }

  // private

  /** 字段容器 */
  private __fields: Map<ArchiveItemKey, ArchiveItemValue>;
  /** 脏字段容器 */
  private __dirtyFields: Set<ArchiveItemKey>;
  /** 字段监听器容器 */
  private __listeners: Map<string, Set<ArchiveListener>>;

  /**
   * 将文本分割为两段式标准字段
   * @param text 输入文本
   * @returns 两段式标准字段
   */
  private __pinch(text: string): [string?, string?] {
    const stop = text.lastIndexOf('@');
    if (stop > -1) {
      return [text.slice(0, stop), text.slice(stop + 1)];
    }
    return [];
  }

  /**
   * 是否有效的字段类型
   * @param type 字段类型
   * @returns
   */
  private __isLegalType(type?: string) {
    return typeof type === 'string' && (type === 'b' || type === 'n' || type === 's');
  }

  /**
   * 加载字段
   * @param trait 字段标识
   * @param defalut 默认内容
   */
  private __load(trait: ArchiveItemKey, defalut: ArchiveItemValue) {
    const key = `${this.app}@${this.doc}:${trait}`;
    if (!this.__isLegalType(this.__pinch(trait as ArchiveItemKey)[1])) {
      throw `不合法的字段标识 >>> ${key}`;
    }

    let ret = defalut;
    let val = sys.localStorage.getItem(key);
    if (typeof val === 'string') {
      if (this.__deserialize) {
        val = this.__deserialize(val);
      }
      const [raw, type] = this.__pinch(val as ArchiveItemKey);
      if (typeof raw === 'string' && this.__isLegalType(type)) {
        switch (type) {
          case 'b':
            ret = raw === 'true' ? true : false;
            break;
          case 'n':
            const temp = +raw;
            if (isFinite(temp)) {
              ret = temp;
            }
            break;
          case 's':
            ret = raw;
            break;
        }
      }
      this.__fields.set(trait, ret);
    }
  }

  /**
   * 保存字段
   * @param trait 字段标识
   */
  private __save(trait: ArchiveItemKey) {
    if (this.__fields.has(trait)) {
      const key = `${this.app}@${this.doc}:${trait}`;
      const val = this.__fields.get(trait);
      const type = (typeof val)[0];
      let ret = `${val}@${type}`;
      if (this.__serialize) {
        ret = this.__serialize(ret);
      }
      sys.localStorage.setItem(key, ret);
      this.__dirtyFields.delete(trait);
    }
  }

  /**
   * 触发字段内容更新
   * @param trait 字段标识
   * @param curr 新内容
   * @param prev 旧内容
   */
  private __fire(trait: ArchiveItemKey, curr: ArchiveItemValue, prev: ArchiveItemValue) {
    if (this.__listeners.has(trait)) {
      const key = `${this.app}@${this.doc}:${trait}`;
      const listeners = this.__listeners.get(trait)!;
      for (const listener of listeners) {
        try {
          listener(curr, prev);
        } catch (err) {
          this.__logger.error(`监听器执行错误，自动移除 >>> ${key}`, listener, err);
          this.off(trait, listener);
        }
      }
    }
  }

  private get __logger() {
    return journal.acquire(Archive.prototype.trait);
  }
}

/**
 * 存档结点
 *
 * @tip 字段标识构成："名称@类型"
 * @tip 构建存档前需要预先定义所有字段
 * @tip 仅支持布尔值/数值/字符串三种数据类型的字段
 * @tip 负责数据存档，如需具体形制（如存档列表、个人信息等），请自行封装
 * @tip 为避免版本升级带来的数据冲突，建议采用所有破坏性更新都采用新增字段的形式来应用
 * @tip 建议在离开应用之前手动保存一次
 */
export class Archive extends Knot<ArchiveOptions> implements ArchiveApi {
  // public

  public constructor() {
    super();
    this.__documents = new Map();
  }

  public get trait(): string {
    return 'archive';
  }

  public create(doc: string, fields: ArchiveField<ArchiveItemValue>[]) {
    if (this.__documents.has(doc)) {
      throw `存档已存在 >>> ${doc}`;
    }

    const document = new ArchiveDocument(
      doc,
      this.options.app,
      this.options.serialize,
      this.options.deserialize,
    );
    document.install(fields);
    this.__documents.set(doc, document);

    return document;
  }

  public get(doc: string) {
    return this.__documents.get(doc);
  }

  public delete(doc: string) {
    if (this.__documents.has(doc)) {
      this.__documents.get(doc)!.prune();
      this.__documents.delete(doc);
    }
  }

  public save() {
    this.__documents.forEach((doc) => doc.saveDirty());
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.__timer = setInterval(() => this.save(), this.options.autoSaveInterval ?? 10_000);
    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    this.__documents.forEach((doc) => doc.save());
    this.__documents.clear();
    clearInterval(this.__timer);
    return Promise.resolve(true);
  }

  // private

  /** 存档容器 */
  private __documents: Map<string, ArchiveDocument>;
  private __timer!: number;
}
