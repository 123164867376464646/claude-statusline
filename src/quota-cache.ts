/**
 * OAuth 配额缓存
 * 60 秒 TTL，避免高频刷新导致限流
 */

import type { OAuthQuota, QuotaItem, Config } from './types.js';

/** 缓存条目 */
interface CacheEntry {
  data: OAuthQuota;
  timestamp: number;
}

/** 默认 TTL: 60 秒 */
const DEFAULT_TTL = 60_000;

/**
 * 配额缓存管理器
 */
export class QuotaCache {
  private cache: CacheEntry | null = null;
  private ttl: number;
  private fetchFn: (() => Promise<OAuthQuota>) | null = null;
  private fetching: Promise<OAuthQuota> | null = null;

  constructor(ttl: number = DEFAULT_TTL) {
    this.ttl = ttl;
  }

  /**
   * 设置配额获取函数
   */
  setFetchFunction(fn: () => Promise<OAuthQuota>): void {
    this.fetchFn = fn;
  }

  /**
   * 获取配额（带缓存）
   * 在 TTL 内直接返回缓存，避免高频请求
   */
  async getQuota(): Promise<OAuthQuota | null> {
    // 检查缓存是否有效
    if (this.cache && Date.now() - this.cache.timestamp < this.ttl) {
      return this.cache.data;
    }

    // 如果没有获取函数，返回 null
    if (!this.fetchFn) {
      return null;
    }

    // 防止并发请求：如果正在获取中，等待现有请求
    if (this.fetching) {
      return this.fetching;
    }

    // 发起新请求
    this.fetching = this.fetchQuota();
    try {
      const result = await this.fetching;
      return result;
    } finally {
      this.fetching = null;
    }
  }

  /**
   * 实际获取配额
   */
  private async fetchQuota(): Promise<OAuthQuota> {
    try {
      const data = await this.fetchFn!();
      this.cache = {
        data,
        timestamp: Date.now(),
      };
      return data;
    } catch (error) {
      // 获取失败时，如果有旧缓存，返回旧缓存（延长有效期）
      if (this.cache) {
        return this.cache.data;
      }
      throw error;
    }
  }

  /**
   * 强制刷新缓存
   */
  async refresh(): Promise<OAuthQuota | null> {
    this.cache = null;
    return this.getQuota();
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache = null;
  }

  /**
   * 获取缓存状态
   */
  getStatus(): { cached: boolean; age: number; ttl: number } {
    if (!this.cache) {
      return { cached: false, age: 0, ttl: this.ttl };
    }
    return {
      cached: true,
      age: Date.now() - this.cache.timestamp,
      ttl: this.ttl,
    };
  }
}

/**
 * 创建 MIMO 配额获取函数
 * token 参数应该是完整的 cookie 字符串
 */
export function createMimoQuotaFetcher(config: NonNullable<Config['oauth']>): () => Promise<OAuthQuota> {
  return async () => {
    // 构建 Cookie 头
    // 如果 token 已经包含完整的 cookie 格式，直接使用
    // 否则包装成 api-platform_serviceToken 格式
    let cookie = config.token;
    if (!cookie.includes('=')) {
      cookie = `api-platform_serviceToken="${cookie}"`;
    }

    const response = await fetch(config.endpoint, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'claude-statusline/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const items = data?.data?.usage?.items || [];

    const SCALE = 1_000_000;
    const MULTIPLIER = 100;

    // 解析套餐积分
    const planItem = items.find((i: any) => i.name === 'plan_total_token');
    let plan: QuotaItem | undefined;
    if (planItem) {
      const remaining = (planItem.limit - planItem.used) / SCALE / MULTIPLIER;
      const total = planItem.limit / SCALE / MULTIPLIER;
      plan = {
        name: '套餐',
        used: planItem.used / SCALE / MULTIPLIER,
        total,
        remaining,
        unit: '百M',
        percent: planItem.limit > 0 ? (planItem.used / planItem.limit) * 100 : 0,
      };
    }

    // 解析补偿积分
    const compItem = items.find((i: any) => i.name === 'compensation_total_token');
    let compensation: QuotaItem | undefined;
    if (compItem) {
      const remaining = (compItem.limit - compItem.used) / SCALE / MULTIPLIER;
      const total = compItem.limit / SCALE / MULTIPLIER;
      compensation = {
        name: '补偿',
        used: compItem.used / SCALE / MULTIPLIER,
        total,
        remaining,
        unit: '百M',
        percent: compItem.limit > 0 ? (compItem.used / compItem.limit) * 100 : 0,
      };
    }

    // 返回结果（兼容旧接口）
    return {
      plan,
      compensation,
      remaining: plan?.remaining ?? 0,
      total: plan?.total ?? 0,
      unit: '百M',
    };
  };
}
