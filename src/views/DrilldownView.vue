<script setup lang="ts">
import { computed, ref } from 'vue';
import CheckboxChips from '../components/CheckboxChips.vue';
import ChartCard from '../components/ChartCard.vue';
import OptionChips from '../components/OptionChips.vue';
import ProductSelector from '../components/ProductSelector.vue';
import SortControls from '../components/SortControls.vue';
import TestItemComparisonChart from '../components/charts/TestItemComparisonChart.vue';
import { useDrilldown } from '../composables/useDrilldown';
import { exportDrilldownExcel } from '../utils/export';
import { cardClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const {
  allBaselines,
  groupOptions,
  selectedGroupId,
  testItemOptions,
  selectedTestItemIds,
  selectedTestItems,
  selectedProductIds,
  sortedProducts,
  highlightIndex,
  sortMetricId,
  sortDirection,
  displayLimit,
  sortMetricOptions,
  sortDirectionOptions,
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
} = useDrilldown();

const chartRef = ref<InstanceType<typeof TestItemComparisonChart> | null>(null);
const keyword = ref('');

const filteredTestItemOptions = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return testItemOptions.value;
  return testItemOptions.value.filter(option =>
    option.label.toLowerCase().includes(text)
  );
});

const chartTypeOptions = [
  { value: 'bar', label: '柱状图' },
  { value: 'radar', label: '雷达图' }
];

function downloadPng() {
  chartRef.value?.downloadPng('Rtings-维度对比');
}

function downloadExcel() {
  exportDrilldownExcel(sortedProducts.value, selectedTestItems.value);
}

function selectFilteredTestItems() {
  setTestItemSelection(filteredTestItemOptions.value.map(option => option.value));
}

function clearTestItems() {
  setTestItemSelection([]);
}
</script>

<template>
  <section class="mb-6">
    <ProductSelector
      :products="allBaselines"
      :selected-ids="selectedProductIds"
      @toggle="toggleProduct"
      @select-many="setSelection"
      @clear-selection="clearSelection"
    />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">主维度选择</h2>
    <OptionChips class="mt-4" v-model="selectedGroupId" :options="groupOptions" />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">子维度选择</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          在当前主维度下选择要对比的子维度 · 已选 {{ selectedTestItemIds.length }} 项
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :class="secondaryButtonClass"
          :disabled="!filteredTestItemOptions.length"
          @click="selectFilteredTestItems"
        >
          全选筛选结果
        </button>
        <button
          type="button"
          :class="secondaryButtonClass"
          class="!text-red-600 hover:!bg-red-50"
          :disabled="!selectedTestItemIds.length"
          @click="clearTestItems"
        >
          清空子维度
        </button>
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索子维度"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-64"
        />
      </div>
    </div>
    <CheckboxChips
      :options="filteredTestItemOptions"
      :model-value="selectedTestItemIds"
      @toggle="toggleTestItem"
    />
  </section>

  <SortControls
    class="mb-6"
    :metric-options="sortMetricOptions"
    :direction-options="sortDirectionOptions"
    :limit-options="displayLimitOptions"
    :metric="sortMetricId"
    :direction="sortDirection"
    :limit="displayLimit"
    @update:metric="sortMetricId = $event"
    @update:direction="sortDirection = $event as typeof sortDirection"
    @update:limit="displayLimit = $event"
  />
  <p :class="['mb-6 text-sm', mutedTextClass]">{{ sortSummary }}</p>

  <ChartCard title="维度对比" :description="sortSummary">
    <template #actions>
      <OptionChips v-model="chartType" :options="chartTypeOptions" />
      <button :class="secondaryButtonClass" @click="downloadPng">导出 PNG</button>
      <button :class="primaryButtonClass" @click="downloadExcel">导出 Excel</button>
    </template>
    <TestItemComparisonChart
      ref="chartRef"
      :labels="chartLabels"
      :series="chartSeries"
      :chart-type="chartType"
      :height="chartHeight"
      :highlight-index="highlightIndex"
    />
  </ChartCard>
</template>
