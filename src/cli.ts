#!/usr/bin/env node
/**
 * Claude Statusline CLI
 * 命令行入口
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createStatusline, parseFromEnv, createMockSessionData } from './index.js';
import type { Config } from './types.js';

/** ANSI 转义序列 */
const ANSI = {
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearLine: '\x1b[2K',
  cursorToStart: '\r',
} as const;

/** MIMO API 端点 */
const MIMO_API_ENDPOINT = 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage';

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  // 解析命令行参数
  const config = parseArgs(args);

  // 自动加载 MIMO cookie（如果存在）
  autoLoadMimoCookie(config);

  // 创建 statusline 实例
  const statusline = createStatusline(config);

  // 隐藏光标
  process.stdout.write(ANSI.hideCursor);

  // 退出时显示光标
  process.on('exit', () => {
    process.stdout.write(ANSI.showCursor);
  });

  process.on('SIGINT', () => {
    process.stdout.write(ANSI.showCursor);
    process.exit(0);
  });

  // 检查是否是测试模式
  if (args.includes('--test') || args.includes('-t')) {
    await runTestMode(statusline, config);
    return;
  }

  // 正常模式：从环境变量读取数据并渲染
  await runNormalMode(statusline, config);
}

/**
 * 自动加载 MIMO cookie
 */
function autoLoadMimoCookie(config: Config): void {
  // 如果已经配置了 OAuth，跳过
  if (config.oauth?.token) {
    return;
  }

  // 尝试读取 mimo-cookie.txt
  const cookieFile = join(homedir(), '.claude', 'mimo-cookie.txt');

  if (!existsSync(cookieFile)) {
    return;
  }

  try {
    const content = readFileSync(cookieFile, 'utf-8');

    // 跳过注释行和空行，提取 cookie
    const cookie = content
      .split('\n')
      .filter(line => !line.startsWith('#') && line.trim())
      .shift();

    if (cookie) {
      config.oauth = {
        endpoint: MIMO_API_ENDPOINT,
        token: cookie,
      };
    }
  } catch (error) {
    // 静默失败，不影响主功能
  }
}

/**
 * 正常模式
 */
async function runNormalMode(
  statusline: ReturnType<typeof createStatusline>,
  config: Config
) {
  const data = parseFromEnv();

  // 渲染一次
  const output = await statusline.render(data);
  process.stdout.write(output);

  // 如果设置了刷新间隔，持续更新
  if (config.refreshInterval && config.refreshInterval > 0) {
    setInterval(async () => {
      const data = parseFromEnv();
      const output = await statusline.render(data);
      process.stdout.write(ANSI.cursorToStart + output);
    }, config.refreshInterval);
  }
}

/**
 * 测试模式：显示动画效果
 */
async function runTestMode(
  statusline: ReturnType<typeof createStatusline>,
  config: Config
) {
  let data = createMockSessionData();
  let frame = 0;

  console.log('Claude Statusline - Test Mode');
  console.log('Press Ctrl+C to exit\n');

  const interval = setInterval(async () => {
    frame++;

    // 模拟数据变化
    data = {
      ...data,
      inputTokens: Math.min(
        data.inputTokens + Math.floor(Math.random() * 1000),
        data.contextWindow * 0.95
      ),
      outputTokens: data.outputTokens + Math.floor(Math.random() * 500),
      cost: data.cost + Math.random() * 0.01,
      requests: data.requests + 1,
      lastLatency: Math.random() * 3000,
    };

    // 每 100 帧重置一次（模拟新会话）
    if (frame % 100 === 0) {
      data = createMockSessionData();
    }

    const output = await statusline.render(data);
    process.stdout.write(ANSI.cursorToStart + output);
  }, config.refreshInterval || 100);

  // 等待退出
  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      clearInterval(interval);
      resolve();
    });
  });
}

/**
 * 解析命令行参数
 */
function parseArgs(args: string[]): Config {
  const config: Config = {
    theme: 'dracula',
    refreshInterval: 1000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--theme':
      case '-t':
        config.theme = args[++i] || 'dracula';
        break;
      case '--interval':
      case '-i':
        config.refreshInterval = parseInt(args[++i] || '1000', 10);
        break;
      case '--oauth-endpoint':
        if (!config.oauth) config.oauth = { endpoint: '', token: '' };
        config.oauth.endpoint = args[++i] || '';
        break;
      case '--oauth-token':
        if (!config.oauth) config.oauth = { endpoint: '', token: '' };
        config.oauth.token = args[++i] || '';
        break;
      case '--mimo-cookie':
        // 手动指定 cookie 文件路径
        {
          const cookieFile = args[++i] || '';
          if (cookieFile && existsSync(cookieFile)) {
            try {
              const content = readFileSync(cookieFile, 'utf-8');
              const cookie = content
                .split('\n')
                .filter(line => !line.startsWith('#') && line.trim())
                .shift();
              if (cookie) {
                config.oauth = {
                  endpoint: MIMO_API_ENDPOINT,
                  token: cookie,
                };
              }
            } catch (error) {
              // 静默失败
            }
          }
        }
        break;
      case '--no-mimo':
        // 禁用 MIMO 配额查询
        config.oauth = undefined;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
Claude Statusline - Beautiful statusline for Claude Code

Usage:
  claude-statusline [options]

Options:
  --theme, -t <name>        Theme name (default: dracula)
                            Available: dracula, monokai, nord, cyberpunk,
                            tokyoNight, gruvvbox, solarizedDark, catppuccin,
                            minimalist, matrix

  --interval, -i <ms>       Refresh interval in milliseconds (default: 1000)

  --oauth-endpoint <url>    OAuth quota endpoint URL
  --oauth-token <token>     OAuth token
  --mimo-cookie <path>      MIMO cookie file path
  --no-mimo                 Disable MIMO quota query

  --test                    Run in test mode with mock data
  --help, -h                Show this help message

MIMO Integration:
  The statusline automatically reads ~/.claude/mimo-cookie.txt if it exists.
  This file should contain the full cookie string for MIMO API access.
  Cookie will be cached for 60 seconds to avoid rate limiting.

Environment Variables:
  CLAUDE_MODEL              Current model name
  CLAUDE_TOKENS             Input token count
  CLAUDE_OUTPUT_TOKENS      Output token count
  CLAUDE_MAX_TOKENS         Context window size
  CLAUDE_COST               Accumulated cost (USD)
  CLAUDE_REQUESTS           Request count
  CLAUDE_SESSION_START      Session start timestamp
  CLAUDE_LATENCY            Last API latency (ms)
  CLAUDE_API_STATUS         API status (connected/disconnected/error)

Examples:
  # Basic usage (auto-loads MIMO cookie if exists)
  claude-statusline

  # With custom theme
  claude-statusline --theme cyberpunk

  # Test mode
  claude-statusline --test

  # Disable MIMO integration
  claude-statusline --no-mimo

  # Custom MIMO cookie file
  claude-statusline --mimo-cookie /path/to/cookie.txt
`);
}

// 运行
main().catch(console.error);
