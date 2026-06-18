/**
 * 当前模型 Segment
 * 显示模型简称
 */

import type { SessionData, Theme, Segment, SegmentResult } from '../types.js';

export class ModelSegment implements Segment {
  name = 'model';

  render(data: SessionData, theme: Theme): SegmentResult {
    // 简化模型名称
    const model = this.simplifyModelName(data.model);

    const content = `${theme.colors.accent}${model}`;

    return {
      content,
      width: model.length,
    };
  }

  private simplifyModelName(model: string): string {
    // claude-3-7-sonnet → sonnet-3.7
    // claude-3-opus → opus-3
    // mimo-v2.5-pro → mimo-v2.5
    return model
      .replace(/^claude-/, '')
      .replace(/-sonnet$/, '')
      .replace(/-opus$/, '')
      .replace(/-haiku$/, '')
      .replace(/-pro$/, '')
      .replace(/-max$/, '')
      .replace(/^(\d+)-(\d+)/, '$1.$2');
  }
}
