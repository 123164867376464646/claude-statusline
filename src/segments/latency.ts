/**
 * API 响应延迟 Segment
 * 显示最后一次 API 调用的延迟
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class LatencySegment implements Segment {
  name = 'latency';

  render(data: SessionData, theme: Theme): SegmentResult {
    const latency = data.lastLatency;

    let color: string;
    if (latency > 5000) {
      color = theme.colors.critical;
    } else if (latency > 2000) {
      color = theme.colors.warning;
    } else {
      color = theme.colors.success;
    }

    const formatted = this.formatLatency(latency);
    const content = `${color}🌐${formatted}`;

    return {
      content,
      width: formatted.length + 2,
    };
  }

  private formatLatency(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms)}ms`;
  }
}
