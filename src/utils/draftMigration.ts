import type { EvaluationDraft, EvaluationDraftValue } from '../types/evaluation';
import { rtingsRule } from '../data/rtingsRule';

/**
 * 结构修正前的叶子节点 -> 结构修正后的叶子节点。
 * 用于兼容已保存的本机/云端草稿，避免同一项数据因节点层级拆分而失效。
 */
const legacyLeafIdMap: Record<string, string> = {
  'mixed-usage.black-level.zone-precision': 'mixed-usage.black-level.zone-precision.item',
  'mixed-usage.processing.upscaling': 'mixed-usage.processing.upscaling.default',
  'mixed-usage.motion.zone-transitions': 'mixed-usage.motion.zone-transitions.item'
};

export function migrateDraftValues(
  values: Record<string, EvaluationDraftValue>
): Record<string, EvaluationDraftValue> {
  const migrated: Record<string, EvaluationDraftValue> = { ...values };

  for (const [legacyId, currentId] of Object.entries(legacyLeafIdMap)) {
    if (!migrated[legacyId]) continue;
    migrated[currentId] = migrated[currentId] ?? migrated[legacyId];
    delete migrated[legacyId];
  }

  // 不计入评分的历史节点不保留录入值，避免导出或后续保存继续携带旧数据。
  const includedLeafIds = new Set(
    rtingsRule.nodes
      .filter(node => node.inputType !== 'aggregate' && node.includeInParent)
      .map(node => node.id)
  );

  return Object.fromEntries(
    Object.entries(migrated).filter(([nodeId]) => includedLeafIds.has(nodeId))
  );
}

export function migrateDraft(draft: EvaluationDraft): EvaluationDraft {
  return {
    ...draft,
    values: migrateDraftValues(draft.values ?? {})
  };
}
