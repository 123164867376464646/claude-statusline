/**
 * 进度条渲染器
 * 支持条件式彩虹效果
 */

import type { Theme, ProgressBarConfig } from './types.js';

/** ANSI 颜色代码 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // 前景色
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
  },
} as const;

/** 彩虹颜色序列 */
const RAINBOW_COLORS = [
  ANSI.fg.red,
  ANSI.fg.brightRed,
  ANSI.fg.yellow,
  ANSI.fg.brightYellow,
  ANSI.fg.green,
  ANSI.fg.brightGreen,
  ANSI.fg.cyan,
  ANSI.fg.brightCyan,
  ANSI.fg.blue,
  ANSI.fg.brightBlue,
  ANSI.fg.magenta,
  ANSI.fg.brightMagenta,
];

/**
 * 渲染进度条
 * @param percent 进度百分比 (0-1)
 * @param theme 主题配置
 * @param config 进度条配置
 * @param animate 是否启用动画（彩虹流动效果）
 */
export function renderProgressBar(
  percent: number,
  theme: Theme,
  config: ProgressBarConfig,
  animate: boolean = false
): string {
  const { width, fillChar, emptyChar, enableRainbow, rainbowThreshold } = config;

  // 计算填充数量
  const filled = Math.round(percent * width);
  const empty = width - filled;

  // 生成进度条内容
  let bar: string;

  if (enableRainbow && percent > rainbowThreshold) {
    // 彩虹模式：当超过阈值时
    bar = renderRainbowBar(filled, empty, fillChar, emptyChar, theme, animate);
  } else if (percent > 0.7) {
    // 警告模式
    bar = renderWarningBar(filled, empty, fillChar, emptyChar, theme);
  } else {
    // 正常模式
    bar = renderNormalBar(filled, empty, fillChar, emptyChar, theme);
  }

  return bar;
}

/**
 * 渲染正常进度条
 */
function renderNormalBar(
  filled: number,
  empty: number,
  fillChar: string,
  emptyChar: string,
  theme: Theme
): string {
  const fillColor = hexToAnsi(theme.colors.barFull);
  const emptyColor = hexToAnsi(theme.colors.barEmpty);

  const filledStr = `${fillColor}${fillChar.repeat(filled)}`;
  const emptyStr = `${emptyColor}${emptyChar.repeat(empty)}`;

  return `${filledStr}${emptyStr}${ANSI.reset}`;
}

/**
 * 渲染警告进度条
 */
function renderWarningBar(
  filled: number,
  empty: number,
  fillChar: string,
  emptyChar: string,
  theme: Theme
): string {
  const fillColor = hexToAnsi(theme.colors.warning);
  const emptyColor = hexToAnsi(theme.colors.barEmpty);

  const filledStr = `${fillColor}${fillChar.repeat(filled)}`;
  const emptyStr = `${emptyColor}${emptyChar.repeat(empty)}`;

  return `${filledStr}${emptyStr}${ANSI.reset}`;
}

/**
 * 渲染彩虹进度条
 * 超过 90% 阈值时触发，视觉效果惊艳
 */
function renderRainbowBar(
  filled: number,
  empty: number,
  fillChar: string,
  emptyChar: string,
  theme: Theme,
  animate: boolean
): string {
  let result = '';

  // 彩虹填充部分
  for (let i = 0; i < filled; i++) {
    const colorIndex = animate
      ? (i + Math.floor(Date.now() / 100)) % RAINBOW_COLORS.length
      : i % RAINBOW_COLORS.length;
    result += `${RAINBOW_COLORS[colorIndex]}${fillChar}`;
  }

  // 空白部分
  const emptyColor = hexToAnsi(theme.colors.barEmpty);
  result += `${emptyColor}${emptyChar.repeat(empty)}`;

  return `${result}${ANSI.reset}`;
}

/**
 * 十六进制颜色转 ANSI
 * 支持 #RGB, #RRGGBB 格式
 */
function hexToAnsi(hex: string): string {
  if (hex === 'transparent') return '';

  // 解析十六进制颜色
  let r: number, g: number, b: number;

  if (hex.length === 4) {
    // #RGB 格式
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    // #RRGGBB 格式
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    return '';
  }

  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * 创建动画彩虹进度条
 * 返回一个可以持续更新的函数
 */
export function createAnimatedRainbow(
  percent: number,
  theme: Theme,
  config: ProgressBarConfig
): () => string {
  let frame = 0;

  return () => {
    frame++;
    const { width, fillChar, emptyChar } = config;
    const filled = Math.round(percent * width);
    const empty = width - filled;

    let result = '';

    // 流动的彩虹效果
    for (let i = 0; i < filled; i++) {
      const colorIndex = (i + frame) % RAINBOW_COLORS.length;
      result += `${RAINBOW_COLORS[colorIndex]}${fillChar}`;
    }

    const emptyColor = hexToAnsi(theme.colors.barEmpty);
    result += `${emptyColor}${emptyChar.repeat(empty)}`;

    return `${result}${ANSI.reset}`;
  };
}
