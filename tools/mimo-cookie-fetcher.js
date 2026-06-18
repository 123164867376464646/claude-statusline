#!/usr/bin/env node
/**
 * MIMO Cookie 自动获取工具
 * 使用 Playwright 获取 MIMO 平台的 cookie
 *
 * 使用方法：
 *   node mimo-cookie-fetcher.js          # 首次运行，手动登录
 *   node mimo-cookie-fetcher.js --auto   # 自动模式，使用已保存的登录状态
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'mimo-cookie.txt');
const BROWSER_DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'tools', '.browser-data');

// MIMO 平台 URL
const MIMO_URL = 'https://platform.xiaomimimo.com/console/plan-manage';

async function fetchCookie(autoMode = false) {
  console.log('🚀 启动浏览器...');

  // 使用持久化上下文保存登录状态
  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: autoMode,  // 自动模式下无头运行
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    console.log('📡 访问 MIMO 平台...');
    await page.goto(MIMO_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // 检查是否需要登录
    const currentUrl = page.url();
    if (currentUrl.includes('account.xiaomi.com') || currentUrl.includes('serviceLogin')) {
      if (autoMode) {
        console.log('❌ 自动模式下需要登录，请先运行手动模式：node mimo-cookie-fetcher.js');
        await context.close();
        process.exit(1);
      }

      console.log('🔐 请在浏览器中完成登录...');
      console.log('   登录完成后，脚本会自动继续');

      // 等待用户登录完成（URL 变为 MIMO 平台）
      await page.waitForURL('**/platform.xiaomimimo.com/**', { timeout: 300000 }); // 5 分钟超时
      console.log('✅ 登录成功！');
    }

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    console.log('🍪 正在获取 cookie...');

    // 获取所有 cookie
    const cookies = await context.cookies();

    // 找到 api-platform_serviceToken
    const serviceToken = cookies.find(c => c.name === 'api-platform_serviceToken');

    if (!serviceToken) {
      console.error('❌ 未找到 api-platform_serviceToken');
      await context.close();
      process.exit(1);
    }

    // 构建完整的 cookie 字符串
    const cookieString = cookies
      .filter(c => c.domain.includes('xiaomimimo.com'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // 保存到文件
    const fileContent = `# MIMO 平台 Cookie
# 自动生成于 ${new Date().toLocaleString('zh-CN')}
# 注意：cookie 约 1 天过期，脚本会自动更新

${cookieString}
`;

    fs.writeFileSync(COOKIE_FILE, fileContent, 'utf-8');
    console.log(`✅ Cookie 已保存到: ${COOKIE_FILE}`);
    console.log(`📝 Cookie 长度: ${cookieString.length} 字符`);

    // 测试 API 调用
    console.log('🧪 测试 API 调用...');
    const response = await page.evaluate(async () => {
      const resp = await fetch('https://platform.xiaomimimo.com/api/v1/tokenPlan/usage', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'cc-switch/1.0',
        },
      });
      return resp.json();
    });

    if (response.code === 0) {
      console.log('✅ API 测试成功！');
      const items = response.data?.usage?.items || [];
      items.forEach(item => {
        const remaining = ((item.limit - item.used) / 1000000 / 100).toFixed(0);
        const total = (item.limit / 1000000 / 100).toFixed(0);
        console.log(`   ${item.name}: ${remaining}百M / ${total}百M`);
      });
    } else {
      console.log('⚠️  API 返回异常:', response.message);
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await context.close();
    process.exit(1);
  } finally {
    await context.close();
  }
}

// 主程序
const args = process.argv.slice(2);
const autoMode = args.includes('--auto');

if (autoMode) {
  console.log('🤖 自动模式：使用已保存的登录状态');
} else {
  console.log('👤 手动模式：首次运行或需要重新登录');
}

fetchCookie(autoMode).catch(console.error);
