# Claude Statusline

为 Claude Code 打造的精美状态栏，一行配置开箱即用。

## 效果预览

```
💰110/110百M 🎁25/32百M │ ████████████████░░░░ │ 150K/200K (75.0%) │ $1.2345 │ sonnet │ ⚡50/60 │ ⏱28m58s │ 📊69.7K/s │ 🌐1.9s │ ● 在线 │ #f6y44y
```

## 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:123164867376464646/claude-statusline.git
cd claude-statusline
```

### 2. 安装依赖 & 构建

```bash
npm install
npm run build
```

### 3. 配置 Claude Code

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

## 功能特性

- **9 个数据段**：Context 用量、花费、模型、速率限制、持续时间、Token 速率、延迟、网络状态、会话 ID
- **彩虹进度条**：Context > 90% 自动触发彩虹警告
- **MIMO 配额集成**：自动读取 `~/.claude/mimo-cookie.txt`，显示套餐和补偿积分
- **60 秒缓存**：避免频繁请求 API

## MIMO 用户

如果你使用 MIMO 平台，只需将 cookie 保存到 `~/.claude/mimo-cookie.txt`：

```bash
# 文件内容格式（从浏览器 F12 复制完整 Cookie）
api-platform_serviceToken="xxx"; userId=xxx; ...
```

脚本会自动读取并显示配额信息，60 秒自动刷新。

## 数据段说明

| 段 | 说明 | 颜色警告 |
|----|------|----------|
| 💰 | 套餐积分 | <30% 黄，<10% 红 |
| 🎁 | 补偿积分 | <30% 黄，<10% 红 |
| █░ | 进度条 | >70% 黄，>90% 彩虹 |
| Context | Token 用量/总量 | >70% 黄，>90% 红 |
| $ | 累计花费 | >$5 黄，>$10 红 |
| Model | 模型简称 | - |
| ⚡ | 速率限制 | <50% 黄，<20% 红 |
| ⏱ | 会话时长 | - |
| 📊 | Token 速率 | >500 蓝，>1000 黄 |
| 🌐 | API 延迟 | >2s 黄，>5s 红 |
| ● | 网络状态 | 在线/离线/错误 |

## 技术栈

- TypeScript + Node.js
- 零外部运行时依赖（仅标准库）
- 60 秒 TTL 缓存避免限流
- 单次输出，兼容 Claude Code 机制

## License

MIT
