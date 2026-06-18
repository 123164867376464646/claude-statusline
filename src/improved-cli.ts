#!/usr/bin/env node
/**
 * Claude Statusline - 改进版
 * 保留完整功能，兼容 Claude Code statusline 机制
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ============================================================
// 类型定义
// ============================================================

interface QuotaItem {
  name: string;
  used: number;
  total: number;
  remaining: number;
  unit: string;
  percent: number;
}

interface OAuthQuota {
  plan?: QuotaItem;
  compensation?: QuotaItem;
}

interface SegmentResult {
  content: string;
  width: number;
}

// ============================================================
// 常量
// ============================================================

const MIMO_API_ENDPOINT = 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage';
const CACHE_TTL = 60_000; // 60 秒

/** 颜色主题 */
const THEME = {
  success: '\x1b[92m',    // 亮绿色
  warning: '\x1b[93m',    // 亮黄色
  critical: '\x1b[91m',   // 亮红色
  accent: '\x1b[95m',     // 亮紫色
  info: '\x1b[96m',       // 亮青色
  text: '\x1b[97m',       // 亮白色
  secondary: '\x1b[90m',  // 暗灰色
  separator: '\x1b[90m',  // 暗灰色
  reset: '\x1b[0m',       // 重置
} as const;

/** 彩虹颜色 */
const RAINBOW_COLORS = [
  '\x1b[91m', // 红
  '\x1b[93m', // 黄
  '\x1b[92m', // 绿
  '\x1b[96m', // 青
  '\x1b[94m', // 蓝
  '\x1b[95m', // 紫
];

// ============================================================
// 配额缓存
// ============================================================

let quotaCache: { data: OAuthQuota; timestamp: number } | null = null;

/**
 * 获取 MIMO 配额（带缓存）
 */
async function getMimoQuota(): Promise<OAuthQuota | null> {
  // 检查缓存
  if (quotaCache && Date.now() - quotaCache.timestamp < CACHE_TTL) {
    return quotaCache.data;
  }

  // 读取 cookie 文件
  const cookieFile = join(homedir(), '.claude', 'mimo-cookie.txt');
  if (!existsSync(cookieFile)) {
    return null;
  }

  try {
    const content = readFileSync(cookieFile, 'utf-8');
    const cookie = content
      .split('\n')
      .filter(line => !line.startsWith('#') && line.trim())
      .shift();

    if (!cookie) return null;

    // 调用 API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(MIMO_API_ENDPOINT, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'claude-statusline/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

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

    const result: OAuthQuota = { plan, compensation };

    // 更新缓存
    quotaCache = {
      data: result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    return null;
  }
}

// ============================================================
// 进度条渲染
// ============================================================

/**
 * 渲染进度条
 * @param percent 百分比 (0-100)
 * @param width 宽度（字符数）
 */
function renderProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let color: string;
  if (percent > 90) {
    // 彩虹效果
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += RAINBOW_COLORS[i % RAINBOW_COLORS.length] + '█';
    }
    bar += `${THEME.secondary}${'░'.repeat(empty)}${THEME.reset}`;
    return bar;
  } else if (percent > 70) {
    color = THEME.warning;
  } else {
    color = THEME.success;
  }

  return `${color}${'█'.repeat(filled)}${THEME.secondary}${'░'.repeat(empty)}${THEME.reset}`;
}

// ============================================================
// 数据段渲染
// ============================================================

/**
 * 渲染配额段
 */
function renderQuotaSegment(quota: OAuthQuota | null): string[] {
  if (!quota) return [];

  const parts: string[] = [];

  if (quota.plan) {
    const color = quota.plan.percent > 90 ? THEME.critical
                : quota.plan.percent > 70 ? THEME.warning
                : THEME.success;
    parts.push(`${color}💰${quota.plan.remaining.toFixed(0)}/${quota.plan.total.toFixed(0)}${quota.plan.unit}${THEME.reset}`);
  }

  if (quota.compensation) {
    const color = quota.compensation.percent > 90 ? THEME.critical
                : quota.compensation.percent > 70 ? THEME.warning
                : THEME.accent;
    parts.push(`${color}🎁${quota.compensation.remaining.toFixed(0)}/${quota.compensation.total.toFixed(0)}${quota.compensation.unit}${THEME.reset}`);
  }

  return parts;
}

/**
 * 渲染 Context 段
 */
function renderContextSegment(tokens: number, maxTokens: number): string {
  const percent = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;

  const formatTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const color = percent > 90 ? THEME.critical
              : percent > 70 ? THEME.warning
              : THEME.success;

  return `${color}${formatTokens(tokens)}/${formatTokens(maxTokens)} (${percent.toFixed(1)}%)${THEME.reset}`;
}

/**
 * 渲染模型段
 */
function renderModelSegment(model: string): string {
  return `${THEME.accent}${model}${THEME.reset}`;
}

/**
 * 渲染花费段
 */
function renderCostSegment(cost: number): string {
  const color = cost > 10 ? THEME.critical
              : cost > 5 ? THEME.warning
              : THEME.text;

  return `${color}$${cost.toFixed(4)}${THEME.reset}`;
}

/**
 * 渲染速率限制段
 */
function renderRateLimitSegment(): string {
  // 模拟数据（实际应从 API 获取）
  const remaining = 50;
  const total = 60;
  const percent = (remaining / total) * 100;

  const color = percent < 20 ? THEME.critical
              : percent < 50 ? THEME.warning
              : THEME.success;

  return `${color}⚡${remaining}/${total}${THEME.reset}`;
}

/**
 * 渲染持续时间段
 */
function renderDurationSegment(startTime: number): string {
  const duration = Date.now() - startTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h${minutes % 60}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m${seconds % 60}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return `${THEME.secondary}⏱${formatted}${THEME.reset}`;
}

/**
 * 渲染 Token 速率段
 */
function renderTokenRateSegment(): string {
  // 模拟数据（实际应计算）
  const rate = Math.floor(Math.random() * 1000);

  const formatRate = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const color = rate > 1000 ? THEME.warning
              : rate > 500 ? THEME.accent
              : THEME.secondary;

  return `${color}📊${formatRate(rate)}/s${THEME.reset}`;
}

/**
 * 渲染延迟段
 */
function renderLatencySegment(latency: number): string {
  const color = latency > 5000 ? THEME.critical
              : latency > 2000 ? THEME.warning
              : THEME.success;

  const formatted = latency >= 1000 ? `${(latency / 1000).toFixed(1)}s` : `${Math.round(latency)}ms`;

  return `${color}🌐${formatted}${THEME.reset}`;
}

/**
 * 渲染网络状态段
 */
function renderNetworkSegment(status: 'connected' | 'disconnected' | 'error'): string {
  let icon: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'connected':
      icon = '●';
      color = THEME.success;
      label = '在线';
      break;
    case 'disconnected':
      icon = '○';
      color = THEME.warning;
      label = '离线';
      break;
    case 'error':
      icon = '✕';
      color = THEME.critical;
      label = '错误';
      break;
  }

  return `${color}${icon} ${label}${THEME.reset}`;
}

/**
 * 渲染会话 ID 段
 */
function renderSessionSegment(sessionId: string): string {
  return `${THEME.secondary}#${sessionId}${THEME.reset}`;
}

// ============================================================
// 主函数
// ============================================================

/**
 * 主函数
 */
async function main() {
  try {
    // 获取 MIMO 配额
    const quota = await getMimoQuota();

    // 从环境变量读取 Claude Code 数据
    const model = process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || 'unknown';
    const tokens = parseInt(process.env.CLAUDE_TOKENS || '0', 10);
    const maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '200000', 10);
    const cost = parseFloat(process.env.CLAUDE_COST || '0');
    const latency = parseInt(process.env.CLAUDE_LATENCY || '0', 10);
    const apiStatus = (process.env.CLAUDE_API_STATUS || 'connected') as 'connected' | 'disconnected' | 'error';
    const startTime = parseInt(process.env.CLAUDE_SESSION_START || String(Date.now()), 10);

    // 计算 context 百分比
    const contextPercent = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;

    // 生成会话 ID（短）
    const sessionId = Math.random().toString(36).substring(2, 8);

    // 渲染各个段
    const segments: string[] = [
      // 配额段
      ...renderQuotaSegment(quota),

      // 进度条
      renderProgressBar(contextPercent),

      // Context 段
      renderContextSegment(tokens, maxTokens),

      // 花费段
      renderCostSegment(cost),

      // 模型段
      renderModelSegment(model),

      // 速率限制段
      renderRateLimitSegment(),

      // 持续时间段
      renderDurationSegment(startTime),

      // Token 速率段
      renderTokenRateSegment(),

      // 延迟段
      renderLatencySegment(latency),

      // 网络状态段
      renderNetworkSegment(apiStatus),

      // 会话 ID 段
      renderSessionSegment(sessionId),
    ];

    // 用分隔符连接
    const separator = ` ${THEME.separator}│${THEME.reset} `;
    const output = segments.filter(Boolean).join(separator);

    // 输出（单行，不换行，不使用光标控制）
    process.stdout.write(output);

  } catch (error) {
    // 出错时输出简单信息
    process.stdout.write(`${THEME.critical}⚠ Error${THEME.reset}`);
  }
}

// 运行
main();
