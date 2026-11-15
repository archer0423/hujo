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
 * 泛型单向链表节点
 */
export class LinkedListNode<T> {
  /** 节点保存的值 */
  public value: T;
  /** 指向下一个节点，末尾为 null */
  public next: LinkedListNode<T> | null = null;

  public constructor(value: T) {
    this.value = value;
  }
}

/**
 * 泛型链表
 *
 * 主要方法：
 * - push(value)      : 在链表尾部追加节点
 * - pop()            : 移除并返回最后一个节点的值（O(n)）
 * - shift()          : 移除并返回头节点的值（O(1)）
 * - unshift(value)   : 在链表头部插入节点（O(1)）
 * - find(cb)         : 根据回调函数查找第一个满足条件的节点
 * - remove(cb)       : 删除第一个满足条件的节点
 * - each(cb)         : 遍历所有节点
 * - toArray()        : 转换为普通数组
 * - size / isEmpty   : 获取长度或判断是否为空
 */
export class LinkedList<T> {
  // public

  /** 链表当前长度 */
  public get size(): number {
    return this.__size;
  }

  /** 链表是否为空 */
  public get isEmpty(): boolean {
    return this.__size === 0;
  }

  /** 在尾部追加节点 */
  public push(value: T): this {
    const node = new LinkedListNode(value);
    if (!this.__head) {
      this.__head = this.__tail = node;
    } else {
      this.__tail!.next = node;
      this.__tail = node;
    }
    this.__size++;
    return this;
  }

  /** 在头部插入节点 */
  public unshift(value: T): this {
    const node = new LinkedListNode(value);
    if (!this.__head) {
      this.__head = this.__tail = node;
    } else {
      node.next = this.__head;
      this.__head = node;
    }
    this.__size++;
    return this;
  }

  /** 移除并返回头节点的值 */
  public shift(): T | undefined {
    if (!this.__head) return undefined;
    const value = this.__head.value;
    this.__head = this.__head.next;
    if (!this.__head) this.__tail = null; // 链表变空
    this.__size--;
    return value;
  }

  /** 移除并返回尾节点的值（需要遍历） */
  public pop(): T | undefined {
    if (!this.__head) return undefined;
    if (this.__head === this.__tail) {
      // 只有一个节点
      const value = this.__head.value;
      this.__head = this.__tail = null;
      this.__size = 0;
      return value;
    }
    // 找到倒数第二个节点
    let prev = this.__head;
    while (prev.next && prev.next !== this.__tail) {
      prev = prev.next;
    }
    const value = this.__tail!.value;
    prev.next = null;
    this.__tail = prev;
    this.__size--;
    return value;
  }

  /** 根据回调函数查找第一个满足条件的节点 */
  public find(predicate: (value: T, index: number) => boolean): LinkedListNode<T> | null {
    let current = this.__head;
    let idx = 0;
    while (current) {
      if (predicate(current.value, idx)) return current;
      current = current.next;
      idx++;
    }
    return null;
  }

  /** 删除第一个满足条件的节点，返回是否成功 */
  public remove(predicate: (value: T, index: number) => boolean): boolean {
    if (!this.__head) return false;

    // 删除头节点
    if (predicate(this.__head.value, 0)) {
      this.shift();
      return true;
    }

    let prev = this.__head;
    let current = this.__head.next;
    let idx = 1;
    while (current) {
      if (predicate(current.value, idx)) {
        prev.next = current.next;
        if (current === this.__tail) this.__tail = prev;
        this.__size--;
        return true;
      }
      prev = current;
      current = current.next;
      idx++;
    }
    return false;
  }

  /** 遍历所有节点；回调中新追加的节点不参与本次遍历，删除当前节点后沿原链继续 */
  public each(callback: (value: T, index: number) => void): void {
    // 锚定起始尾节点：回调中 Push 会让原尾节点的 Next 指向新节点，
    // 仅靠保存后继无法拦截，必须以起始尾节点为终点防止无限遍历
    const end = this.__tail;
    let current = this.__head;
    let idx = 0;
    while (current) {
      // 提前保存后继：Remove 当前节点（其后继被改写）后也能继续沿原链走完
      const next = current.next;
      callback(current.value, idx);
      if (current === end) break;
      current = next;
      idx++;
    }
  }

  /** 转换为普通数组 */
  public toArray(): T[] {
    const arr: T[] = [];
    this.each((v) => arr.push(v));
    return arr;
  }

  /** 返回链表的字符串表示（调试用） */
  public toString(): string {
    return this.toArray().join(' -> ');
  }

  // private

  private __head: LinkedListNode<T> | null = null;
  private __tail: LinkedListNode<T> | null = null;
  private __size = 0;
}
