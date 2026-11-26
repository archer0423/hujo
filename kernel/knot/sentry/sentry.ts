/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { sys } from 'cc';

import { Knot } from '../../core/knot';
import { Now } from '../../skill/datetime';
import { OS } from '../../skill/env';
import { HashFNV1a } from '../../skill/literal';
import { AccessApi } from '../access';
import {
  SentryApi,
  SentryErrorType,
  SentryListener,
  SentryOptions,
  SentryStats,
} from './sentry.typings';

/**
 * 哨兵结点
 * - 捕获全局 JavaScript 错误
 * - 捕获未处理的 Promise 拒绝
 */
export class Sentry extends Knot<SentryOptions> implements SentryApi {
  // public

  declare public readonly access: AccessApi;

  public constructor() {
    super();
    this.__signatures = new Set();
    this.__stats = {
      total: 0,
      javascript: 0,
      promise: 0,
      native: 0,
    };
  }

  public get trait(): string {
    return 'sentry';
  }

  public override get deps(): string[] {
    return ['access'];
  }

  public get stats() {
    return { ...this.__stats };
  }

  // protected

  protected _attach(): Promise<boolean> {
    this.options.reportJavascript ??= true;
    this.options.reportPromise ??= true;
    this.options.reportNative ??= true;

    if (typeof globalThis.addEventListener === 'function') {
      const addEventListener = globalThis.addEventListener.bind(globalThis);
      // 注册全局错误处理器和 Promise 拒绝处理器
      this.__jsErrorHandler = this.__handleJavascriptError.bind(this);
      this.__promiseErrorHandler = this.__handlePromiseError.bind(this);
      addEventListener('error', this.__jsErrorHandler as SentryListener);
      addEventListener('unhandledrejection', this.__promiseErrorHandler as SentryListener);
    }

    if (sys.isNative) {
      const global = this.access.global;
      const legacy = global.get('__errorHandler') as typeof this.__nativeErrorHandler;
      if (typeof legacy === 'function') {
        if (global.set('__errorHandler', this.__handleNativeError.bind(this))) {
          this.__nativeErrorHandler = undefined;
          this.logger.warn('原生错误处理器写入失败，原生捕获未生效');
        } else {
          this.__nativeErrorHandler = legacy;
        }
      }
    }

    return Promise.resolve(true);
  }

  protected _detach(): Promise<boolean> {
    if (typeof globalThis.addEventListener === 'function') {
      const removeEventListener = globalThis.removeEventListener.bind(globalThis);
      removeEventListener('error', this.__jsErrorHandler as SentryListener);
      removeEventListener('unhandledrejection', this.__promiseErrorHandler as SentryListener);
      this.__jsErrorHandler = undefined;
      this.__promiseErrorHandler = undefined;
    }

    if (sys.isNative) {
      const global = this.access.global;
      if (global.delete('__errorHandler')) {
        this.__nativeErrorHandler = undefined;
      }
    }

    this.__signatures.clear();

    return Promise.resolve(true);
  }

  // private

  /** 统计信息 */
  private __stats: SentryStats;
  /** 去重签名表 */
  private __signatures: Set<string>;
  /** JavaScript 错误处理器 */
  private __jsErrorHandler?: (this: Window, event: ErrorEvent) => unknown;
  /** Promise 拒绝处理器 */
  private __promiseErrorHandler?: (event: PromiseRejectionEvent) => unknown;
  /** 原生错误处理器 */
  private __nativeErrorHandler?: (name: string, line: number, msg: string, stack: string) => void;

  /** 处理 javascript 错误 */
  private __handleJavascriptError(event: ErrorEvent) {
    this.stats.javascript++;
    this.stats.total++;

    this.__report(SentryErrorType.JavaScript, {
      type: SentryErrorType.JavaScript,
      message: event.message || 'unknown error',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  /** 处理 promise 错误 */
  private __handlePromiseError(event: PromiseRejectionEvent) {
    this.__stats.total++;
    this.__stats.promise++;

    const { reason } = event;

    let message: string;
    let stack: string | undefined;

    if (reason instanceof Error) {
      const { message: _message, stack: _stack } = reason;
      message = _message;
      stack = _stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = this.__normalizeReason(reason);
      stack = this.__normalizeStack(reason);
    }

    this.__report(SentryErrorType.Promise, {
      type: SentryErrorType.Promise,
      message: message,
      stack: stack,
    });
  }

  /** 处理原生错误 */
  private __handleNativeError(name: string, line: number, msg: string, stack: string) {
    this.__stats.total++;
    this.__stats.native++;

    this.__nativeErrorHandler?.(name, line, msg, stack);
    this.__report(SentryErrorType.Native, {
      type: SentryErrorType.Native,
      message: msg,
      filename: name,
      lineno: line,
      stack: stack,
    });
  }

  /** 上报数据 */
  private __report(type: SentryErrorType, payload: Record<string, unknown>) {
    payload.timestamp = Now();
    payload.device = { os: OS, ...(this.options.device ?? {}) };

    const hash = HashFNV1a(`${payload.type}|${payload.message}|${payload.stack ?? ''}`);
    if (!this.__signatures.has(hash)) {
      this.__signatures.add(hash);

      const text = JSON.stringify(payload);
      if (
        this.options.report &&
        ((type === SentryErrorType.JavaScript && this.options.reportJavascript) ||
          (type === SentryErrorType.Promise && this.options.reportPromise) ||
          (type === SentryErrorType.Native && this.options.reportNative))
      ) {
        this.options.report(text);
      }
    }
  }

  /**
   * 安全序列化拒绝原因
   * @tip String(reason) 可因 toPrimitive/toString 抛出异常（异常将从事件监听器逃逸，
   * 造成计数与转发不一致）；普通对象还会退化为无信息量的 '[object Object]'。
   * 故逐级回退：message 属性 → String → JSON.stringify → Object.prototype.toString
   */
  private __normalizeReason(reason: unknown): string {
    // 跨 realm Error 实例 / 自带 message 的对象，优先提取 message
    if (reason !== null && typeof reason === 'object') {
      try {
        const { message } = reason as { message?: unknown };
        if (typeof message === 'string' && message.length > 0) {
          return message;
        }
      } catch (e) {
        // message 读取器抛错，走后续回退
      }
    }
    // String 可抛（toPrimitive/toString）；结果为 '[object Object]' 时无信息量
    try {
      const text = String(reason);
      if (text !== '[object Object]') {
        return text;
      }
    } catch (e) {
      // 忽略，走后续回退
    }
    // JSON 可抛（循环引用 / toJSON 抛错）
    try {
      const json = JSON.stringify(reason);
      if (typeof json === 'string') {
        return json;
      }
    } catch (e) {
      // 忽略，走末级回退
    }
    return Object.prototype.toString.call(reason);
  }

  /**
   * 提取 Error 形态对象的堆栈
   * @tip 跨 realm Error 实例不是 instanceof Error，其 message/stack 属性原样可取
   */
  private __normalizeStack(reason: unknown): string | undefined {
    if (reason !== null && typeof reason === 'object') {
      try {
        const { stack } = reason as { stack?: unknown };
        if (typeof stack === 'string') {
          return stack;
        }
      } catch (e) {
        // stack 读取器抛错，保持 undefined
      }
    }
    return undefined;
  }
}
