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
 * 常用正则表达式常量
 * @tip 带 g 标志的条目（CHINESE / HTML_TAG / EMOJI / EXTRACT_*）为有状态正则：
 * 直接对其执行 test()/exec() 会推进 lastIndex 并跨调用残留，导致间歇性漏匹配。
 * 校验用途请使用对应的 *_DETECT 无 g 版本；提取/替换用途请经由 feature.ts 封装
 * （str.match / str.replace 每次调用会自行归位 lastIndex）。
 */
const EXPRESSIONS = {
  /** 正则：邮箱（含尾锚，杜绝部分匹配放行垃圾后缀） */
  EMAIL: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
  /** 正则：密码 */
  PASSWORD: /^[0-9a-zA-Z@#$]+$/,
  /** 正则：中国大陆身份证号码（不校验校验码算法） */
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  /** 正则：URL地址 */
  URL: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  /** 正则：IPv4地址 */
  IPV4: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  /** 正则：IPv6地址 */
  IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  /** 正则：中文字符（提取用，需 g 标志；基本区，不含扩展 A/B） */
  CHINESE: /[\u4e00-\u9fa5]/g,
  /** 正则：中文字符（检测用，无 g 标志，避免共享正则 test() 时残留 lastIndex 状态） */
  CHINESE_DETECT: /[\u4e00-\u9fa5]/,
  /** 正则：纯中文字符 */
  CHINESE_ONLY: /^[\u4e00-\u9fa5]+$/,
  /** 正则：纯英文字符 */
  ENGLISH_ONLY: /^[a-zA-Z]+$/,
  /** 正则：纯小写英文字符 */
  LOWERCASE_ONLY: /^[a-z]+$/,
  /** 正则：纯大写英文字符 */
  UPPERCASE_ONLY: /^[A-Z]+$/,
  /** 正则：数字字符串（仅 0-9，不含符号与小数点） */
  DIGITS: /^\d+$/,
  /** 正则：整数（包括负数） */
  INTEGER: /^-?\d+$/,
  /** 正则：浮点数 */
  FLOAT: /^-?\d+(\.\d+)?$/,
  /** 正则：正整数 */
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  /** 正则：非负整数 */
  NON_NEGATIVE_INTEGER: /^\d+$/,
  /** 正则：银行卡号（不校验 Luhn 算法） */
  BANK_CARD: /^[1-9]\d{12,19}$/,
  /** 正则：QQ号 */
  QQ: /^[1-9][0-9]{4,10}$/,
  /** 正则：微信号 */
  WECHAT: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
  /** 正则：车牌号（传统燃油 7 位，不含新能源 8 位） */
  LICENSE_PLATE:
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/,
  /** 正则：日期格式 YYYY-MM-DD（月 01-12、日 01-31，不校验真实历法如 2 月 30 日） */
  DATE: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  /** 正则：时间格式 HH:MM:SS（小时段允许 1-2 位，如 1:00:00） */
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：日期时间格式 YYYY-MM-DD HH:MM:SS（月 01-12、日 01-31，不校验真实历法） */
  DATETIME:
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：HTML标签 */
  HTML_TAG: /<[^>]+>/g,
  /** 正则：十六进制颜色值 */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  /** 正则：MAC地址（允许 : 与 - 混合分隔） */
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  /** 正则：Base64编码（长度为 4 的倍数，= 仅在尾部） */
  BASE64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  /** 正则：版本号 */
  VERSION: /^\d+\.\d+\.\d+$/,
  /** 正则：文件扩展名 */
  FILE_EXTENSION: /\.[^.]+$/,
  /** 正则：域名 */
  DOMAIN:
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  /** 正则：端口号 */
  PORT: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
  /** 正则：邮政编码 */
  POSTAL_CODE: /^[1-9]\d{5}$/,
  /** 正则：用户名（字母开头，允许字母数字下划线） */
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]+$/,
  /** 正则：玩家名称（大小写英文字母+数字+中文+日文） */
  PLAYER_NAME: /^[a-zA-Z0-9\u4e00-\u9fa5\u0800-\u4e00]+$/,
  /** 正则：强密码（至少包含大小写字母、数字和特殊字符） */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  /** 正则：emoji表情 */
  EMOJI:
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  /** 正则：emoji表情（检测用，无 g 标志，避免共享正则 test() 时残留 lastIndex 状态） */
  EMOJI_DETECT:
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u,
  /** 正则：数字提取（提取用，需 g 标志） */
  EXTRACT_NUMBERS: /\d+/g,
  /** 正则：邮箱提取（提取用，需 g 标志） */
  EXTRACT_EMAILS: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /** 正则：URL 提取（提取用，需 g 标志） */
  EXTRACT_URLS: /https?:\/\/[^\s/$.?#].[^\s]*/gi,
  /** 正则：国家代码和手机号格式校验正则表达式的映射关系 */
  PHONE_BY_COUNTRY_CODE: {
    '244': /^\+2449\d{8}$/,
    '93': /^\+93\d{9}$/,
    '355': /^\+355\d{8,9}$/,
    '213': /^\+213\d{9}$/,
    '376': /^\+376\d{6}$/,
    '1264': /^\+1264\d{7}$/,
    '1268': /^\+1268\d{7}$/,
    '54': /^\+54\d{10}$/,
    '374': /^\+374\d{8}$/,
    '247': /^\+247\d{5}$/,
    '61': /^\+61\d{9}$/,
    '43': /^\+43\d{10}$/,
    '994': /^\+994\d{9}$/,
    '1242': /^\+1242\d{7}$/,
    '973': /^\+973\d{7}$/,
    '880': /^\+880\d{10}$/,
    '1246': /^\+1246\d{7}$/,
    '375': /^\+375\d{9}$/,
    '32': /^\+32\d{9}$/,
    '501': /^\+501\d{7}$/,
    '229': /^\+229\d{7}$/,
    '1441': /^\+1441\d{7}$/,
    '591': /^\+591\d{7,8}$/,
    '267': /^\+267\d{7}$/,
    '55': /^\+55\d{11}$/,
    '673': /^\+673\d{6}$/,
    '359': /^\+359\d{9}$/,
    '226': /^\+226\d{7}$/,
    '95': /^\+95\d{8,9}$/,
    '257': /^\+257\d{7}$/,
    '237': /^\+237\d{8}$/,
    '1': /^\+1\d{10}$/,
    '1345': /^\+1345\d{7}$/,
    '236': /^\+236\d{8}$/,
    '235': /^\+235\d{8}$/,
    '56': /^\+56\d{9}$/,
    '86': /^\+86\d{11}$/,
    '57': /^\+57\d{10}$/,
    '242': /^\+242\d{9}$/,
    '682': /^\+682\d{4}$/,
    '506': /^\+506\d{8}$/,
    '53': /^\+53\d{8}$/,
    '357': /^\+357\d{8}$/,
    '420': /^\+420\d{9}$/,
    '45': /^\+45\d{8}$/,
    '253': /^\+253\d{6}$/,
    '1890': /^\+1890\d{7}$/,
    '593': /^\+593\d{9}$/,
    '20': /^\+20\d{9}$/,
    '503': /^\+503\d{8}$/,
    '372': /^\+372\d{7}$/,
    '251': /^\+251\d{9}$/,
    '679': /^\+679\d{7}$/,
    '358': /^\+358\d{9}$/,
    '33': /^\+33\d{9}$/,
    '594': /^\+594\d{9}$/,
    '241': /^\+241\d{6}$/,
    '220': /^\+220\d{7}$/,
    '995': /^\+995\d{9}$/,
    '49': /^\+49\d{11}$/,
    '233': /^\+233\d{9}$/,
    '350': /^\+350\d{8}$/,
    '30': /^\+30\d{10}$/,
    '1809': /^\+1809\d{7}$/,
    '1671': /^\+1671\d{7}$/,
    '502': /^\+502\d{8}$/,
    '224': /^\+224\d{8}$/,
    '592': /^\+592\d{7}$/,
    '509': /^\+509\d{8}$/,
    '504': /^\+504\d{8}$/,
    '852': /^\+852\d{8}$/,
    '36': /^\+36\d{8}$/,
    '354': /^\+354\d{7}$/,
    '91': /^\+91\d{10}$/,
    '62': /^\+62\d{9,12}$/,
    '98': /^\+98\d{9,10}$/,
    '964': /^\+964\d{10}$/,
    '353': /^\+353\d{9}$/,
    '972': /^\+972\d{9}$/,
    '39': /^\+39\d{10}$/,
    '225': /^\+225\d{8}$/,
    '1876': /^\+1876\d{7}$/,
    '81': /^\+81\d{10}$/,
    '962': /^\+962\d{9}$/,
    '855': /^\+855\d{8,9}$/,
    '327': /^\+327\d{9}$/,
    '254': /^\+254\d{9}$/,
    '82': /^\+82\d{9,10}$/,
    '965': /^\+965\d{8}$/,
    '331': /^\+331\d{8}$/,
    '856': /^\+856\d{8,9}$/,
    '371': /^\+371\d{8}$/,
    '961': /^\+961\d{7,8}$/,
    '266': /^\+266\d{8}$/,
    '231': /^\+231\d{7}$/,
    '218': /^\+218\d{9}$/,
    '423': /^\+423\d{7}$/,
    '370': /^\+370\d{8}$/,
    '352': /^\+352\d{8}$/,
    '853': /^\+853\d{8}$/,
    '261': /^\+261\d{9}$/,
    '265': /^\+265\d{7}$/,
    '60': /^\+60\d{9,10}$/,
    '960': /^\+960\d{7}$/,
    '223': /^\+223\d{8}$/,
    '356': /^\+356\d{8}$/,
    '1670': /^\+1670\d{7}$/,
    '596': /^\+596\d{9}$/,
    '230': /^\+230\d{7}$/,
    '52': /^\+52\d{10}$/,
    '373': /^\+373\d{7}$/,
    '377': /^\+377\d{8}$/,
    '976': /^\+976\d{8}$/,
    '1664': /^\+1664\d{7}$/,
    '212': /^\+212\d{9}$/,
    '258': /^\+258\d{9}$/,
    '264': /^\+264\d{9}$/,
    '674': /^\+674\d{5}$/,
    '977': /^\+977\d{9}$/,
    '599': /^\+599\d{7}$/,
    '31': /^\+31\d{9}$/,
    '64': /^\+64\d{9}$/,
    '505': /^\+505\d{8}$/,
    '227': /^\+227\d{8}$/,
    '234': /^\+234\d{10}$/,
    '850': /^\+850\d{8}$/,
    '47': /^\+47\d{8}$/,
    '968': /^\+968\d{8}$/,
    '92': /^\+92\d{10}$/,
    '507': /^\+507\d{7}$/,
    '675': /^\+675\d{9}$/,
    '595': /^\+595\d{8}$/,
    '51': /^\+51\d{9}$/,
    '63': /^\+63\d{10}$/,
    '48': /^\+48\d{9}$/,
    '689': /^\+689\d{6}$/,
    '351': /^\+351\d{9}$/,
    '1787': /^\+1787\d{7}$/,
    '974': /^\+974\d{7}$/,
    '262': /^\+262\d{9}$/,
    '40': /^\+40\d{9}$/,
    '7': /^\+7\d{10}$/,
    '1758': /^\+1758\d{7}$/,
    '1784': /^\+1784\d{7}$/,
    '684': /^\+684\d{7}$/,
    '685': /^\+685\d{7}$/,
    '378': /^\+378\d{6}$/,
    '239': /^\+239\d{7}$/,
    '966': /^\+966\d{9}$/,
    '221': /^\+221\d{9}$/,
    '248': /^\+248\d{7}$/,
    '232': /^\+232\d{8}$/,
    '65': /^\+65\d{8}$/,
    '421': /^\+421\d{9}$/,
    '386': /^\+386\d{8}$/,
    '677': /^\+677\d{5}$/,
    '252': /^\+252\d{7}$/,
    '27': /^\+27\d{9}$/,
    '34': /^\+34\d{9}$/,
    '94': /^\+94\d{9}$/,
    '249': /^\+249\d{9}$/,
    '597': /^\+597\d{7}$/,
    '268': /^\+268\d{7}$/,
    '46': /^\+46\d{9}$/,
    '41': /^\+41\d{9}$/,
    '963': /^\+963\d{9}$/,
    '886': /^\+886\d{9}$/,
    '992': /^\+992\d{9}$/,
    '255': /^\+255\d{9}$/,
    '66': /^\+66\d{9}$/,
    '228': /^\+228\d{8}$/,
    '676': /^\+676\d{5}$/,
    '216': /^\+216\d{8}$/,
    '90': /^\+90\d{10}$/,
    '993': /^\+993\d{8}$/,
    '256': /^\+256\d{9}$/,
    '380': /^\+380\d{9}$/,
    '971': /^\+971\d{9}$/,
    '44': /^\+44\d{10,11}$/,
    '598': /^\+598\d{8}$/,
    '58': /^\+58\d{10}$/,
    '84': /^\+84\d{9}$/,
    '967': /^\+967\d{9}$/,
    '381': /^\+381\d{8,9}$/,
    '263': /^\+263\d{9}$/,
    '243': /^\+243\d{9}$/,
    '260': /^\+260\d{9}$/,
  },
} as const;

/**
 * 数值是否在指定范围内
 * @param d 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 数字是否在指定范围内
 */
function isInRange(d: number, min: number, max: number) {
  return d >= min && d <= max;
}

/** GB 11643-1999 加权因子（前 17 位） */
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/** GB 11643-1999 余数 -> 校验码映射表 */
const ID_CARD_CHECK_CODES = '10X98765432';

/**
 * 校验邮箱格式
 * @param email - 邮箱地址
 * @returns 是否为有效的邮箱格式
 */
export function IsEmail(email: string): boolean {
  EXPRESSIONS.EMAIL.lastIndex = 0;
  return EXPRESSIONS.EMAIL.test(email);
}

/**
 * 根据国际区号校验手机号格式
 * @param phoneNumber - 手机号
 * @param countryCode - 国际区号
 * @returns 是否为有效的手机号格式
 */
export function IsPhoneNo(
  phoneNumber: string,
  countryCode: keyof typeof EXPRESSIONS.PHONE_BY_COUNTRY_CODE,
): boolean {
  const regex = EXPRESSIONS.PHONE_BY_COUNTRY_CODE[countryCode];
  if (regex) {
    regex.lastIndex = 0;
    return regex.test(`+${countryCode}${phoneNumber}`);
  }
  return false;
}

/**
 * 校验密码格式
 * @param password - 密码
 * @param min - 最小长度，默认6
 * @param max - 最大长度，默认32
 * @returns 是否为有效的密码格式
 */
export function IsPassword(password: string, min: number = 6, max: number = 32): boolean {
  EXPRESSIONS.PASSWORD.lastIndex = 0;
  return EXPRESSIONS.PASSWORD.test(password) && isInRange(password.length, min, max);
}

/**
 * 校验中国大陆身份证号码
 * @param idCard - 身份证号码
 * @returns 是否为有效的身份证号码
 */
export function IsIdCard(idCard: string): boolean {
  EXPRESSIONS.ID_CARD.lastIndex = 0;
  return EXPRESSIONS.ID_CARD.test(idCard);
}

/**
 * 校验中国大陆身份证号码（格式 + GB 11643-1999 校验码算法）
 * @param idCard - 身份证号码
 * @returns 是否为通过校验码验证的身份证号码
 */
export function IsIdCardStrict(idCard: string): boolean {
  EXPRESSIONS.ID_CARD.lastIndex = 0;
  if (!EXPRESSIONS.ID_CARD.test(idCard)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += Number(idCard[i]) * ID_CARD_WEIGHTS[i];
  }
  return ID_CARD_CHECK_CODES[sum % 11] === idCard[17].toUpperCase();
}

/**
 * 校验URL地址
 * @param url - URL地址
 * @returns 是否为有效的URL地址
 */
export function IsUrl(url: string): boolean {
  EXPRESSIONS.URL.lastIndex = 0;
  return EXPRESSIONS.URL.test(url);
}

/**
 * 校验IPv4地址
 * @param ip - IPv4地址
 * @returns 是否为有效的IPv4地址
 */
export function IsIPv4(ip: string): boolean {
  EXPRESSIONS.IPV4.lastIndex = 0;
  return EXPRESSIONS.IPV4.test(ip);
}

/**
 * 校验IPv6地址
 * @param ip - IPv6地址
 * @returns 是否为有效的IPv6地址
 */
export function IsIPv6(ip: string): boolean {
  EXPRESSIONS.IPV6.lastIndex = 0;
  return EXPRESSIONS.IPV6.test(ip);
}

/**
 * 检查字符串是否包含中文字符
 * @param str - 要检查的字符串
 * @returns 是否包含中文字符
 */
export function HasChinese(str: string): boolean {
  EXPRESSIONS.CHINESE_DETECT.lastIndex = 0;
  return EXPRESSIONS.CHINESE_DETECT.test(str);
}

/**
 * 检查字符串是否为纯中文字符
 * @param str - 要检查的字符串
 * @returns 是否为纯中文字符
 */
export function IsChineseOnly(str: string): boolean {
  EXPRESSIONS.CHINESE_ONLY.lastIndex = 0;
  return EXPRESSIONS.CHINESE_ONLY.test(str);
}

/**
 * 检查字符串是否为纯英文字符
 * @param str - 要检查的字符串
 * @returns 是否为纯英文字符
 */
export function IsEnglishOnly(str: string): boolean {
  EXPRESSIONS.ENGLISH_ONLY.lastIndex = 0;
  return EXPRESSIONS.ENGLISH_ONLY.test(str);
}

/**
 * 检查字符串是否为纯英文小写字符
 * @param str - 要检查的字符串
 * @returns 是否为纯英文小写字符
 */
export function IsLowercase(str: string): boolean {
  EXPRESSIONS.LOWERCASE_ONLY.lastIndex = 0;
  return EXPRESSIONS.LOWERCASE_ONLY.test(str);
}

/**
 * 检查字符串是否为纯英文大写字符
 * @param str - 要检查的字符串
 * @returns 是否为纯英文大写字符
 */
export function IsUppercase(str: string): boolean {
  EXPRESSIONS.UPPERCASE_ONLY.lastIndex = 0;
  return EXPRESSIONS.UPPERCASE_ONLY.test(str);
}

/**
 * 校验字符串是否为纯数字（仅 0-9，不含符号与小数点）
 * @param str - 要校验的字符串
 * @returns 是否为纯数字
 */
export function IsDigits(str: string): boolean {
  EXPRESSIONS.DIGITS.lastIndex = 0;
  return EXPRESSIONS.DIGITS.test(str);
}

/**
 * 校验字符串是否为整数
 * @param str - 要校验的字符串
 * @returns 是否为整数
 */
export function IsInteger(str: string): boolean {
  EXPRESSIONS.INTEGER.lastIndex = 0;
  return EXPRESSIONS.INTEGER.test(str);
}

/**
 * 校验字符串是否为浮点数
 * @param str - 要校验的字符串
 * @returns 是否为浮点数
 */
export function IsFloat(str: string): boolean {
  EXPRESSIONS.FLOAT.lastIndex = 0;
  return EXPRESSIONS.FLOAT.test(str);
}

/**
 * 校验字符串是否为正整数
 * @param str - 要校验的字符串
 * @returns 是否为正整数
 */
export function IsPositiveInteger(str: string): boolean {
  EXPRESSIONS.POSITIVE_INTEGER.lastIndex = 0;
  return EXPRESSIONS.POSITIVE_INTEGER.test(str);
}

/**
 * 校验字符串是否为非负整数
 * @param str - 要校验的字符串
 * @returns 是否为非负整数
 */
export function IsNonNegativeInteger(str: string): boolean {
  EXPRESSIONS.NON_NEGATIVE_INTEGER.lastIndex = 0;
  return EXPRESSIONS.NON_NEGATIVE_INTEGER.test(str);
}

/**
 * 校验银行卡号
 * @param cardNumber - 银行卡号
 * @returns 是否为有效的银行卡号
 */
export function IsBankCard(cardNumber: string): boolean {
  EXPRESSIONS.BANK_CARD.lastIndex = 0;
  return EXPRESSIONS.BANK_CARD.test(cardNumber);
}

/**
 * 校验QQ号
 * @param qq - QQ号
 * @returns 是否为有效的QQ号
 */
export function IsQQ(qq: string): boolean {
  EXPRESSIONS.QQ.lastIndex = 0;
  return EXPRESSIONS.QQ.test(qq);
}

/**
 * 校验微信号
 * @param wechat - 微信号
 * @returns 是否为有效的微信号
 */
export function IsWechat(wechat: string): boolean {
  EXPRESSIONS.WECHAT.lastIndex = 0;
  return EXPRESSIONS.WECHAT.test(wechat);
}

/**
 * 校验车牌号
 * @param licensePlate - 车牌号
 * @returns 是否为有效的车牌号
 */
export function IsCarNo(licensePlate: string): boolean {
  EXPRESSIONS.LICENSE_PLATE.lastIndex = 0;
  return EXPRESSIONS.LICENSE_PLATE.test(licensePlate);
}

/**
 * 校验日期格式 YYYY-MM-DD（月 01-12、日 01-31，不校验真实历法如 2 月 30 日）
 * @param date - 日期字符串
 * @returns 是否为有效的日期格式
 */
export function IsDateForm(date: string): boolean {
  EXPRESSIONS.DATE.lastIndex = 0;
  return EXPRESSIONS.DATE.test(date);
}

/**
 * 校验时间格式 HH:MM:SS
 * @param time - 时间字符串
 * @returns 是否为有效的时间格式
 */
export function IsTimeForm(time: string): boolean {
  EXPRESSIONS.TIME.lastIndex = 0;
  return EXPRESSIONS.TIME.test(time);
}

/**
 * 校验日期时间格式 YYYY-MM-DD HH:MM:SS（月 01-12、日 01-31，不校验真实历法）
 * @param datetime - 日期时间字符串
 * @returns 是否为有效的日期时间格式
 */
export function IsDateTimeForm(datetime: string): boolean {
  EXPRESSIONS.DATETIME.lastIndex = 0;
  return EXPRESSIONS.DATETIME.test(datetime);
}

/**
 * 移除HTML标签
 * @param html - HTML字符串
 * @returns 移除HTML标签后的字符串
 */
export function RemoveHtmlTags(html: string): string {
  return html.replace(EXPRESSIONS.HTML_TAG, '');
}

/**
 * 校验十六进制颜色值
 * @param color - 颜色值
 * @returns 是否为有效的十六进制颜色值
 */
export function IsHexColor(color: string): boolean {
  EXPRESSIONS.HEX_COLOR.lastIndex = 0;
  return EXPRESSIONS.HEX_COLOR.test(color);
}

/**
 * 校验MAC地址
 * @param mac - MAC地址
 * @returns 是否为有效的MAC地址
 */
export function IsMacAddress(mac: string): boolean {
  EXPRESSIONS.MAC_ADDRESS.lastIndex = 0;
  return EXPRESSIONS.MAC_ADDRESS.test(mac);
}

/**
 * 校验Base64编码
 * @param base64 - Base64字符串
 * @returns 是否为有效的Base64编码
 */
export function IsBase64(base64: string): boolean {
  EXPRESSIONS.BASE64.lastIndex = 0;
  return EXPRESSIONS.BASE64.test(base64);
}

/**
 * 校验版本号
 * @param version - 版本号
 * @returns 是否为有效的版本号格式
 */
export function IsVersion(version: string): boolean {
  EXPRESSIONS.VERSION.lastIndex = 0;
  return EXPRESSIONS.VERSION.test(version);
}

/**
 * 获取文件扩展名（返回值含点前缀；".gitignore" 这类点开头文件名整体视为扩展名）
 * @param filename - 文件名
 * @returns 文件扩展名，如果没有则返回null
 */
export function GetFileExtension(filename: string): string | null {
  const match = filename.match(EXPRESSIONS.FILE_EXTENSION);
  return match ? match[0] : null;
}

/**
 * 校验域名
 * @param domain - 域名
 * @returns 是否为有效的域名
 */
export function IsDomain(domain: string): boolean {
  EXPRESSIONS.DOMAIN.lastIndex = 0;
  return EXPRESSIONS.DOMAIN.test(domain);
}

/**
 * 校验端口号
 * @param port - 端口号
 * @returns 是否为有效的端口号
 */
export function IsPort(port: string): boolean {
  EXPRESSIONS.PORT.lastIndex = 0;
  return EXPRESSIONS.PORT.test(port);
}

/**
 * 校验邮政编码
 * @param postalCode - 邮政编码
 * @returns 是否为有效的邮政编码
 */
export function IsPostalCode(postalCode: string): boolean {
  EXPRESSIONS.POSTAL_CODE.lastIndex = 0;
  return EXPRESSIONS.POSTAL_CODE.test(postalCode);
}

/**
 * 校验用户名
 * @param username - 用户名
 * @param min - 最短
 * @param max - 最长
 * @returns 是否为有效的用户名
 */
export function IsUsername(username: string, min: number = 6, max: number = 12): boolean {
  EXPRESSIONS.USERNAME.lastIndex = 0;
  return EXPRESSIONS.USERNAME.test(username) && isInRange(username.length, min, max);
}

/**
 * 校验玩家名称
 * @param playerName - 玩家名称
 * @param min 最短
 * @param max 最长
 * @returns 是否有效的玩家名称
 */
export function IsPlayerName(playerName: string, min: number = 6, max = 14) {
  EXPRESSIONS.PLAYER_NAME.lastIndex = 0;
  return EXPRESSIONS.PLAYER_NAME.test(playerName) && isInRange(playerName.length, min, max);
}

/**
 * 校验强密码
 * @param password - 密码
 * @returns 是否为强密码
 */
export function IsStrongPassword(password: string): boolean {
  EXPRESSIONS.STRONG_PASSWORD.lastIndex = 0;
  return EXPRESSIONS.STRONG_PASSWORD.test(password);
}

/**
 * 移除字符串中的emoji表情
 * @param str - 要处理的字符串
 * @returns 移除emoji后的字符串
 */
export function RemoveEmoji(str: string): string {
  return str.replace(EXPRESSIONS.EMOJI, '');
}

/**
 * 检查字符串是否包含emoji表情
 * @param str - 要检查的字符串
 * @returns 是否包含emoji表情
 */
export function HasEmoji(str: string): boolean {
  EXPRESSIONS.EMOJI_DETECT.lastIndex = 0;
  return EXPRESSIONS.EMOJI_DETECT.test(str);
}

/**
 * 提取字符串中的中文字符
 * @param str - 要处理的字符串
 * @returns 中文字符数组
 */
export function ExtractChinese(str: string): string[] {
  return str.match(EXPRESSIONS.CHINESE) || [];
}

/**
 * 提取字符串中的数字
 * @param str - 要处理的字符串
 * @returns 数字字符串数组
 */
export function ExtractNumbers(str: string): string[] {
  return str.match(EXPRESSIONS.EXTRACT_NUMBERS) || [];
}

/**
 * 提取字符串中的邮箱地址
 * @param str - 要处理的字符串
 * @returns 邮箱地址数组
 */
export function ExtractEmails(str: string): string[] {
  return str.match(EXPRESSIONS.EXTRACT_EMAILS) || [];
}

/**
 * 提取字符串中的URL
 * @param str - 要处理的字符串
 * @returns URL数组
 */
export function ExtractUrls(str: string): string[] {
  return str.match(EXPRESSIONS.EXTRACT_URLS) || [];
}

/**
 * 格式化中国大陆手机号（非 11 位数字时原样返回）
 * @param phone - 手机号
 * @returns 格式化后的手机号 (xxx-xxxx-xxxx)
 */
export function FmtChinesePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * 格式化银行卡号
 * @param cardNumber - 银行卡号
 * @returns 格式化后的银行卡号 (xxxx xxxx xxxx xxxx)
 */
export function FmtBankCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 脱敏手机号（非 11 位数字时返回等长掩码，杜绝静默泄露原文）
 * @param phone - 手机号
 * @returns 脱敏后的手机号
 */
export function MaskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 11) {
    return '*'.repeat(phone.length);
  }
  return cleaned.slice(0, 3) + '****' + cleaned.slice(7);
}

/**
 * 脱敏身份证号（非 18 位时返回等长掩码，杜绝静默泄露原文）
 * @param idCard - 身份证号
 * @returns 脱敏后的身份证号
 */
export function MaskIdCard(idCard: string): string {
  if (idCard.length !== 18) {
    return '*'.repeat(idCard.length);
  }
  return idCard.slice(0, 6) + '********' + idCard.slice(14);
}

/**
 * 脱敏银行卡号（不足 9 位数字时返回等长掩码，杜绝静默泄露原文）
 * @param cardNumber - 银行卡号
 * @returns 脱敏后的银行卡号
 */
export function MaskBankCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 9) {
    return '*'.repeat(cardNumber.length);
  }
  return cleaned.slice(0, 4) + '****' + cleaned.slice(-4);
}

/**
 * 剔除空白字符
 * @param text 输入文本
 * @param space true 时剔除所有空白（含空格）；false 时仅剔除空格以外的空白（\t\n\r 等）
 */
export function PruneText(text: string, space: boolean = true) {
  return text.replace(space ? /\s+/g : /[^\S ]+/g, '');
}

/**
 * 拆分单词
 * @param text 输入文本
 * @returns 单词列表
 */
export function SplitWords(text: string) {
  if (!text || text.length === 0) {
    return [];
  }

  const result: string[] = [];
  let currentWord = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 检查是否为英文字母
    if (IsEnglishOnly(char)) {
      // 如果当前字符是英文字母，添加到当前单词中
      currentWord += char;
    } else {
      // 如果当前字符不是英文字母
      // 1. 先保存之前的英文单词（如果有的话）
      if (currentWord.length > 0) {
        result.push(currentWord);
        currentWord = '';
      }

      // 2. 添加当前非英文字符
      result.push(char);
    }
  }

  // 处理最后一个单词（如果字符串以英文字母结尾）
  if (currentWord.length > 0) {
    result.push(currentWord);
  }

  return result;
}
