import { computed, ref } from 'vue';
import type { ScoreNode } from '../core/types';
import { getV3BaselineById, rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';

export function useComparison() {
  const allBaselines = rtingsBaselinesV3.items;
  const selectedIds = ref<string[]>(allBaselines.slice(0, 6).map(baseline => baseline.id));

  const selectedProducts = computed(() =>
    selectedIds.value.map(id => getV3BaselineById(id)!)
  );

  const topGroups = computed(() =>
    rtingsRule.nodes.filter(
      node => node.parentId === rtingsRule.rootId && node.includeInParent
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
