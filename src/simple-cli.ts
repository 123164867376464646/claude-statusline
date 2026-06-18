#!/usr/bin/env node
/**
 * Claude Statusline - 简化版
 * 兼容 Claude Code statusline 机制
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/** MIMO API 端点 */
const MIMO_API_ENDPOINT = 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage';

/** 配额缓存 */
let quotaCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 秒

/**
 * 主函数
 */
async function main() {
  try {
    // 读取 MIMO 配额
    const quota = await getMimoQuota();

    // 从环境变量读取 Claude Code 数据
    const model = process.env.CLAUDE_MODEL || 'unknown';
    const tokens = parseInt(process.env.CLAUDE_TOKENS || '0', 10);
    const maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '200000', 10);

    // 格式化 token 数量
    const formatTokens = (n: number): string => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
      return String(n);
    };

    // 计算百分比
    const percent = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;

    // 生成进度条（10 格）
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    let barColor: string;
    if (percent > 90) {
      barColor = '\x1b[91m'; // 红色
    } else if (percent > 70) {
      barColor = '\x1b[93m'; // 黄色
    } else {
      barColor = '\x1b[92m'; // 绿色
    }
    const progressBar = `${barColor}${'█'.repeat(filled)}${'░'.repeat(empty)}\x1b[0m`;

    // 组装输出
    const parts: string[] = [];

    // MIMO 配额
    if (quota) {
      if (quota.plan) {
        const planColor = quota.plan.percent > 90 ? '\x1b[91m' : quota.plan.percent > 70 ? '\x1b[93m' : '\x1b[92m';
        parts.push(`${planColor}💰${quota.plan.remaining.toFixed(0)}/${quota.plan.total.toFixed(0)}百M\x1b[0m`);
      }
      if (quota.compensation) {
        const compColor = quota.compensation.percent > 90 ? '\x1b[91m' : quota.compensation.percent > 70 ? '\x1b[93m' : '\x1b[95m';
        parts.push(`${compColor}🎁${quota.compensation.remaining.toFixed(0)}/${quota.compensation.total.toFixed(0)}百M\x1b[0m`);
      }
    }

    // 进度条
    parts.push(progressBar);

    // Context 用量
    const contextColor = percent > 90 ? '\x1b[91m' : percent > 70 ? '\x1b[93m' : '\x1b[92m';
    parts.push(`${contextColor}${formatTokens(tokens)}/${formatTokens(maxTokens)} (${percent.toFixed(1)}%)\x1b[0m`);

    // 模型
    const modelShort = model.replace(/^claude-/, '').replace(/-pro$/, '').replace(/-max$/, '');
    parts.push(`\x1b[95m${modelShort}\x1b[0m`);

    // 输出（单行，不换行）
    process.stdout.write(parts.join(' \x1b[90m│\x1b[0m '));

  } catch (error) {
    // 出错时输出简单信息
    process.stdout.write('\x1b[91m⚠ Error\x1b[0m');
  }
}

/**
 * 获取 MIMO 配额（带缓存）
 */
async function getMimoQuota(): Promise<any> {
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
    const response = await fetch(MIMO_API_ENDPOINT, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'claude-statusline/1.0',
      },
    });

    if (!response.ok) return null;

    const data = await response.json() as any;
    const items = data?.data?.usage?.items || [];

    const SCALE = 1_000_000;
    const MULTIPLIER = 100;

    // 解析套餐积分
    const planItem = items.find((i: any) => i.name === 'plan_total_token');
    let plan;
    if (planItem) {
      const remaining = (planItem.limit - planItem.used) / SCALE / MULTIPLIER;
      const total = planItem.limit / SCALE / MULTIPLIER;
      plan = {
        remaining,
        total,
        percent: planItem.limit > 0 ? (planItem.used / planItem.limit) * 100 : 0,
      };
    }

    // 解析补偿积分
    const compItem = items.find((i: any) => i.name === 'compensation_total_token');
    let compensation;
    if (compItem) {
      const remaining = (compItem.limit - compItem.used) / SCALE / MULTIPLIER;
      const total = compItem.limit / SCALE / MULTIPLIER;
      compensation = {
        remaining,
        total,
        percent: compItem.limit > 0 ? (compItem.used / compItem.limit) * 100 : 0,
      };
    }

    const result = { plan, compensation };

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

// 运行
main();
