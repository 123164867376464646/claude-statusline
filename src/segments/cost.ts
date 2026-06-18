/**
 * 当前花费 Segment
 * 显示累计消耗的美金金额
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class CostSegment implements Segment {
  name = 'cost';

  render(data: SessionData, theme: Theme): SegmentResult {
    const cost = data.cost;

    // 根据花费选择颜色
    let color: string;
    if (cost > 10) {
      color = theme.colors.critical;
    } else if (cost > 5) {
      color = theme.colors.warning;
    } else {
      color = theme.colors.value;
    }

    const content = `${color}$${cost.toFixed(4)}`;

    return {
      content,
      width: content.length - color.length + 1,
    };
  }
}
