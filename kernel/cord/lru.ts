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
 * LRU 缓存节点
 */
export interface LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

/**
 * LRU (Least Recently Used) 缓存
 *
 * 最近最少使用淘汰策略的缓存实现
 */
export class LRU<K, V> {
  // public

  /** 节点被添加时回调 */
  public onAppended?: (value: V) => void;

  /** 节点被移除时回调 */
  public onRemoved?: (value: V) => void;

  public constructor(capacity: number) {
    // Number.isInteger 一并拦截 NaN / Infinity / 小数：NaN 时 size > NaN 恒为 false，缓存永不淘汰
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('LRU capacity must be an integer greater than 0');
    }
    this.__capacity = capacity;
    this.__cache = new Map();
    this.__head = null;
    this.__tail = null;
  }

  /**
   * 获取缓存值，并提升为最近使用
   * 注意：未命中返回 null；若业务可能存入 null 值，返回值无法与未命中区分，请用 Has 判断
   */
  public get(key: K): V | null {
    const node = this.__cache.get(key);
    if (!node) {
      return null;
    }

    // 移动到头部（标记为最近使用）
    this.__moveToHead(node);
    return node.value;
  }

  /**
   * 读取缓存值，但不提升新鲜度（不改变淘汰顺序）
   * 注意：未命中返回 null，与存入的 null 值无法区分，请用 Has 判断
   */
  public peek(key: K): V | null {
    const node = this.__cache.get(key);
    return node ? node.value : null;
  }

  /**
   * 读取缓存值，未命中时用 creator 计算并写入缓存（写入视为最近使用）
   * 注意：creator 抛出的异常会向上传播，不会写入缓存
   */
  public getOrSet(key: K, creator: (key: K) => V): V {
    const node = this.__cache.get(key);
    if (node) {
      this.__moveToHead(node);
      return node.value;
    }

    const value = creator(key);
    this.set(key, value);
    return value;
  }

  /**
   * 设置缓存值
   */
  public set(key: K, value: V): void {
    const existing = this.__cache.get(key);

    if (existing) {
      // 更新现有节点
      existing.value = value;
      this.__moveToHead(existing);
      return;
    }

    // 创建新节点
    const node: LRUNode<K, V> = {
      key: key,
      value: value,
      prev: null,
      next: null,
    };

    // 添加到缓存
    this.__cache.set(key, node);
    this.__addToHead(node);

    // 检查容量，淘汰最久未使用的节点
    if (this.__cache.size > this.__capacity) {
      this.__removeTail();
    }
  }

  /**
   * 检查是否包含键
   */
  public has(key: K): boolean {
    return this.__cache.has(key);
  }

  /**
   * 删除缓存值
   */
  public delete(key: K): boolean {
    const node = this.__cache.get(key);
    if (!node) {
      return false;
    }

    this.__cache.delete(key);
    this.__removeNode(node);
    return true;
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.__cache.clear();
    this.__head = null;
    this.__tail = null;
  }

  /**
   * 获取缓存大小
   */
  public get size(): number {
    return this.__cache.size;
  }

  /**
   * 获取缓存容量
   */
  public get capacity(): number {
    return this.__capacity;
  }

  /**
   * 获取所有键（按最近使用到最久使用排序，与 values() / forEach() 同序）
   */
  public keys(): K[] {
    const result: K[] = [];
    let node = this.__head;
    while (node) {
      result.push(node.key);
      node = node.next;
    }
    return result;
  }

  /**
   * 获取所有值
   */
  public values(): V[] {
    const result: V[] = [];
    let node = this.__head;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }

  /**
   * 遍历缓存（按最近使用到最久使用）
   * 注意：内部为快照遍历，回调中增删改/清空缓存是安全的——已被删除或淘汰的条目不再回调，
   * 遍历期间新增的条目不参与本次遍历
   */
  public each(callback: (value: V, key: K) => void): void {
    const snapshot: LRUNode<K, V>[] = [];
    let node = this.__head;
    while (node) {
      snapshot.push(node);
      node = node.next;
    }
    for (const item of snapshot) {
      // 节点身份校验：Set 更新已有键不会更换节点，仍会回调；Delete 后重设的同键新节点则跳过
      if (this.__cache.get(item.key) === item) {
        callback(item.value, item.key);
      }
    }
  }

  // private

  /** 容量 */
  private __capacity: number;
  /** 存储 Map */
  private __cache: Map<K, LRUNode<K, V>>;
  /** 头节点（最近使用） */
  private __head: LRUNode<K, V> | null;
  /** 尾节点（最久未使用） */
  private __tail: LRUNode<K, V> | null;

  /**
   * 添加节点到头部
   */
  private __addToHead(node: LRUNode<K, V>): void {
    node.prev = null;
    node.next = this.__head;

    if (this.__head) {
      this.__head.prev = node;
    }

    this.__head = node;
    this.onAppended?.(node.value);

    if (!this.__tail) {
      this.__tail = node;
    }
  }

  /**
   * 移动节点到头部
   */
  private __moveToHead(node: LRUNode<K, V>): void {
    // 先移除节点
    this.__removeNode(node);

    // 添加到头部
    this.__addToHead(node);
  }

  /**
   * 移除节点
   */
  private __removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.__head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.__tail = node.prev;
    }
  }

  /**
   * 移除尾部节点（最久未使用）
   */
  private __removeTail(): void {
    if (!this.__tail) {
      return;
    }

    this.__cache.delete(this.__tail.key);
    this.onRemoved?.(this.__tail.value);
    this.__removeNode(this.__tail);
  }
}
