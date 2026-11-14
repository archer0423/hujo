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

/** 操作系统原始值 */
export type OSValue = string;

/** 平台原始值 */
export type PlatformValue = string;

/** 浏览器原始值 */
export type BrowserValue = string;

/** 网络类型原始值 */
export type NetworkValue = number;

/** 系统语言枚举值 */
export type LanguageValue = string;

/** 系统语言 ISO 代码，例如 zh-CN、en-US */
export type LanguageCode = string;

/* 操作系统 */
const _OS = sys.os;
export const OS = Object.freeze({
  VALUE: _OS as OSValue,
  VERSION: sys.osVersion,
  MAIN_VERSION: sys.osMainVersion,
  UNKNOWN: _OS === sys.OS.UNKNOWN,
  IOS: _OS === sys.OS.IOS,
  ANDROID: _OS === sys.OS.ANDROID,
  WINDOWS: _OS === sys.OS.WINDOWS,
  LINUX: _OS === sys.OS.LINUX,
  OSX: _OS === sys.OS.OSX,
  OHOS: _OS === sys.OS.OHOS,
  OPENHARMONY: _OS === sys.OS.OPENHARMONY,
} as const);

/* 平台 */
const _PLATFORM = sys.platform;
export const PLATFORM = Object.freeze({
  VALUE: _PLATFORM as PlatformValue,
  UNKNOWN: _PLATFORM === sys.Platform.UNKNOWN,
  EDITOR_PAGE: _PLATFORM === sys.Platform.EDITOR_PAGE,
  EDITOR_CORE: _PLATFORM === sys.Platform.EDITOR_CORE,
  MOBILE_BROWSER: _PLATFORM === sys.Platform.MOBILE_BROWSER,
  DESKTOP_BROWSER: _PLATFORM === sys.Platform.DESKTOP_BROWSER,
  WIN32: _PLATFORM === sys.Platform.WIN32,
  ANDROID: _PLATFORM === sys.Platform.ANDROID,
  IOS: _PLATFORM === sys.Platform.IOS,
  MACOS: _PLATFORM === sys.Platform.MACOS,
  OHOS: _PLATFORM === sys.Platform.OHOS,
  OPENHARMONY: _PLATFORM === sys.Platform.OPENHARMONY,
  WECHAT_GAME: _PLATFORM === sys.Platform.WECHAT_GAME,
  WECHAT_MINI_PROGRAM: _PLATFORM === sys.Platform.WECHAT_MINI_PROGRAM,
  XIAOMI_QUICK_GAME: _PLATFORM === sys.Platform.XIAOMI_QUICK_GAME,
  ALIPAY_MINI_GAME: _PLATFORM === sys.Platform.ALIPAY_MINI_GAME,
  TAOBAO_CREATIVE_APP: _PLATFORM === sys.Platform.TAOBAO_CREATIVE_APP,
  TAOBAO_MINI_GAME: _PLATFORM === sys.Platform.TAOBAO_MINI_GAME,
  BYTEDANCE_MINI_GAME: _PLATFORM === sys.Platform.BYTEDANCE_MINI_GAME,
  OPPO_MINI_GAME: _PLATFORM === sys.Platform.OPPO_MINI_GAME,
  VIVO_MINI_GAME: _PLATFORM === sys.Platform.VIVO_MINI_GAME,
  HUAWEI_QUICK_GAME: _PLATFORM === sys.Platform.HUAWEI_QUICK_GAME,
  MIGU_MINI_GAME: _PLATFORM === sys.Platform.MIGU_MINI_GAME,
  HONOR_MINI_GAME: _PLATFORM === sys.Platform.HONOR_MINI_GAME,
} as const);

/** 浏览器 */
const _BROWSER = sys.browserType;
export const BROWSER = Object.freeze({
  VALUE: _BROWSER as BrowserValue,
  VERSION: sys.browserVersion,
  UNKNOWN: _BROWSER === sys.BrowserType.UNKNOWN,
  WECHAT: _BROWSER === sys.BrowserType.WECHAT,
  ANDROID: _BROWSER === sys.BrowserType.ANDROID,
  IE: _BROWSER === sys.BrowserType.IE,
  EDGE: _BROWSER === sys.BrowserType.EDGE,
  QQ: _BROWSER === sys.BrowserType.QQ,
  MOBILE_QQ: _BROWSER === sys.BrowserType.MOBILE_QQ,
  UC: _BROWSER === sys.BrowserType.UC,
  UCBS: _BROWSER === sys.BrowserType.UCBS,
  BROWSER_360: _BROWSER === sys.BrowserType.BROWSER_360,
  BAIDU_APP: _BROWSER === sys.BrowserType.BAIDU_APP,
  BAIDU: _BROWSER === sys.BrowserType.BAIDU,
  MAXTHON: _BROWSER === sys.BrowserType.MAXTHON,
  OPERA: _BROWSER === sys.BrowserType.OPERA,
  OUPENG: _BROWSER === sys.BrowserType.OUPENG,
  MIUI: _BROWSER === sys.BrowserType.MIUI,
  FIREFOX: _BROWSER === sys.BrowserType.FIREFOX,
  SAFARI: _BROWSER === sys.BrowserType.SAFARI,
  CHROME: _BROWSER === sys.BrowserType.CHROME,
  LIEBAO: _BROWSER === sys.BrowserType.LIEBAO,
  QZONE: _BROWSER === sys.BrowserType.QZONE,
  SOUGOU: _BROWSER === sys.BrowserType.SOUGOU,
  HUAWEI: _BROWSER === sys.BrowserType.HUAWEI,
} as const);

/** 网络类型 */
const GET_NETWORK_TYPE = function () {
  return sys.getNetworkType();
};
export const NETWORK = Object.freeze({
  get VALUE(): NetworkValue {
    return GET_NETWORK_TYPE() as NetworkValue;
  },
  get NONE() {
    return GET_NETWORK_TYPE() === sys.NetworkType.NONE;
  },
  get LAN() {
    return GET_NETWORK_TYPE() === sys.NetworkType.LAN;
  },
  get WWAN() {
    return GET_NETWORK_TYPE() === sys.NetworkType.WWAN;
  },
} as const);

/** 系统语言 */
const _LANGUAGE = sys.language;
export const LANGUAGE = Object.freeze({
  VALUE: _LANGUAGE as LanguageValue,
  CODE: sys.languageCode as LanguageCode,
  UNKNOWN: _LANGUAGE === sys.Language.UNKNOWN,
  ENGLISH: _LANGUAGE === sys.Language.ENGLISH,
  CHINESE: _LANGUAGE === sys.Language.CHINESE,
  FRENCH: _LANGUAGE === sys.Language.FRENCH,
  ITALIAN: _LANGUAGE === sys.Language.ITALIAN,
  GERMAN: _LANGUAGE === sys.Language.GERMAN,
  SPANISH: _LANGUAGE === sys.Language.SPANISH,
  DUTCH: _LANGUAGE === sys.Language.DUTCH,
  RUSSIAN: _LANGUAGE === sys.Language.RUSSIAN,
  KOREAN: _LANGUAGE === sys.Language.KOREAN,
  JAPANESE: _LANGUAGE === sys.Language.JAPANESE,
  HUNGARIAN: _LANGUAGE === sys.Language.HUNGARIAN,
  PORTUGUESE: _LANGUAGE === sys.Language.PORTUGUESE,
  ARABIC: _LANGUAGE === sys.Language.ARABIC,
  NORWEGIAN: _LANGUAGE === sys.Language.NORWEGIAN,
  POLISH: _LANGUAGE === sys.Language.POLISH,
  TURKISH: _LANGUAGE === sys.Language.TURKISH,
  UKRAINIAN: _LANGUAGE === sys.Language.UKRAINIAN,
  ROMANIAN: _LANGUAGE === sys.Language.ROMANIAN,
  BULGARIAN: _LANGUAGE === sys.Language.BULGARIAN,
  HINDI: _LANGUAGE === sys.Language.HINDI,
} as const);

/** 平台相关的特性 */
export const FEATURE = Object.freeze({
  WEBP: sys.hasFeature(sys.Feature.WEBP),
  IMAGE_BITMAP: sys.hasFeature(sys.Feature.IMAGE_BITMAP),
  WEB_VIEW: sys.hasFeature(sys.Feature.WEB_VIEW),
  VIDEO_PLAYER: sys.hasFeature(sys.Feature.VIDEO_PLAYER),
  SAFE_AREA: sys.hasFeature(sys.Feature.SAFE_AREA),
  HPE: sys.hasFeature(sys.Feature.HPE),
  INPUT_TOUCH: sys.hasFeature(sys.Feature.INPUT_TOUCH),
  EVENT_KEYBOARD: sys.hasFeature(sys.Feature.EVENT_KEYBOARD),
  EVENT_MOUSE: sys.hasFeature(sys.Feature.EVENT_MOUSE),
  EVENT_TOUCH: sys.hasFeature(sys.Feature.EVENT_TOUCH),
  EVENT_ACCELEROMETER: sys.hasFeature(sys.Feature.EVENT_ACCELEROMETER),
  EVENT_GAMEPAD: sys.hasFeature(sys.Feature.EVENT_GAMEPAD),
  EVENT_HANDLE: sys.hasFeature(sys.Feature.EVENT_HANDLE),
  EVENT_HMD: sys.hasFeature(sys.Feature.EVENT_HMD),
  EVENT_HANDHELD: sys.hasFeature(sys.Feature.EVENT_HANDHELD),
  WASM: sys.hasFeature(sys.Feature.WASM),
} as const);

/** 杂项 */
export const MISC = Object.freeze({
  LITTLE_ENDIAN: sys.isLittleEndian,
  NATIVE: sys.isNative,
  MOBILE: sys.isMobile,
  BROWSER: sys.isBrowser,
  XR: sys.isXR,
} as const);
