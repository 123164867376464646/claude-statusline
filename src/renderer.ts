/**
 * 渲染引擎
 * 将所有 Segment 组合成完整的 statusline
 */

import type {
  SessionData,
  Theme,
  Config,
  Segment,
  SegmentResult,
  OAuthQuota,
} from './types.js';
import { renderProgressBar } from './progress-bar.js';
import { QuotaCache } from './quota-cache.js';

/** ANSI 转义序列 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  clearLine: '\x1b[2K',
  cursorToStart: '\r',
} as const;

/**
 * 渲染器
 */
export class Renderer {
  private segments: Segment[];
  private theme: Theme;
  private config: Config;
  private quotaCache: QuotaCache;

  constructor(
    segments: Segment[],
    theme: Theme,
    config: Config,
    quotaCache: QuotaCache
  ) {
    this.segments = segments;
    this.theme = theme;
    this.config = config;
    this.quotaCache = quotaCache;
  }

  /**
   * 渲染完整的 statusline
   * @param data 会话数据
   * @param quota 配额数据（可选）
   */
  async render(data: SessionData, quota?: OAuthQuota | null): Promise<string> {
    // 获取配额（带缓存）
    if (quota === undefined) {
      quota = await this.quotaCache.getQuota();
    }

    // 计算 context 百分比
    const totalTokens = data.inputTokens + data.outputTokens;
    const contextPercent = data.contextWindow > 0
      ? totalTokens / data.contextWindow
      : 0;

    // 渲染进度条
    const progressBar = renderProgressBar(
      contextPercent,
      this.theme,
      this.theme.progressBar,
      contextPercent > this.theme.progressBar.rainbowThreshold
    );

    // 渲染各个 Segment
    const segmentResults: SegmentResult[] = this.segments.map((segment) => {
      try {
        return segment.render(data, this.theme);
      } catch (error) {
        // 单个 Segment 渲染失败不影响整体
        return { content: '', width: 0 };
      }
    });

    // 组装最终输出
    const parts: string[] = [];

    // 添加配额信息（如果有）
    if (quota) {
      const quotaStr = this.renderQuota(quota);
      parts.push(quotaStr);
    }

    // 添加进度条
    parts.push(progressBar);

    // 添加各个 Segment
    segmentResults.forEach((result) => {
      if (result.content) {
        parts.push(result.content);
      }
    });

    // 用分隔符连接
    const separator = ` ${this.theme.colors.separator}│${ANSI.reset} `;
    const content = parts.filter(Boolean).join(separator);

    // 添加清除行和光标复位
    return `${ANSI.clearLine}${ANSI.cursorToStart}${content}${ANSI.reset}`;
  }

  /**
   * 渲染配额信息
   */
  private renderQuota(quota: OAuthQuota): string {
    const parts: string[] = [];

    // 渲染套餐积分
    if (quota.plan) {
      const percent = quota.plan.remaining / quota.plan.total;
      let color: string;
      if (percent < 0.1) {
        color = this.theme.colors.critical;
      } else if (percent < 0.3) {
        color = this.theme.colors.warning;
      } else {
        color = this.theme.colors.success;
      }
      parts.push(`${color}💰${quota.plan.remaining.toFixed(0)}/${quota.plan.total.toFixed(0)}${quota.plan.unit}`);
    }

    // 渲染补偿积分
    if (quota.compensation) {
      const percent = quota.compensation.remaining / quota.compensation.total;
      let color: string;
      if (percent < 0.1) {
        color = this.theme.colors.critical;
      } else if (percent < 0.3) {
        color = this.theme.colors.warning;
      } else {
        color = this.theme.colors.accent;
      }
      parts.push(`${color}🎁${quota.compensation.remaining.toFixed(0)}/${quota.compensation.total.toFixed(0)}${quota.compensation.unit}`);
    }

    // 如果没有详细信息，使用兼容模式
    if (parts.length === 0) {
      const percent = quota.total > 0 ? quota.remaining / quota.total : 0;
      let color: string;
      if (percent < 0.1) {
        color = this.theme.colors.critical;
      } else if (percent < 0.3) {
        color = this.theme.colors.warning;
      } else {
        color = this.theme.colors.success;
      }
      parts.push(`${color}💰${quota.remaining.toFixed(0)}/${quota.total.toFixed(0)}${quota.unit}`);
    }

    return parts.join(' ');
  }

  /**
   * 更新主题
   */
  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  /**
   * 更新配置
   */
  setConfig(config: Config): void {
    this.config = config;
  }
}
