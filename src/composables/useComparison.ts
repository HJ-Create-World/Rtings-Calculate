import { computed, ref, watch } from 'vue';
import type { ScoreNode } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';
import { useEvaluationLibrary } from './useEvaluationLibrary';

export function useComparison() {
  const { allBaselines, refreshEvaluationLibrary, getEvaluationProductById } = useEvaluationLibrary();
  void refreshEvaluationLibrary();

  const selectedIds = ref<string[]>(allBaselines.value.slice(0, 6).map(baseline => baseline.id));

  const selectedProducts = computed(() =>
    selectedIds.value
      .map(id => getEvaluationProductById(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
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

  watch(
    allBaselines,
    products => {
      if (!selectedIds.value.length && products.length) {
        selectedIds.value = products.slice(0, 6).map(product => product.id);
      }
    },
    { immediate: true }
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
