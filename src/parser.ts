/**
 * 会话流解析器
 * 从 stdin 或环境变量解析 Claude Code 的会话数据
 */

import type { SessionData } from './types.js';

/**
 * 默认会话数据
 */
const DEFAULT_SESSION_DATA: SessionData = {
  model: 'unknown',
  inputTokens: 0,
  outputTokens: 0,
  contextWindow: 200_000,
  cost: 0,
  requests: 0,
  startTime: Date.now(),
  lastLatency: 0,
  apiStatus: 'connected',
};

/**
 * 从环境变量解析会话数据
 * Claude Code 通过环境变量传递部分数据
 */
export function parseFromEnv(): SessionData {
  return {
    model: process.env.CLAUDE_MODEL || DEFAULT_SESSION_DATA.model,
    inputTokens: parseInt(process.env.CLAUDE_TOKENS || '0', 10),
    outputTokens: parseInt(process.env.CLAUDE_OUTPUT_TOKENS || '0', 10),
    contextWindow: parseInt(
      process.env.CLAUDE_MAX_TOKENS || String(DEFAULT_SESSION_DATA.contextWindow),
      10
    ),
    cost: parseFloat(process.env.CLAUDE_COST || '0'),
    requests: parseInt(process.env.CLAUDE_REQUESTS || '0', 10),
    startTime: parseInt(
      process.env.CLAUDE_SESSION_START || String(Date.now()),
      10
    ),
    lastLatency: parseInt(process.env.CLAUDE_LATENCY || '0', 10),
    apiStatus: (process.env.CLAUDE_API_STATUS as SessionData['apiStatus']) || 'connected',
  };
}

/**
 * 从 JSON 字符串解析会话数据
 */
export function parseFromJson(json: string): SessionData {
  try {
    const data = JSON.parse(json);
    return {
      ...DEFAULT_SESSION_DATA,
      ...data,
    };
  } catch (error) {
    console.error('Failed to parse session data:', error);
    return DEFAULT_SESSION_DATA;
  }
}

/**
 * 从 stdin 解析会话数据（JSON 流）
 */
export async function* parseFromStdin(): AsyncGenerator<SessionData> {
  const stdin = process.stdin;
  stdin.setEncoding('utf-8');

  let buffer = '';

  for await (const chunk of stdin) {
    buffer += chunk;

    // 尝试按行解析 JSON
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        yield parseFromJson(line);
      }
    }
  }

  // 处理剩余的 buffer
  if (buffer.trim()) {
    yield parseFromJson(buffer);
  }
}

/**
 * 创建模拟会话数据（用于测试）
 */
export function createMockSessionData(): SessionData {
  const startTime = Date.now() - Math.random() * 3600_000; // 随机 0-1 小时前

  return {
    model: 'claude-3-7-sonnet',
    inputTokens: Math.floor(Math.random() * 150_000),
    outputTokens: Math.floor(Math.random() * 50_000),
    contextWindow: 200_000,
    cost: Math.random() * 5,
    requests: Math.floor(Math.random() * 100),
    startTime,
    lastLatency: Math.random() * 3000,
    apiStatus: Math.random() > 0.1 ? 'connected' : 'disconnected',
  };
}

/**
 * 更新会话数据（增量更新）
 */
export function updateSessionData(
  current: SessionData,
  update: Partial<SessionData>
): SessionData {
  return {
    ...current,
    ...update,
  };
}
