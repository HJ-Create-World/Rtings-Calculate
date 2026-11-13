import { computed, ref, watch } from 'vue';
import type { ScoreNode } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';
import { useEvaluationLibrary } from './useEvaluationLibrary';
import { getChildrenByDocumentOrder, getMainDimensionNodes } from '../utils/ruleDisplay';

function collectTestItems(nodeId: string): ScoreNode[] {
  return getChildrenByDocumentOrder(nodeId).flatMap(child => {
    if (child.inputType !== 'aggregate') return [child];
    return collectTestItems(child.id);
  });
}

export function useDrilldown() {
  const { allBaselines, refreshEvaluationLibrary, getEvaluationProductById } = useEvaluationLibrary();
  void refreshEvaluationLibrary();
  const groups = getMainDimensionNodes();
  const groupOptions = groups.map(group => ({ value: group.id, label: group.label }));
  const selectedGroupId = ref(groups[0]?.id ?? '');

  const testItems = computed(() => collectTestItems(selectedGroupId.value));
  const testItemOptions = computed(() =>
    testItems.value.map(item => {
      const parent = rtingsRule.nodes.find(node => node.id === item.parentId);
      return {
        value: item.id,
        label: parent && parent.kind === 'dimension'
          ? `${parent.label} / ${item.label}`
          : item.label
      };
    })
  );

  const selectedTestItemIds = ref<string[]>(
    testItems.value.slice(0, 6).map(item => item.id)
  );

  watch(selectedGroupId, () => {
    selectedTestItemIds.value = testItems.value.slice(0, 6).map(item => item.id);
  });

  const selectedProductIds = ref(allBaselines.value.slice(0, 6).map(baseline => baseline.id));
  const sortMetricId = ref('average');
  const displayLimit = ref('10');

  const selectedProducts = computed(() =>
    selectedProductIds.value
      .map(id => getEvaluationProductById(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
  );

  const selectedTestItems = computed(() =>
    testItems.value.filter(item => selectedTestItemIds.value.includes(item.id))
  );

  const sortMetricOptions = computed(() => [
    { value: 'average', label: '已选测试项均值' },
    { value: 'weighted', label: '已选测试项加权均值' },
    ...selectedTestItems.value.map(item => {
      const parent = rtingsRule.nodes.find(node => node.id === item.parentId);
      const prefix = parent && parent.kind === 'dimension' ? `${parent.label} / ` : '';
      return { value: item.id, label: `${prefix}${item.label}` };
    })
  ]);

  const displayLimitOptions = [
    { value: '10', label: 'Top 10' },
    { value: '20', label: 'Top 20' },
    { value: 'all', label: '全部' }
  ];

  function getSortValue(product: NonNullable<ReturnType<typeof getEvaluationProductById>>): number | null {
    const scores = selectedTestItems.value
      .map(item => product.expectedScores[item.id])
      .filter((score): score is number => typeof score === 'number');

    if (sortMetricId.value === 'average') {
      return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    }
    if (sortMetricId.value === 'weighted') {
      const weighted = selectedTestItems.value
        .map(item => {
          const score = product.expectedScores[item.id];
          return typeof score === 'number' ? score * (item.weight ?? 0) : null;
        })
        .filter((score): score is number => typeof score === 'number');
      const weightSum = selectedTestItems.value
        .filter(item => typeof product.expectedScores[item.id] === 'number')
        .reduce((sum, item) => sum + (item.weight ?? 0), 0);
      return weightSum > 0 ? weighted.reduce((sum, score) => sum + score, 0) / weightSum : null;
    }
    return product.expectedScores[sortMetricId.value] ?? null;
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

  const highlightItemId = computed(() =>
    sortMetricId.value !== 'average' && sortMetricId.value !== 'weighted'
      ? sortMetricId.value
      : null
  );

  const highlightIndex = computed(() =>
    highlightItemId.value === null
      ? null
      : selectedTestItems.value.findIndex(item => item.id === highlightItemId.value)
  );

  const sortSummary = computed(() => {
    const metric = sortMetricOptions.value.find(option => option.value === sortMetricId.value)?.label ?? '均值';
    const shown = displayedProducts.value.length;
    return `按 ${metric} 高分 → 低分 排序 · 展示 ${shown} / ${selectedProducts.value.length} 台`;
  });

  watch(
    selectedTestItemIds,
    items => {
      if (!['average', 'weighted'].includes(sortMetricId.value) && !items.includes(sortMetricId.value)) {
        sortMetricId.value = 'average';
      }
    },
    { deep: true }
  );

  const chartLabels = computed(() =>
    selectedTestItems.value.map(item => {
      const parent = rtingsRule.nodes.find(node => node.id === item.parentId);
      return parent && parent.kind === 'dimension'
        ? `${parent.label} / ${item.label}`
        : item.label;
    })
  );

  const chartSeries = computed(() =>
    displayedProducts.value.map(product => ({
      label: product.label,
      values: selectedTestItems.value.map(
        item => product.expectedScores[item.id] ?? null
      )
    }))
  );

  const chartType = ref<'bar' | 'radar'>('bar');
  const chartHeight = computed(() =>
    chartType.value === 'radar'
      ? '560px'
      : `${Math.max(420, selectedTestItems.value.length * 84 + 140)}px`
  );

  function toggleProduct(productId: string) {
    selectedProductIds.value = selectedProductIds.value.includes(productId)
      ? selectedProductIds.value.filter(id => id !== productId)
      : [...selectedProductIds.value, productId];
  }

  function toggleTestItem(nodeId: string) {
    selectedTestItemIds.value = selectedTestItemIds.value.includes(nodeId)
      ? selectedTestItemIds.value.filter(id => id !== nodeId)
      : [...selectedTestItemIds.value, nodeId];
  }

  function setTestItemSelection(nodeIds: string[]) {
    selectedTestItemIds.value = nodeIds;
  }

  function setSelection(productIds: string[]) {
    selectedProductIds.value = productIds;
  }

  function clearSelection() {
    selectedProductIds.value = [];
  }

  return {
    allBaselines,
    groupOptions,
    selectedGroupId,
    testItemOptions,
    selectedTestItemIds,
    selectedTestItems,
    selectedProductIds,
    selectedProducts,
    sortedProducts,
    displayedProducts,
    highlightItemId,
    highlightIndex,
    sortMetricId,
    displayLimit,
    sortMetricOptions,
    displayLimitOptions,
    sortSummary,
    chartLabels,
    chartSeries,
    chartType,
    chartHeight,
    toggleProduct,
    setSelection,
    clearSelection,
    toggleTestItem,
    setTestItemSelection
  };
}

export type DrilldownContext = ReturnType<typeof useDrilldown>;
