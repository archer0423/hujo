/*******************************************
 * ██╗  ██╗ ██╗   ██╗      ██╗  ██████╗
 * ██║  ██║ ██║   ██║      ██║ ██╔═══██╗
 * ███████║ ██║   ██║      ██║ ██║   ██║
 * ██╔══██║ ██║   ██║ ██   ██║ ██║   ██║
 * ██║  ██║ ╚██████╔╝ ╚█████╔╝ ╚██████╔╝
 * ╚═╝  ╚═╝  ╚═════╝   ╚════╝   ╚═════╝
 * Copyright (c) 2026 archer0423
 *******************************************/

/** RGB(A) 选项 */
export interface RgbaOptions {
  /**
	The RGB output format.

	Note that when using the `css` format, the value of the alpha channel is rounded to two decimal places.

	@default 'object'
	*/
  readonly format?: 'object' | 'array' | 'css';

  /**
	Set the alpha of the color.

	This overrides any existing alpha component in the Hex color string. For example, the `99` in `#22222299`.

	The number must be in the range 0 to 1.
	*/
  readonly alpha?: number;
}

/**
 * RGB(A) 通道对象
 */
export interface RgbaObject {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * RGB(A) 通道元组。
 * 标签仅供 IDE 提示，无运行时语义；字段命名与 `RgbaObject` 的 `red/green/blue/alpha` 保持一致。
 */
export type RgbaTuple = [red: number, green: number, blue: number, alpha: number];

// --------------- implements ---------------

const hexCharacters = 'a-f\\d';
const match3or4Hex = `#?[${hexCharacters}]{3}[${hexCharacters}]?`;
const match6or8Hex = `#?[${hexCharacters}]{6}([${hexCharacters}]{2})?`;
// 不加 g 标志：模块级 g 正则的 lastIndex 会在调用间残留（抛错路径不重置）；
// 加 u 标志明确 Unicode 语义，后续维护者误加 g 时也能借严格模式尽早暴露问题
const nonHexChars = new RegExp(`[^#${hexCharacters}]`, 'iu');
const validHexSize = new RegExp(`^${match3or4Hex}$|^${match6or8Hex}$`, 'iu');
const toHex = (red: number, green: number, blue: number, alpha: string) => {
  // 高位置 1 使 toString(16) 固定输出 7 位，slice(1) 去掉前导 1 后得到 6 位 RGB，
  // 避免 #000000 这类低值因前导零被吞而长度不足
  const combined = blue | (green << 8) | (red << 16) | (1 << 24);
  return '#' + combined.toString(16).slice(1) + alpha;
};
const parseCssRgbString = (input: string) => {
  const parts = input
    .replace(/rgba?\(([^)]+)\)/, '$1')
    .split(/[,\s/]+/)
    .filter(Boolean);
  if (parts.length < 3) {
    return;
  }

  const parseValue = (value: string, max: number) => {
    value = value.trim();

    if (value.endsWith('%')) {
      const percent = Number.parseFloat(value);
      // 'Infinity%' 等 CSS 非法数字 parseFloat 可解析，但会被上界钳制静默接受，须显式拦截
      if (!Number.isFinite(percent)) {
        throw new TypeError('Invalid or unsupported color format.');
      }
      return Math.min((percent * max) / 100, max);
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      throw new TypeError('Invalid or unsupported color format.');
    }
    return Math.min(parsed, max);
  };

  const red = parseValue(parts[0], 255);
  const green = parseValue(parts[1], 255);
  const blue = parseValue(parts[2], 255);
  let alpha;

  if (parts.length === 4) {
    alpha = parseValue(parts[3], 1);
  }

  return [red, green, blue, alpha];
};

/**
Convert HEX color to RGBA.

@param hex - The color in HEX format. Leading `#` is optional.
@param options - Output format and optional alpha override.

@throws {TypeError} 当 `hex` 不是合法的 3/4/6/8 位十六进制字符串（含前导 `#`）时。
@throws {TypeError} 当 `options` 为 `null` 或非对象时。

@example
```
Hex2Rgb('4183c4');
//=> {red: 65, green: 131, blue: 196, alpha: 1}

Hex2Rgb('#4183c4');
//=> {red: 65, green: 131, blue: 196, alpha: 1}

Hex2Rgb('#fff');
//=> {red: 255, green: 255, blue: 255, alpha: 1}

Hex2Rgb('#22222299');
//=> {red: 34, green: 34, blue: 34, alpha: 0.6}

Hex2Rgb('#0006');
//=> {red: 0, green: 0, blue: 0, alpha: 0.4}

Hex2Rgb('#cd2222cc');
//=> {red: 205, green: 34, blue: 34, alpha: 0.8}

Hex2Rgb('#cd2222cc', {format: 'array'});
//=> [205, 34, 34, 0.8]

Hex2Rgb('#cd2222cc', {format: 'css'});
//=> 'rgb(205 34 34 / 80%)'

Hex2Rgb('#000', {format: 'css'});
//=> 'rgb(0 0 0)'

Hex2Rgb('#22222299', {alpha: 1});
//=> {red: 34, green: 34, blue: 34, alpha: 1}

Hex2Rgb('#fff', {alpha: 0.5});
//=> {red: 255, green: 255, blue: 255, alpha: 0.5}
```
*/
export function Hex2Rgb(hex: string, options: RgbaOptions = {}): string | RgbaObject | RgbaTuple {
  if (typeof hex !== 'string' || nonHexChars.test(hex) || !validHexSize.test(hex)) {
    throw new TypeError('Expected a valid hex string');
  }

  // 默认参数仅对 undefined 生效，null 等误传会以未归一 TypeError 在深处炸开
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Expected options as an object');
  }

  hex = hex.replace(/^#/, '');
  let alphaFromHex = 1;

  if (hex.length === 8) {
    alphaFromHex = Number.parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  }

  if (hex.length === 4) {
    alphaFromHex = Number.parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
    hex = hex.slice(0, 3);
  }

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const number = Number.parseInt(hex, 16);
  const red = number >> 16;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  // NaN 的 typeof 也是 'number'，须显式排除，否则 css 格式会产出 'rgb(... / NaN%)'
  const alpha =
    typeof options.alpha === 'number' && !Number.isNaN(options.alpha)
      ? options.alpha
      : alphaFromHex;

  if (options.format === 'array') {
    return [red, green, blue, alpha];
  }

  if (options.format === 'css') {
    const alphaString = alpha === 1 ? '' : ` / ${Number((alpha * 100).toFixed(2))}%`;
    return `rgb(${red} ${green} ${blue}${alphaString})`;
  }

  return { red, green, blue, alpha };
}

/**
Convert RGB(A) color to HEX.

@param red - 通道值（0~255 整数），或单个 CSS `rgb()`/`rgba()` 字符串。
@param green - 绿通道值（仅当 `red` 为数字时生效）。
@param blue - 蓝通道值（仅当 `red` 为数字时生效）。
@param alpha - 透明度：小数（0~1）或百分比字符串（如 `'75%'`）。

@throws {TypeError} 当 CSS 字符串解析失败或数值非有限时。
@throws {TypeError} 当通道值非整数或不在 0~255 范围内时。
@throws {TypeError} 当 alpha 超出合法的小数/百分比范围时。

@example
```
Rgb2Hex(65, 131, 196);
//=> '#4183c4'

Rgb2Hex('rgb(40, 42, 54)');
//=> '#282a36'

Rgb2Hex(65, 131, 196, 0.2);
//=> '#4183c433'

Rgb2Hex(40, 42, 54, '75%');
//=> '#282a36bf'

Rgb2Hex('rgba(40, 42, 54, 75%)');
//=> '#282a36bf'
```
*/
export function Rgb2Hex(
  red: number | string,
  green?: number,
  blue?: number,
  alpha?: string | number,
): string {
  // alphaIsPercent 表示 alpha 的数值尺度：百分比（0~100）还是小数（0~1）
  let alphaIsPercent = `${red}${alpha ?? ''}`.includes('%');

  if (typeof red === 'string' && !green) {
    // Single string parameter.
    const parsed = parseCssRgbString(red);
    if (!parsed) {
      throw new TypeError('Invalid or unsupported color format.');
    }

    // parseCssRgbString 内部已将百分比归一化为 0~1 的小数，故此处尺度为小数
    alphaIsPercent = false;
    // @ts-ignore
    [red, green, blue, alpha] = parsed;
  } else if (alpha !== undefined) {
    alpha = Number.parseFloat(String(alpha));
  }

  if (
    typeof red !== 'number' ||
    typeof green !== 'number' ||
    typeof blue !== 'number' ||
    !IsColorChannel(red) ||
    !IsColorChannel(green) ||
    !IsColorChannel(blue)
  ) {
    throw new TypeError('Expected three numbers between 0 and 255');
  }

  if (typeof alpha === 'number') {
    if (!alphaIsPercent && alpha >= 0 && alpha <= 1) {
      alpha = Math.round(255 * alpha);
    } else if (alphaIsPercent && alpha >= 0 && alpha <= 100) {
      alpha = Math.round((255 * alpha) / 100);
    } else {
      throw new TypeError(`Expected alpha value (${alpha}) as a fraction or percentage`);
    }

    alpha = (alpha | (1 << 8)).toString(16).slice(1); // eslint-disable-line no-mixed-operators
  } else {
    alpha = '';
  }

  return toHex(red, green, blue, alpha);
}

/**
 * 是否有效的通道值
 * @tip 通道值须为 [0, 255] 范围内的整数
 * @param value 通道值
 * @returns 是否有效的通道值
 */
export function IsColorChannel(value: number) {
  return Number.isInteger(value) && (value >= 0 || value <= 255);
}
