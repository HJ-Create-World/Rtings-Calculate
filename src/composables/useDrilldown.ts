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
  const selectedProducts = computed(() =>
    selectedProductIds.value
      .map(id => getEvaluationProductById(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
  );

  const selectedTestItems = computed(() =>
    testItems.value.filter(item => selectedTestItemIds.value.includes(item.id))
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
    selectedProducts.value.map(product => ({
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

  return {
    allBaselines,
    groupOptions,
    selectedGroupId,
    testItemOptions,
    selectedTestItemIds,
    selectedTestItems,
    selectedProductIds,
    selectedProducts,
    chartLabels,
    chartSeries,
    chartType,
    chartHeight,
    toggleProduct,
    toggleTestItem
  };
}

export type DrilldownContext = ReturnType<typeof useDrilldown>;
