<script setup lang="ts">
import { computed, ref } from 'vue';
import ChartCard from '../components/ChartCard.vue';
import ComparisonTable from '../components/ComparisonTable.vue';
import ProductSelector from '../components/ProductSelector.vue';
import ScoreRangeFilter from '../components/ScoreRangeFilter.vue';
import SortControls from '../components/SortControls.vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import ContributionLadderChart from '../components/charts/ContributionLadderChart.vue';
import ScoreLadderChart from '../components/charts/ScoreLadderChart.vue';
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
  displayLimit,
  sortMetricOptions,
  displayLimitOptions,
  sortSummary,
  comparisonTitle,
  filterMetricId,
  scoreMin,
  scoreMax,
  scoreFilter,
  toggleProduct,
  setSelection,
  clearSelection
} = useComparison();

const totalChartRef = ref<InstanceType<typeof ScoreLadderChart> | null>(null);
const radarChartRef = ref<InstanceType<typeof GroupRadarChart> | null>(null);
const contributionChartRef = ref<InstanceType<typeof ContributionLadderChart> | null>(null);

const totalChartHeight = computed(() => {
  const base = totalEntries.value.length * 40 + 180;
  return `${Math.max(520, base)}px`;
});

const contributionChartHeight = computed(() => {
  const base = displayedProducts.value.length * 32 + 220;
  return `${Math.max(520, base)}px`;
});

function downloadTotalPng() {
  totalChartRef.value?.downloadPng('Rtings-评分天梯图');
}

function downloadRadarPng() {
  radarChartRef.value?.downloadPng('Rtings-各维度评分对比');
}

function downloadContributionPng() {
  contributionChartRef.value?.downloadPng('Rtings-各维度贡献天梯图');
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
    :score-filter="scoreFilter ?? undefined"
    :score-metric="filterMetricId"
    :score-min="scoreMin"
    :score-max="scoreMax"
    @toggle="toggleProduct"
    @select-many="setSelection"
    @clear-selection="clearSelection"
    @update:score-metric="filterMetricId = $event"
    @update:score-min="scoreMin = $event"
    @update:score-max="scoreMax = $event"
  />

  <ScoreRangeFilter
    class="mb-6"
    :metric-options="sortMetricOptions"
    :metric="filterMetricId"
    :min="scoreMin"
    :max="scoreMax"
    @update:metric="filterMetricId = $event"
    @update:min="scoreMin = $event"
    @update:max="scoreMax = $event"
  />

  <SortControls
    class="mb-6"
    :metric-options="sortMetricOptions"
    :limit-options="displayLimitOptions"
    :metric="sortMetricId"
    :limit="displayLimit"
    @update:metric="sortMetricId = $event"
    @update:limit="displayLimit = $event"
  />

  <section class="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
    <ChartCard
      :title="comparisonTitle"
      :description="sortSummary"
      fullscreen-mode="scroll"
    >
      <template #actions>
        <button :class="secondaryButtonClass" @click="downloadTotalPng">导出 PNG</button>
      </template>
      <div class="max-h-[640px] overflow-y-auto pr-1">
        <ScoreLadderChart
          ref="totalChartRef"
          :entries="totalEntries"
          :metric-label="sortMetricOptions.find(option => option.value === sortMetricId)?.label"
          :height="totalChartHeight"
          :chart-title="comparisonTitle"
        />
      </div>
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
        chart-title="各维度评分雷达图"
      />
    </ChartCard>
  </section>

  <section class="mb-8">
    <ChartCard
      title="各维度贡献天梯图"
      description="按机型展示各主维度折算贡献，堆叠长度表示综合表现"
      fullscreen-mode="scroll"
    >
      <template #actions>
        <button :class="secondaryButtonClass" @click="downloadContributionPng">导出 PNG</button>
      </template>
      <div class="max-h-[640px] overflow-y-auto pr-1">
        <ContributionLadderChart
          ref="contributionChartRef"
          :groups="topGroups"
          :products="displayedProducts"
          :height="contributionChartHeight"
          chart-title="各维度贡献天梯图"
        />
      </div>
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
