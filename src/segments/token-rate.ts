/**
 * Token 消耗速率 Segment
 * 显示每秒 Token 消耗量
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class TokenRateSegment implements Segment {
  name = 'tokenRate';

  private lastTokens = 0;
  private lastTime = Date.now();
  private rate = 0;

  render(data: SessionData, theme: Theme): SegmentResult {
    const currentTokens = data.inputTokens + data.outputTokens;
    const now = Date.now();
    const elapsed = (now - this.lastTime) / 1000;

    if (elapsed > 0) {
      this.rate = (currentTokens - this.lastTokens) / elapsed;
      this.lastTokens = currentTokens;
      this.lastTime = now;
    }

    let color: string;
    if (this.rate > 1000) {
      color = theme.colors.warning;
    } else if (this.rate > 500) {
      color = theme.colors.accent;
    } else {
      color = theme.colors.textSecondary;
    }

    const formatted = this.formatRate(this.rate);
    const content = `${color}📊${formatted}/s`;

    return {
      content,
      width: formatted.length + 4,
    };
  }

  private formatRate(rate: number): string {
    if (rate >= 1000) return `${(rate / 1000).toFixed(1)}K`;
    return Math.round(rate).toString();
  }
}
