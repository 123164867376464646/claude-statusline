/**
 * 主题系统
 * 内置 10 种开箱即用的主题
 */

import type { Theme, ColorKeys, ProgressBarConfig } from './types.js';

/** 默认进度条配置 */
const DEFAULT_PROGRESS_BAR: ProgressBarConfig = {
  width: 20,
  fillChar: '█',
  emptyChar: '░',
  enableRainbow: true,
  rainbowThreshold: 0.9,
};

/** 内置主题 */
const BUILT_IN_THEMES: Record<string, Theme> = {
  // 1. Dracula
  dracula: {
    name: 'dracula',
    colors: {
      bg: '#282a36',
      text: '#f8f8f2',
      accent: '#bd93f9',
      warning: '#ffb86c',
      critical: '#ff5555',
      success: '#50fa7b',
      barEmpty: '#44475a',
      barFull: '#50fa7b',
      separator: '#6272a4',
      label: '#8be9fd',
      value: '#f1fa8c',
      textSecondary: '#6272a4',
      border: '#44475a',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 2. Monokai
  monokai: {
    name: 'monokai',
    colors: {
      bg: '#272822',
      text: '#f8f8f2',
      accent: '#f92672',
      warning: '#fd971f',
      critical: '#f92672',
      success: '#a6e22e',
      barEmpty: '#3e3d32',
      barFull: '#a6e22e',
      separator: '#75715e',
      label: '#66d9ef',
      value: '#e6db74',
      textSecondary: '#75715e',
      border: '#3e3d32',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 3. Nord
  nord: {
    name: 'nord',
    colors: {
      bg: '#2e3440',
      text: '#eceff4',
      accent: '#88c0d0',
      warning: '#ebcb8b',
      critical: '#bf616a',
      success: '#a3be8c',
      barEmpty: '#3b4252',
      barFull: '#88c0d0',
      separator: '#4c566a',
      label: '#81a1c1',
      value: '#ebcb8b',
      textSecondary: '#4c566a',
      border: '#3b4252',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 4. Cyberpunk
  cyberpunk: {
    name: 'cyberpunk',
    colors: {
      bg: '#0d0221',
      text: '#00ff9f',
      accent: '#ff00ff',
      warning: '#ffff00',
      critical: '#ff003c',
      success: '#00ff9f',
      barEmpty: '#1a0a2e',
      barFull: '#00ff9f',
      separator: '#ff00ff',
      label: '#00ffff',
      value: '#ffff00',
      textSecondary: '#666699',
      border: '#ff00ff',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR, fillChar: '▓' },
  },

  // 5. Tokyo Night
  tokyoNight: {
    name: 'tokyoNight',
    colors: {
      bg: '#1a1b26',
      text: '#a9b1d6',
      accent: '#7aa2f7',
      warning: '#e0af68',
      critical: '#f7768e',
      success: '#9ece6a',
      barEmpty: '#24283b',
      barFull: '#7aa2f7',
      separator: '#565f89',
      label: '#7dcfff',
      value: '#e0af68',
      textSecondary: '#565f89',
      border: '#24283b',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 6. Gruvbox
  gruvbox: {
    name: 'gruvbox',
    colors: {
      bg: '#282828',
      text: '#ebdbb2',
      accent: '#d65d0e',
      warning: '#fabd2f',
      critical: '#fb4934',
      success: '#b8bb26',
      barEmpty: '#3c3836',
      barFull: '#b8bb26',
      separator: '#665c54',
      label: '#83a598',
      value: '#fabd2f',
      textSecondary: '#665c54',
      border: '#3c3836',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 7. Solarized Dark
  solarizedDark: {
    name: 'solarizedDark',
    colors: {
      bg: '#002b36',
      text: '#839496',
      accent: '#268bd2',
      warning: '#b58900',
      critical: '#dc322f',
      success: '#859900',
      barEmpty: '#073642',
      barFull: '#268bd2',
      separator: '#586e75',
      label: '#2aa198',
      value: '#cb4b16',
      textSecondary: '#586e75',
      border: '#073642',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 8. Catppuccin Mocha
  catppuccin: {
    name: 'catppuccin',
    colors: {
      bg: '#1e1e2e',
      text: '#cdd6f4',
      accent: '#cba6f7',
      warning: '#f9e2af',
      critical: '#f38ba8',
      success: '#a6e3a1',
      barEmpty: '#313244',
      barFull: '#a6e3a1',
      separator: '#585b70',
      label: '#89b4fa',
      value: '#f9e2af',
      textSecondary: '#585b70',
      border: '#313244',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR },
  },

  // 9. Minimalist
  minimalist: {
    name: 'minimalist',
    colors: {
      bg: 'transparent',
      text: '#ffffff',
      accent: '#ffffff',
      warning: '#ffa500',
      critical: '#ff4444',
      success: '#44ff44',
      barEmpty: '#333333',
      barFull: '#ffffff',
      separator: '#666666',
      label: '#aaaaaa',
      value: '#ffffff',
      textSecondary: '#888888',
      border: 'transparent',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR, fillChar: '─', emptyChar: '─' },
  },

  // 10. Matrix
  matrix: {
    name: 'matrix',
    colors: {
      bg: '#000000',
      text: '#00ff00',
      accent: '#00ff00',
      warning: '#ffff00',
      critical: '#ff0000',
      success: '#00ff00',
      barEmpty: '#003300',
      barFull: '#00ff00',
      separator: '#006600',
      label: '#00cc00',
      value: '#00ff00',
      textSecondary: '#006600',
      border: '#003300',
    },
    progressBar: { ...DEFAULT_PROGRESS_BAR, fillChar: '█', emptyChar: '▒' },
  },
};

/** 获取主题 */
export function getTheme(name: string): Theme {
  return BUILT_IN_THEMES[name] || BUILT_IN_THEMES.dracula;
}

/** 获取所有主题名称 */
export function getThemeNames(): string[] {
  return Object.keys(BUILT_IN_THEMES);
}

/** 合并自定义颜色 */
export function mergeColors(theme: Theme, customColors?: Partial<ColorKeys>): Theme {
  if (!customColors) return theme;
  return {
    ...theme,
    colors: { ...theme.colors, ...customColors },
  };
}

/** 合并进度条配置 */
export function mergeProgressBar(
  theme: Theme,
  customConfig?: Partial<ProgressBarConfig>
): Theme {
  if (!customConfig) return theme;
  return {
    ...theme,
    progressBar: { ...theme.progressBar, ...customConfig },
  };
}
