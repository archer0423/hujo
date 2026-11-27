/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Label } from 'cc';

/**
 * 观察宿主数据变化
 * @param host 宿主
 * @param listener 监听器
 * @returns
 */
export function Watch<H extends object>(host: H, listener: (p: PropertyKey, v: any) => void) {
  return new Proxy(host, {
    set(target, p, newValue) {
      // @ts-ignore
      if (target[p] === newValue) {
        return false;
      }
      // @ts-ignore
      target[p] = newValue;
      listener(p, newValue);
      return true;
    },
  });
}

/**
 * 观察宿主属性数据变化
 * @param host 宿主
 * @param property 属性
 * @param listener 监听器
 * @returns
 */
export function WatchProperty<H extends object>(
  host: H,
  property: keyof H,
  listener: (v: any) => void,
) {
  return Watch(host, (p, v) => {
    if (p === property) {
      listener(v);
    }
  });
}

/**
 * 主从属性变化映射
 * @param host 宿主
 * @param salve 从属
 * @param mappings 主从属性映射
 * @returns
 */
export function WatchMapping(
  master: object,
  salve: object,
  mappings: Record<PropertyKey, PropertyKey>,
) {
  return Watch(master, (p, v) => {
    // @ts-ignore
    if (typeof salve[mappings[p]] !== 'undefined') {
      // @ts-ignore
      salve[mappings[p]] = v;
    }
  });
}

/**
 * 观察宿主指定文本属性内容变化
 * @param master 宿主
 * @param salve 从属
 * @param property （宿主）属性
 * @returns
 */
export function WatchText(master: object, salve: Label, property: string) {
  return WatchMapping(master, salve, { [property]: 'string' });
}
