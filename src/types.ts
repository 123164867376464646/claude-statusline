/**
 * Claude Statusline 类型定义
 */

/** 会话数据 */
export interface SessionData {
  /** 当前模型 */
  model: string;
  /** 输入 tokens */
  inputTokens: number;
  /** 输出 tokens */
  outputTokens: number;
  /** 总 context window 大小 */
  contextWindow: number;
  /** 累计花费 (USD) */
  cost: number;
  /** 请求数 */
  requests: number;
  /** 会话开始时间 */
  startTime: number;
  /** 最后一次 API 调用延迟 (ms) */
  lastLatency: number;
  /** API 状态 */
  apiStatus: 'connected' | 'disconnected' | 'error';
}

/** OAuth 配额项 */
export interface QuotaItem {
  /** 名称 */
  name: string;
  /** 已使用 */
  used: number;
  /** 总额度 */
  total: number;
  /** 剩余额度 */
  remaining: number;
  /** 单位 */
  unit: string;
  /** 使用百分比 */
  percent: number;
}

/** OAuth 配额 */
export interface OAuthQuota {
  /** 套餐积分 */
  plan?: QuotaItem;
  /** 补偿积分 */
  compensation?: QuotaItem;
  /** 剩余额度（兼容旧接口） */
  remaining: number;
  /** 总额度（兼容旧接口） */
  total: number;
  /** 单位 */
  unit: string;
  /** 过期时间 */
  expiresAt?: number;
}

/** 进度条配置 */
export interface ProgressBarConfig {
  /** 宽度 (字符数) */
  width: number;
  /** 填充字符 */
  fillChar: string;
  /** 空字符 */
  emptyChar: string;
  /** 启用彩虹效果 */
  enableRainbow: boolean;
  /** 彩虹触发阈值 (0-1) */
  rainbowThreshold: number;
}

/** 颜色键 */
export interface ColorKeys {
  /** 背景色 */
  bg: string;
  /** 主文本色 */
  text: string;
  /** 强调色 */
  accent: string;
  /** 警告色 */
  warning: string;
  /** 危险色 */
  critical: string;
  /** 成功色 */
  success: string;
  /** 进度条空色 */
  barEmpty: string;
  /** 进度条满色 */
  barFull: string;
  /** 分隔符色 */
  separator: string;
  /** 标签色 */
  label: string;
  /** 值色 */
  value: string;
  /** 次要文本色 */
  textSecondary: string;
  /** 边框色 */
  border: string;
}

/** 主题 */
export interface Theme {
  /** 主题名称 */
  name: string;
  /** 颜色配置 */
  colors: ColorKeys;
  /** 进度条配置 */
  progressBar: ProgressBarConfig;
}

/** 配置 */
export interface Config {
  /** 当前主题名称 */
  theme: string;
  /** 刷新间隔 (ms) */
  refreshInterval: number;
  /** OAuth 配置 */
  oauth?: {
    /** API 端点 */
    endpoint: string;
    /** Token */
    token: string;
  };
  /** 自定义颜色覆盖 */
  colors?: Partial<ColorKeys>;
  /** 自定义进度条配置 */
  progressBar?: Partial<ProgressBarConfig>;
  /** 显示的 segments */
  segments?: string[];
}

/** Segment 渲染结果 */
export interface SegmentResult {
  /** 内容 */
  content: string;
  /** 宽度 (字符数) */
  width: number;
}

/** Segment 接口 */
export interface Segment {
  /** 名称 */
  name: string;
  /** 渲染 */
  render(data: SessionData, theme: Theme): SegmentResult;
}
