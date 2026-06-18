/**
 * Session 信息 Segment
 * 显示会话 ID 或其他元信息
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class SessionSegment implements Segment {
  name = 'session';

  private sessionId: string;

  constructor() {
    // 生成短会话 ID
    this.sessionId = Math.random().toString(36).substring(2, 8);
  }

  render(data: SessionData, theme: Theme): SegmentResult {
    const content = `${theme.colors.textSecondary}#${this.sessionId}`;

    return {
      content,
      width: this.sessionId.length + 1,
    };
  }
}
