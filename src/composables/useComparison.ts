import { computed, ref, watch } from 'vue';
import type { ScoreNode } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';
import { useEvaluationLibrary } from './useEvaluationLibrary';
import { getMainDimensionNodes } from '../utils/ruleDisplay';

export function useComparison() {
  const { allBaselines, refreshEvaluationLibrary, getEvaluationProductById } = useEvaluationLibrary();
  void refreshEvaluationLibrary();

  const selectedIds = ref<string[]>(allBaselines.value.slice(0, 6).map(baseline => baseline.id));
  const sortMetricId = ref('total');
  const displayLimit = ref('10');

  const selectedProducts = computed(() =>
    selectedIds.value
      .map(id => getEvaluationProductById(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
  );

  const topGroups = computed(() =>
    getMainDimensionNodes(rtingsRule.nodes).filter(
      node => node.includeInParent
    )
  );

  const sortMetricOptions = computed(() => [
    { value: 'total', label: 'Mixed Usage 总分' },
    ...topGroups.value.map(group => ({ value: group.id, label: group.label }))
  ]);

  const displayLimitOptions = [
    { value: '10', label: 'Top 10' },
    { value: '20', label: 'Top 20' },
    { value: 'all', label: '全部' }
  ];

  function getSortValue(baseline: NonNullable<ReturnType<typeof getEvaluationProductById>>): number | null {
    if (sortMetricId.value === 'total') return baseline.expectedTotal;
    return baseline.expectedScores[sortMetricId.value] ?? null;
  }

  const sortedProducts = computed(() => {
    return [...selectedProducts.value].sort((left, right) => {
      const leftValue = getSortValue(left);
      const rightValue = getSortValue(right);
      if (leftValue === null && rightValue === null) return left.label.localeCompare(right.label, 'zh-CN');
      if (leftValue === null) return 1;
      if (rightValue === null) return -1;
      const diff = rightValue - leftValue;
      return diff || left.label.localeCompare(right.label, 'zh-CN');
    });
  });

  const displayedProducts = computed(() => {
    if (displayLimit.value === 'all') return sortedProducts.value;
    const limit = Number(displayLimit.value);
    return sortedProducts.value.slice(0, limit);
  });

  const totalEntries = computed(() =>
    displayedProducts.value.map((baseline, index) => ({
      label: baseline.label,
      value: getSortValue(baseline),
      rank: index + 1
    }))
  );

  const radarLabels = computed(() => topGroups.value.map(group => group.label));

  const radarSeries = computed(() =>
    displayedProducts.value.map(baseline => ({
      label: baseline.label,
      values: topGroups.value.map(
        (group: ScoreNode) => baseline.expectedScores[group.id] ?? null
      )
    }))
  );

  const comparisonTitle = computed(() => {
    if (sortMetricId.value === 'total') return 'Mixed Usage 总分天梯图';
    const metric = sortMetricOptions.value.find(option => option.value === sortMetricId.value)?.label ?? '';
    return metric ? `${metric} 天梯图` : '维度对比天梯图';
  });

  const sortSummary = computed(() => {
    const metric = sortMetricOptions.value.find(option => option.value === sortMetricId.value)?.label ?? '总分';
    const shown = displayedProducts.value.length;
    return `按 ${metric} 高分 → 低分 排序 · 展示 ${shown} / ${selectedProducts.value.length} 台`;
  });

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

  function setSelection(productIds: string[]) {
    selectedIds.value = productIds;
  }

  function clearSelection() {
    selectedIds.value = [];
  }

  return {
    allBaselines,
    selectedIds,
    selectedProducts,
    sortedProducts,
    displayedProducts,
    topGroups,
    totalEntries,
    radarLabels,
    radarSeries,
    sortMetricId,
    displayLimit,
    sortMetricOptions,
    displayLimitOptions,
    sortSummary,
    comparisonTitle,
    toggleProduct,
    setSelection,
    clearSelection
  };
}

export type ComparisonContext = ReturnType<typeof useComparison>;
