/**
 * Context 用量 Segment
 * 显示当前 Prompt/Completion Token 占总 Context Window 的百分比
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class ContextSegment implements Segment {
  name = 'context';

  render(data: SessionData, theme: Theme): SegmentResult {
    const totalTokens = data.inputTokens + data.outputTokens;
    const percent = data.contextWindow > 0 ? totalTokens / data.contextWindow : 0;
    const percentStr = (percent * 100).toFixed(1);

    // 根据百分比选择颜色
    let color: string;
    if (percent > 0.9) {
      color = theme.colors.critical;
    } else if (percent > 0.7) {
      color = theme.colors.warning;
    } else {
      color = theme.colors.success;
    }

    // 格式化 token 数量
    const formatTokens = (n: number): string => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
      return String(n);
    };

    const content = `${color}${formatTokens(totalTokens)}/${formatTokens(data.contextWindow)} (${percentStr}%)`;

    return {
      content,
      width: content.length - color.length - 1, // 减去 ANSI 转义序列长度
    };
  }
}
