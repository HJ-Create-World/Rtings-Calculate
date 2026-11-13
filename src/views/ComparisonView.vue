<script setup lang="ts">
import { ref } from 'vue';
import ChartCard from '../components/ChartCard.vue';
import ComparisonTable from '../components/ComparisonTable.vue';
import ProductSelector from '../components/ProductSelector.vue';
import SortControls from '../components/SortControls.vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import GroupContributionChart from '../components/charts/GroupContributionChart.vue';
import TotalScoreChart from '../components/charts/TotalScoreChart.vue';
import { useComparison } from '../composables/useComparison';
import { exportComparisonExcel } from '../utils/export';
import { mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const {
  allBaselines,
  selectedIds,
  sortedProducts,
  displayedProducts,
  topGroups,
  totalEntries,
  radarLabels,
  radarSeries,
  sortMetricId,
  sortDirection,
  displayLimit,
  sortMetricOptions,
  sortDirectionOptions,
  displayLimitOptions,
  sortSummary,
  toggleProduct,
  setSelection,
  clearSelection
} = useComparison();

const totalChartRef = ref<InstanceType<typeof TotalScoreChart> | null>(null);
const radarChartRef = ref<InstanceType<typeof GroupRadarChart> | null>(null);
const contributionChartRef = ref<InstanceType<typeof GroupContributionChart> | null>(null);

function downloadTotalPng() {
  totalChartRef.value?.downloadPng('Rtings-多产品总分对比');
}

function downloadRadarPng() {
  radarChartRef.value?.downloadPng('Rtings-各维度评分对比');
}

function downloadContributionPng() {
  contributionChartRef.value?.downloadPng('Rtings-各维度对比评分');
}

function downloadExcel() {
  exportComparisonExcel(sortedProducts.value, topGroups.value);
}
</script>

<template>
  <ProductSelector
    class="mb-6"
    :products="allBaselines"
    :selected-ids="selectedIds"
    @toggle="toggleProduct"
    @select-many="setSelection"
    @clear-selection="clearSelection"
  />

  <SortControls
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

  <section class="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
    <ChartCard title="总分对比" description="Mixed Usage 总分">
      <template #actions>
        <button :class="secondaryButtonClass" @click="downloadTotalPng">导出 PNG</button>
      </template>
      <TotalScoreChart ref="totalChartRef" :entries="totalEntries" height="520px" />
    </ChartCard>

    <ChartCard title="各维度评分" description="按主维度对比评分轮廓">
      <template #actions>
        <button :class="secondaryButtonClass" @click="downloadRadarPng">导出 PNG</button>
      </template>
      <GroupRadarChart
        ref="radarChartRef"
        :labels="radarLabels"
        :series="radarSeries"
        height="560px"
      />
    </ChartCard>
  </section>

  <section class="mb-8">
    <ChartCard
      title="各维度对比评分"
      description="展示每个主维度按权重折算后的实际贡献，定位总分差异来源"
    >
      <template #actions>
        <button :class="secondaryButtonClass" @click="downloadContributionPng">导出 PNG</button>
      </template>
      <GroupContributionChart
        ref="contributionChartRef"
        :groups="topGroups"
        :products="displayedProducts"
        height="520px"
      />
    </ChartCard>
  </section>

  <section class="mb-8">
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
      <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">对比明细</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">包含 Rtings 基准、云端与本机评测数据</p>
      </div>
      <button :class="primaryButtonClass" @click="downloadExcel">导出 Excel</button>
    </div>
    <ComparisonTable :groups="topGroups" :products="displayedProducts" />
  </section>
</template>
