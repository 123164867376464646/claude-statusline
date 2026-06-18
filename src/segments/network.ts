/**
 * 网络状态 Segment
 * 显示 API 连接状态
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class NetworkSegment implements Segment {
  name = 'network';

  render(data: SessionData, theme: Theme): SegmentResult {
    let icon: string;
    let color: string;
    let label: string;

    switch (data.apiStatus) {
      case 'connected':
        icon = '●';
        color = theme.colors.success;
        label = '在线';
        break;
      case 'disconnected':
        icon = '○';
        color = theme.colors.warning;
        label = '离线';
        break;
      case 'error':
        icon = '✕';
        color = theme.colors.critical;
        label = '错误';
        break;
    }

    const content = `${color}${icon} ${label}`;

    return {
      content,
      width: label.length + 2,
    };
  }
}
