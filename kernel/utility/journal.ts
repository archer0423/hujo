/** 日志分级 */
export enum JournalLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Disable = 99,
}

/** 日志分级映射 */
export enum JournalLevelLiteral {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Disable = 'disable',
}

/** 分级句柄 */
const JOURNAL_METHODS = {
  [JournalLevel.Debug]: console.log,
  [JournalLevel.Info]: console.info,
  [JournalLevel.Warn]: console.warn,
  [JournalLevel.Error]: console.error,
  [JournalLevel.Disable]: function () {},
};

/** 分级样式：标记与颜色 */
export type JournalLevelStyle = [
  /** 分级标记，输出于日志头部，如 "[Debug]" */
  label: string,
  /** 分级颜色，支持任意 CSS 颜色值；留空表示不着色 */
  color: string,
];

/** 分级样式表 */
export type JournalLevelStyles = Record<JournalLevelLiteral, JournalLevelStyle>;

/** 日志记录器 */
class JournalLogger {
  // public

  /**
   * 构造
   * @param trait 标识
   * @param journal 日志管理器
   * @param level 初始分级
   */
  public constructor(
    public readonly trait: string,
    journal: Journal,
    level: JournalLevel,
  ) {
    this.__journal = journal;
    this.__level = level;
  }

  /**
   * 输出调试日志
   * @param title 标题
   * @param args 入参
   */
  public debug(title: string, ...args: unknown[]) {
    this.__log(JournalLevel.Debug, title, ...args);
  }

  /**
   * 输出信息日志
   * @param title 标题
   * @param args 入参
   */
  public info(title: string, ...args: unknown[]) {
    this.__log(JournalLevel.Info, title, ...args);
  }

  /**
   * 输出警告日志
   * @param title 标题
   * @param args 入参
   */
  public warn(title: string, ...args: unknown[]) {
    this.__log(JournalLevel.Warn, title, ...args);
  }

  /**
   * 输出错误日志
   * @param title 标题
   * @param args 入参
   */
  public error(title: string, ...args: unknown[]) {
    this.__log(JournalLevel.Error, title, ...args);
  }

  // private

  /** 日志管理器 */
  private __journal: Journal;
  /** 当前分级 */
  private __level: JournalLevel;

  /**
   * 输出日志
   * @param outputLevel 输出分级
   * @param title 标题
   * @param args 入参
   * @returns
   */
  private __log(outputLevel: JournalLevel, title: string, ...args: unknown[]) {
    if (outputLevel === JournalLevel.Disable) return;
    if (outputLevel < this.__level) return;
    if (this.__journal.muted) return;

    const method = JOURNAL_METHODS[outputLevel];
    if (this.__journal.colorful) {
      const [label, color] = this.__journal.styleOf(outputLevel);
      method.call(
        console,
        `[${this.trait}] %c${label}%c ${title}`,
        `color:${color};font-weight:bold;`,
        'color:inherit;font-weight:inherit;',
        ...args,
      );
    } else {
      method.call(console, `[${this.trait}] ${title}`, ...args);
    }
  }
}

/**
 * 日志管理器
 */
class Journal {
  // public

  public constructor() {
    this.__muted = false;
    this.__colorful = true;
    this.__loggers = new Map();
  }

  /** 是否关闭输出 */
  public get muted() {
    return this.__muted;
  }
  public set muted(v: boolean) {
    this.__muted = v;
  }

  /** 是否启用彩色输出 */
  public get colorful() {
    return this.__colorful;
  }
  public set colorful(v: boolean) {
    this.__colorful = v;
  }

  /**
   * 应用分级样式
   * @param level 分级
   * @param style 样式
   */
  public applyStyle(level: JournalLevelLiteral, style: JournalLevelStyle) {
    this.__styles[level][0] = style[0];
    this.__styles[level][1] = style[1];
  }

  /**
   * 应用分级样式表
   * @param styles 分级样式表
   */
  public applyStyles(styles: Partial<JournalLevelStyles>) {
    if (styles.debug) this.applyStyle(JournalLevelLiteral.Debug, styles.debug);
    if (styles.info) this.applyStyle(JournalLevelLiteral.Info, styles.info);
    if (styles.warn) this.applyStyle(JournalLevelLiteral.Warn, styles.warn);
    if (styles.error) this.applyStyle(JournalLevelLiteral.Error, styles.error);
    if (styles.disable) this.applyStyle(JournalLevelLiteral.Disable, styles.disable);
  }

  /**
   * 获取分级样式
   * @param level 分级
   * @returns 所属分级样式
   */
  public styleOf(level: JournalLevel) {
    if (level === JournalLevel.Debug) return this.__styles.debug;
    if (level === JournalLevel.Info) return this.__styles.info;
    if (level === JournalLevel.Warn) return this.__styles.warn;
    if (level === JournalLevel.Error) return this.__styles.error;
    return this.__styles.disable;
  }

  /**
   * 获取专属日志记录器
   * @param id 日志标识
   * @returns 专属日志记录器
   */
  public acquire(id: string): JournalLogger {
    if (this.__loggers.has(id)) {
      return this.__loggers.get(id)!;
    } else {
      const logger = new JournalLogger(id, this, JournalLevel.Debug);
      this.__loggers.set(id, logger);
      return logger;
    }
  }

  // private

  /** 是否关闭输出 */
  private __muted: boolean;
  /** 是否启用彩色输出 */
  private __colorful: boolean;
  /** 日志容器 */
  private __loggers: Map<string, JournalLogger>;
  /** 分级样式表 */
  private __styles: JournalLevelStyles = {
    debug: ['🟫', '#8C8C8C'],
    info: ['🟦', '#0986FF'],
    warn: ['🟨', '#E6A23C'],
    error: ['🟥', '#D93026'],
    disable: ['🚫', ''],
  };
}

/** 日志管理器单例 */
export const journal = new Journal();
