import { computed, ref } from 'vue';
import type { ScoreNode } from '../core/types';
import { getBaselineById, rtingsBaselinesV1, rtingsRuleV1 } from '../data/rtingsRule';

export function useComparison() {
  const allBaselines = rtingsBaselinesV1.items;
  const selectedIds = ref<string[]>(allBaselines.map(baseline => baseline.id));

  const selectedProducts = computed(() =>
    selectedIds.value.map(id => getBaselineById(id)!)
  );

  const topGroups = computed(() =>
    rtingsRuleV1.nodes.filter(
      node => node.parentId === rtingsRuleV1.rootId && node.includeInParent
    )
  );

  const totalEntries = computed(() =>
    selectedProducts.value.map(baseline => ({
      label: baseline.label,
      value: baseline.expectedTotal
    }))
  );

  const radarLabels = computed(() => topGroups.value.map(group => group.label));

  const radarSeries = computed(() =>
    selectedProducts.value.map(baseline => ({
      label: baseline.label,
      values: topGroups.value.map(
        (group: ScoreNode) => baseline.expectedScores[group.id] ?? null
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
    selectedProducts,
    topGroups,
    totalEntries,
    radarLabels,
    radarSeries,
    toggleProduct
  };
}

export type ComparisonContext = ReturnType<typeof useComparison>;
