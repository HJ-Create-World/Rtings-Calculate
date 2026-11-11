<script setup lang="ts">
import { computed, ref } from 'vue';
import CheckboxChips from '../components/CheckboxChips.vue';
import ChartCard from '../components/ChartCard.vue';
import OptionChips from '../components/OptionChips.vue';
import ProductSelector from '../components/ProductSelector.vue';
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
  selectedProducts,
  chartLabels,
  chartSeries,
  chartType,
  chartHeight,
  toggleProduct,
  toggleTestItem
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
  exportDrilldownExcel(selectedProducts.value, selectedTestItems.value);
}
</script>

<template>
  <section class="mb-6">
    <ProductSelector
      :products="allBaselines"
      :selected-ids="selectedProductIds"
      @toggle="toggleProduct"
    />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">主维度选择</h2>
    <OptionChips v-model="selectedGroupId" :options="groupOptions" />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">子维度选择</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          已选 {{ selectedTestItemIds.length }} 项 · 可筛选后勾选
        </p>
      </div>
      <input
        v-model="keyword"
        type="search"
        placeholder="搜索子维度"
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:w-72"
      />
    </div>
    <CheckboxChips
      :options="filteredTestItemOptions"
      :model-value="selectedTestItemIds"
      @toggle="toggleTestItem"
    />
  </section>

  <ChartCard title="维度对比" description="图表高度随选中子维度数量自适应，便于查看细节">
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
    />
  </ChartCard>
</template>
