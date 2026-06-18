/**
 * 速率限制 Segment
 * 显示剩余请求数和 Token 数的安全线提示
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

/** 模拟速率限制数据（实际应从 API 获取） */
interface RateLimitData {
  requestsRemaining: number;
  requestsTotal: number;
  tokensRemaining: number;
  tokensTotal: number;
}

export class RateLimitSegment implements Segment {
  name = 'rateLimit';

  // 模拟数据（实际应用中应从 API 获取）
  private rateLimitData: RateLimitData = {
    requestsRemaining: 50,
    requestsTotal: 60,
    tokensRemaining: 800_000,
    tokensTotal: 1_000_000,
  };

  render(data: SessionData, theme: Theme): SegmentResult {
    const { requestsRemaining, requestsTotal } = this.rateLimitData;
    const percent = requestsRemaining / requestsTotal;

    let color: string;
    if (percent < 0.2) {
      color = theme.colors.critical;
    } else if (percent < 0.5) {
      color = theme.colors.warning;
    } else {
      color = theme.colors.success;
    }

    const content = `${color}⚡${requestsRemaining}/${requestsTotal}`;

    return {
      content,
      width: content.length - color.length + 1,
    };
  }
}
