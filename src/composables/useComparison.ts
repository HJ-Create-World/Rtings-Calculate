import { computed, ref } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationInputs, ScoreNode } from '../core/types';
import {
  getBaselineById,
  rtingsBaselinesV1,
  rtingsRuleV1
} from '../data/rtingsRule';

export function useComparison() {
  const allBaselines = rtingsBaselinesV1.items;
  const selectedIds = ref<string[]>(allBaselines.map(baseline => baseline.id));

  const selectedResults = computed(() =>
    selectedIds.value.map(id => {
      const baseline = getBaselineById(id)!;
      const result = evaluateRule(
        rtingsRuleV1,
        baseline.inputs as EvaluationInputs
      );
      return { baseline, result };
    })
  );

  const topGroups = computed(() =>
    rtingsRuleV1.nodes.filter(
      node => node.parentId === rtingsRuleV1.rootId && node.includeInParent
    )
  );

  const totalEntries = computed(() =>
    selectedResults.value.map(({ baseline, result }) => ({
      label: baseline.label,
      value: result.value
    }))
  );

  const radarLabels = computed(() => topGroups.value.map(group => group.label));

  const radarSeries = computed(() =>
    selectedResults.value.map(({ baseline, result }) => ({
      label: baseline.label,
      values: topGroups.value.map(
        (group: ScoreNode) => result.nodes[group.id]?.value ?? null
      )
    }))
  );

  function toggleProduct(productId: string) {
    selectedIds.value = selectedIds.value.includes(productId)
      ? selectedIds.value.filter(id => id !== productId)
      : [...selectedIds.value, productId];
  }

  return {
    allBaselines,
    selectedIds,
    selectedResults,
    topGroups,
    totalEntries,
    radarLabels,
    radarSeries,
    toggleProduct
  };
}

export type ComparisonContext = ReturnType<typeof useComparison>;
