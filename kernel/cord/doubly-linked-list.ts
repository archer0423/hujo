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
 * 泛型双向链表节点
 */
export class DoublyLinkedListNode<T> {
  /** 保存的值 */
  public value: T;
  /** 前驱节点，链表头部为 null */
  public prev: DoublyLinkedListNode<T> | null = null;
  /** 后继节点，链表尾部为 null */
  public next: DoublyLinkedListNode<T> | null = null;

  public constructor(value: T) {
    this.value = value;
  }
}

/**
 * 泛型双向链表
 *
 * 常用 API（时间复杂度已标注）：
 * - push(value)      : O(1)   在尾部追加
 * - unshift(value)   : O(1)   在头部插入
 * - pop()            : O(1)   移除并返回尾部节点
 * - shift()          : O(1)   移除并返回头部节点
 * - insertAfter(node, value) : O(1) 在指定节点后插入
 * - insertBefore(node, value): O(1) 在指定节点前插入
 * - remove(node)     : O(n)   删除任意节点（含归属校验）
 * - find(cb)         : O(n)   查找第一个满足条件的节点
 * - each(cb)         : O(n)   遍历
 * - toArray()        : O(n)   转为普通数组
 */
export class DoublyLinkedList<T> {
  // public

  /** 是否开启归属校验（防止误删/误插非本链表节点，开启后相关操作复杂度由 O(1) 变为 O(n)） */
  public checkOwnership = false;

  /** 链表当前长度 */
  public get size(): number {
    return this.__size;
  }

  /** 链表是否为空 */
  public get isEmpty(): boolean {
    return this.__size === 0;
  }

  /** 头节点（getter 只读，但节点字段可写；外部改写指针会破坏链表结构） */
  public get first(): DoublyLinkedListNode<T> | null {
    return this.__head;
  }

  /** 尾节点（getter 只读，但节点字段可写；外部改写指针会破坏链表结构） */
  public get last(): DoublyLinkedListNode<T> | null {
    return this.__tail;
  }

  /** 在尾部追加节点 */
  public push(value: T): this {
    const node = new DoublyLinkedListNode(value);
    if (!this.__tail) {
      // 空链表
      this.__head = this.__tail = node;
    } else {
      node.prev = this.__tail;
      this.__tail.next = node;
      this.__tail = node;
    }
    this.__size++;
    return this;
  }

  /** 在头部插入节点 */
  public unshift(value: T): this {
    const node = new DoublyLinkedListNode(value);
    if (!this.__head) {
      this.__head = this.__tail = node;
    } else {
      node.next = this.__head;
      this.__head.prev = node;
      this.__head = node;
    }
    this.__size++;
    return this;
  }

  /** 移除并返回头节点的值 */
  public shift(): T | undefined {
    if (!this.__head) return undefined;

    const value = this.__head.value;
    if (this.__head === this.__tail) {
      // 只有一个节点
      this.__head = this.__tail = null;
    } else {
      const next = this.__head.next!;
      // 清理出链节点指针，缩短其引用链生命周期（与 remove 行为一致）
      this.__head.next = null;
      next.prev = null;
      this.__head = next;
    }
    this.__size--;
    return value;
  }

  /** 移除并返回尾节点的值 */
  public pop(): T | undefined {
    if (!this.__tail) return undefined;
    const value = this.__tail.value;
    if (this.__head === this.__tail) {
      this.__head = this.__tail = null;
    } else {
      const prev = this.__tail.prev!;
      // 清理出链节点指针，缩短其引用链生命周期（与 remove 行为一致）
      this.__tail.prev = null;
      prev.next = null;
      this.__tail = prev;
    }
    this.__size--;
    return value;
  }

  /**
   * 在指定节点后插入新节点，返回新节点
   * @tip 节点须属于本链表且未被移除，否则返回 null 且链表不受影响
   */
  public insertAfter(node: DoublyLinkedListNode<T>, value: T): DoublyLinkedListNode<T> | null {
    if (this.checkOwnership && !this.owns(node)) return null;
    const newNode = new DoublyLinkedListNode(value);
    newNode.prev = node;
    newNode.next = node.next;

    if (node.next) {
      node.next.prev = newNode;
    } else {
      // node 是尾节点
      this.__tail = newNode;
    }
    node.next = newNode;
    this.__size++;
    return newNode;
  }

  /**
   * 在指定节点前插入新节点，返回新节点
   * @tip 节点须属于本链表且未被移除，否则返回 null 且链表不受影响
   */
  public insertBefore(node: DoublyLinkedListNode<T>, value: T): DoublyLinkedListNode<T> | null {
    if (this.checkOwnership && !this.owns(node)) return null;
    const newNode = new DoublyLinkedListNode(value);
    newNode.next = node;
    newNode.prev = node.prev;

    if (node.prev) {
      node.prev.next = newNode;
    } else {
      // node 是头节点
      this.__head = newNode;
    }
    node.prev = newNode;
    this.__size++;
    return newNode;
  }

  /** 节点是否仍在链上（归属校验，O(n)） */
  private owns(node: DoublyLinkedListNode<T>): boolean {
    let current: DoublyLinkedListNode<T> | null = this.__head;
    while (current) {
      if (current === node) return true;
      current = current.next;
    }
    return false;
  }

  /**
   * 删除任意节点，返回是否成功
   * @tip 节点须属于本链表且未被移除，否则返回 false 且链表不受影响
   */
  public remove(node: DoublyLinkedListNode<T>): boolean {
    // 归属校验：拦截来自其他链表或已被移除的节点，避免静默改写指针、错记 size
    if (!node || (this.checkOwnership && !this.owns(node))) return false;

    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // 删除的是头节点
      this.__head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // 删除的是尾节点
      this.__tail = node.prev;
    }

    // 清理被删节点的残留指针
    node.prev = null;
    node.next = null;

    this.__size--;
    return true;
  }

  /** 根据回调函数查找第一个满足条件的节点 */
  public find(predicate: (value: T, index: number) => boolean): DoublyLinkedListNode<T> | null {
    let cur = this.__head;
    let idx = 0;
    while (cur) {
      if (predicate(cur.value, idx)) return cur;
      cur = cur.next;
      idx++;
    }
    return null;
  }

  /** 遍历所有节点；回调中新追加的节点不参与本次遍历，删除当前节点后沿原链继续 */
  public each(callback: (value: T, index: number) => void): void {
    // 锚定起始尾节点：回调中 push 会让原尾节点的 Next 指向新节点，
    // 仅靠保存后继无法拦截，必须以起始尾节点为终点防止无限遍历
    const end = this.__tail;
    let cur = this.__head;
    let idx = 0;
    while (cur) {
      // 提前保存后继：Remove 当前节点（会清空其指针）后也能继续沿原链走完
      const next = cur.next;
      callback(cur.value, idx);
      if (cur === end) break;
      cur = next;
      idx++;
    }
  }

  /** 转换为普通数组（调试/展示用） */
  public toArray(): T[] {
    const arr: T[] = [];
    this.each((v) => arr.push(v));
    return arr;
  }

  /** 便于调试的字符串表示 */
  public toString(): string {
    return this.toArray().join(' <-> ');
  }

  // private

  private __head: DoublyLinkedListNode<T> | null = null;
  private __tail: DoublyLinkedListNode<T> | null = null;
  private __size = 0;
}
