/**
 * 会话持续时间 Segment
 * 显示会话已进行的时间
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class DurationSegment implements Segment {
  name = 'duration';

  render(data: SessionData, theme: Theme): SegmentResult {
    const duration = Date.now() - data.startTime;
    const formatted = this.formatDuration(duration);

    const content = `${theme.colors.textSecondary}⏱${formatted}`;

    return {
      content,
      width: formatted.length + 2,
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
