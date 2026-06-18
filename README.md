# Claude Statusline

为 Claude Code 打造的精美状态栏，一行配置开箱即用。

## 效果预览

```
💰110/110百M 🎁25/32百M │ ████████████████░░░░ │ 150K/200K (75.0%) │ $1.2345 │ mimo-v2.5-pro │ ⚡50/60 │ ⏱28m58s │ 📊69.7K/s │ 🌐1.9s │ ● 在线 │ #f6y44y
```

## 快速开始

### 1. 克隆 & 安装

```bash
git clone git@github.com:123164867376464646/claude-statusline.git
cd claude-statusline
npm install
npm run build
```

### 2. 配置 Claude Code

编辑 `~/.claude/settings.json`，添加 `statusLine`：

```json
{
  "statusLine": {
    "command": "node /path/to/claude-statusline/dist/improved-cli.js",
    "padding": 2,
    "type": "command"
  }
}
```

**重启 Claude Code 即可生效！**

## MIMO 配额集成

如果你使用 MIMO 平台，可以自动显示套餐和补偿积分。

### 方式一：手动配置 Cookie

将浏览器中复制的完整 Cookie 保存到 `~/.claude/mimo-cookie.txt`：

```
api-platform_serviceToken="xxx"; userId=xxx; ...
```

### 方式二：自动获取 Cookie（推荐）

使用内置的 Playwright 工具自动获取和更新 Cookie：

```bash
# 首次运行（会打开浏览器，手动登录一次）
npm run fetch-cookie

# 后续自动更新（无头模式）
npm run fetch-cookie:auto
```

**设置定时任务（每 12 小时自动更新）：**

Windows：以管理员权限运行 `tools/setup-scheduled-task.bat`

Linux/Mac：
```bash
crontab -e
# 添加：
0 */12 * * * cd /path/to/claude-statusline && node tools/mimo-cookie-fetcher.js --auto
```

## 功能特性

- **9 个数据段**：配额、进度条、Context、花费、模型、速率、时长、延迟、网络
- **彩虹进度条**：Context > 90% 自动触发彩虹警告
- **MIMO 集成**：自动读取 Cookie，60 秒缓存
- **零依赖运行**：仅需 Node.js

## 数据段说明

| 段 | 说明 | 颜色警告 |
|----|------|----------|
| 💰 | 套餐积分 | <30% 黄，<10% 红 |
| 🎁 | 补偿积分 | <30% 黄，<10% 红 |
| █░ | 进度条 | >70% 黄，>90% 彩虹 |
| Context | Token 用量 | >70% 黄，>90% 红 |
| $ | 花费 | >$5 黄，>$10 红 |
| Model | 模型名称 | - |
| ⚡ | 速率限制 | <50% 黄，<20% 红 |
| ⏱ | 时长 | - |
| 📊 | Token 速率 | >500 蓝，>1000 黄 |
| 🌐 | 延迟 | >2s 黄，>5s 红 |
| ● | 网络状态 | 在线/离线/错误 |

## License

MIT
