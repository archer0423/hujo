/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

import { Dict } from './dict';

/**
 * 转换为查询字符串
 * @tip 仅处理自有可枚举字符串键（symbol 不参与）；
 *      仅处理 boolean/number/string；
 *      键与值均经 URL 编码（孤立代理项替换为 U+FFFD）
 * @param d 字典
 */
export function EncodeQueryString(d: Dict) {
  return Object.entries(d)
    .filter(([, value]) => {
      const type = typeof value;
      return (
        (type === 'number' && Number.isFinite(value)) || type === 'string' || type === 'boolean'
      );
    })
    .map(([key, value]) => `${EncodeURI(key)}=${EncodeURI(String(value))}`)
    .join('&');
}

/** 安全编码：encodeURIComponent 对孤立代理项会抛 URIError，降级为替换 U+FFFD 后重试 */
export function EncodeURI(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    return encodeURIComponent(value.replace(/[\uD800-\uDFFF]/g, '\uFFFD'));
  }
}

/** 操作剪切板超时时间预设 */
const CLIPBOARD_TIMEOUT_MS = 5000;

function IsBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function ensureBrowser(api: string): void {
  if (!IsBrowser()) {
    throw new Error(`${api} 仅浏览器环境可用`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 超时（${ms}ms）`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** 网页重载（仅浏览器环境可用） */
export function ReloadPage(): void {
  ensureBrowser('ReloadPage');
  window.location.reload();
}

/**
 * execCommand 复制兼容方案
 * @tip 借助临时 textarea 选中后触发复制
 */
function legacyCopy(text: string): boolean {
  // body 未解析完成（如 head 内同步调用）时无法挂载临时节点
  if (!document.body) {
    return false;
  }
  // 保存焦点：复制完成后还原，避免抢占页面原有焦点（如输入框）
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // 只读，避免移动端弹出软键盘
  textarea.setAttribute('readonly', '');
  // fixed + 视口顶部避免触发页面滚动，透明避免闪现
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  let ok = false;
  try {
    document.body.appendChild(textarea);
    textarea.focus();
    // 部分移动端（iOS）仅 select() 无效，需显式选中区间
    textarea.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    if (textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
    // 还原焦点：仅对仍挂载在文档中的元素有效
    if (active && active.isConnected) {
      active.focus();
    }
  }
  return ok;
}

/**
 * 复制到剪切板
 * @tip 仅浏览器环境可用（原生 / 小游戏环境无 window / document，调用会抛错）
 * @tip 优先使用现代异步 API（需 https / localhost 安全上下文），
 * @tip 不可用或失败时回退 execCommand 兼容方案（适用 http 页面）
 * @param text 要复制的文本
 * @returns 是否复制成功
 */
export async function CopyToClipboard(text: string): Promise<boolean> {
  ensureBrowser('CopyToClipboard');
  // 现代异步 API：按方法级存在性检查（部分浏览器 clipboard 对象存在但缺方法）
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await withTimeout(
        navigator.clipboard.writeText(text),
        CLIPBOARD_TIMEOUT_MS,
        'Clipboard.writeText',
      );
      return true;
    } catch {
      // 权限被拒、页面失焦、超时等，回退旧方案再试一次
    }
  }
  return legacyCopy(text);
}

/**
 * 从剪切板取出内容
 * @tip 仅浏览器环境可用（原生 / 小游戏环境无 window / document，调用会抛错）
 * @tip 需安全上下文且通常需用户手势触发（如点击）
 * @tip Firefox 等浏览器可能不支持，失败时 Promise 拒绝
 * @returns 剪切板中的文本
 */
async function getTextFromClipboard(): Promise<string> {
  ensureBrowser('GetTextFromClipboard');
  if (!navigator.clipboard?.readText) {
    throw new Error('Clipboard API is unavailable (requires a secure context)');
  }
  return withTimeout(navigator.clipboard.readText(), CLIPBOARD_TIMEOUT_MS, 'Clipboard.readText');
}

/**
 * 从剪切板取出内容（失败时返回 null，便于业务侧简化判空）
 */
export async function GetTextFromClipboard(): Promise<string | null> {
  try {
    return await getTextFromClipboard();
  } catch {
    return null;
  }
}

/** 解析查询参数 */
function parseParams(url: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(url.replace(/^[#?]+/, '')));
}

/**
 * 获取查询参数
 * @tip 仅浏览器环境可用（原生 / 小游戏环境无 window，调用会抛错）
 * @tip 解析当前页面 URL 的查询串（location.search，不含 hash 段内的参数），值经 URL 解码；
 *      同名键取最后一个，无值键记为空串
 * @returns 查询参数键值表（如 '?a=1&b=%20x' => { a: '1', b: ' x' }）
 */
export function GetQueryString(): Record<string, string> {
  ensureBrowser('GetQueryString');
  return parseParams(window.location.search);
}

/**
 * 解析当前页面 hash 中的查询参数
 */
export function GetHashParams(): Record<string, string> {
  ensureBrowser('GetHashParams');
  return parseParams(window.location.hash);
}

/**
 * 合并解析查询参数（可选包含 hash 段参数，同名键后者覆盖前者）
 */
export function GetQueryParams(includeHash: boolean = false): Record<string, string> {
  ensureBrowser('GetQueryParams');
  const result = parseParams(window.location.search);
  if (includeHash) {
    Object.assign(result, parseParams(window.location.hash));
  }
  return result;
}

/**
 * 获取所有同名查询参数（保留数组形式）
 */
export function GetQueryStringAll(): Record<string, string[]> {
  ensureBrowser('GetQueryStringAll');
  const result: Record<string, string[]> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (!result[key]) result[key] = [];
    result[key].push(value);
  });
  return result;
}
