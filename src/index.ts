/**
 * Claude Statusline 主模块
 * 整合所有组件，提供统一的 API
 */

export * from './types.js';
export * from './theme.js';
export * from './parser.js';
export * from './progress-bar.js';
export * from './renderer.js';
export * from './quota-cache.js';
export * from './segments/context.js';
export * from './segments/cost.js';
export * from './segments/model.js';
export * from './segments/rate-limit.js';
export * from './segments/duration.js';
export * from './segments/token-rate.js';
export * from './segments/latency.js';
export * from './segments/network.js';
export * from './segments/session.js';

import type { Config, SessionData, Segment } from './types.js';
import { getTheme, mergeColors, mergeProgressBar } from './theme.js';
import { Renderer } from './renderer.js';
import { QuotaCache, createMimoQuotaFetcher } from './quota-cache.js';
import { ContextSegment } from './segments/context.js';
import { CostSegment } from './segments/cost.js';
import { ModelSegment } from './segments/model.js';
import { RateLimitSegment } from './segments/rate-limit.js';
import { DurationSegment } from './segments/duration.js';
import { TokenRateSegment } from './segments/token-rate.js';
import { LatencySegment } from './segments/latency.js';
import { NetworkSegment } from './segments/network.js';
import { SessionSegment } from './segments/session.js';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Config = {
  theme: 'dracula',
  refreshInterval: 1000,
  segments: [
    'context',
    'cost',
    'model',
    'rateLimit',
    'duration',
    'tokenRate',
    'latency',
    'network',
    'session',
  ],
};

/**
 * 创建默认的 Segments
 */
function createDefaultSegments(): Segment[] {
  return [
    new ContextSegment(),
    new CostSegment(),
    new ModelSegment(),
    new RateLimitSegment(),
    new DurationSegment(),
    new TokenRateSegment(),
    new LatencySegment(),
    new NetworkSegment(),
    new SessionSegment(),
  ];
}

/**
 * Claude Statusline 实例
 */
export class ClaudeStatusline {
  private renderer: Renderer;
  private quotaCache: QuotaCache;
  private config: Config;

  constructor(config: Partial<Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 初始化主题
    let theme = getTheme(this.config.theme);
    theme = mergeColors(theme, this.config.colors);
    theme = mergeProgressBar(theme, this.config.progressBar);

    // 初始化配额缓存
    this.quotaCache = new QuotaCache(60_000);

    // 配置 OAuth 配额获取
    if (this.config.oauth) {
      this.quotaCache.setFetchFunction(
        createMimoQuotaFetcher(this.config.oauth)
      );
    }

    // 初始化渲染器
    const segments = createDefaultSegments();
    this.renderer = new Renderer(segments, theme, this.config, this.quotaCache);
  }

  /**
   * 渲染 statusline
   */
  async render(data: SessionData): Promise<string> {
    return this.renderer.render(data);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<Config>): void {
    this.config = { ...this.config, ...config };

    // 更新主题
    let theme = getTheme(this.config.theme);
    theme = mergeColors(theme, this.config.colors);
    theme = mergeProgressBar(theme, this.config.progressBar);
    this.renderer.setTheme(theme);
  }

  /**
   * 强制刷新配额缓存
   */
  async refreshQuota(): Promise<void> {
    await this.quotaCache.refresh();
  }

  /**
   * 获取配额缓存状态
   */
  getQuotaStatus() {
    return this.quotaCache.getStatus();
  }
}

/**
 * 快速创建实例
 */
export function createStatusline(config?: Partial<Config>): ClaudeStatusline {
  return new ClaudeStatusline(config);
}
