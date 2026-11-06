<script setup lang="ts">
import { ref } from 'vue';
import ComparisonTable from '../components/ComparisonTable.vue';
import ProductSelector from '../components/ProductSelector.vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import GroupContributionChart from '../components/charts/GroupContributionChart.vue';
import TotalScoreChart from '../components/charts/TotalScoreChart.vue';
import { useComparison } from '../composables/useComparison';
import { exportComparisonExcel } from '../utils/export';
import { cardClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const {
  allBaselines,
  selectedIds,
  selectedProducts,
  topGroups,
  totalEntries,
  radarLabels,
  radarSeries,
  toggleProduct
} = useComparison();

const totalChartRef = ref<InstanceType<typeof TotalScoreChart> | null>(null);
const radarChartRef = ref<InstanceType<typeof GroupRadarChart> | null>(null);
const contributionChartRef = ref<InstanceType<typeof GroupContributionChart> | null>(null);

function downloadTotalPng() {
  totalChartRef.value?.downloadPng('Rtings-多产品总分对比');
}

function downloadRadarPng() {
  radarChartRef.value?.downloadPng('Rtings-顶层能力雷达对比');
}

function downloadContributionPng() {
  contributionChartRef.value?.downloadPng('Rtings-顶层贡献对比');
}

function downloadExcel() {
  exportComparisonExcel(selectedProducts.value, topGroups.value);
}
</script>

<template>
  <ProductSelector
    class="mb-6"
    :products="allBaselines"
    :selected-ids="selectedIds"
    @toggle="toggleProduct"
  />

  <section class="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
    <article :class="cardClass" class="p-6">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-gray-900">总分对比</h2>
          <p :class="['mt-1 text-sm', mutedTextClass]">Mixed Usage 总分</p>
        </div>
        <button :class="secondaryButtonClass" @click="downloadTotalPng">导出 PNG</button>
      </div>
      <TotalScoreChart ref="totalChartRef" :entries="totalEntries" height="520px" />
    </article>

    <article :class="cardClass" class="p-6">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-gray-900">顶层能力分布</h2>
          <p :class="['mt-1 text-sm', mutedTextClass]">按顶层分组对比能力轮廓</p>
        </div>
        <button :class="secondaryButtonClass" @click="downloadRadarPng">导出 PNG</button>
      </div>
      <GroupRadarChart
        ref="radarChartRef"
        :labels="radarLabels"
        :series="radarSeries"
        height="560px"
      />
    </article>
  </section>

  <section class="mb-8">
    <article :class="cardClass" class="p-6">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-gray-900">顶层贡献对比</h2>
          <p :class="['mt-1 text-sm', mutedTextClass]">
            展示每个分组按权重折算后的实际贡献，定位总分差异来源
          </p>
        </div>
        <button :class="secondaryButtonClass" @click="downloadContributionPng">导出 PNG</button>
      </div>
      <GroupContributionChart
        ref="contributionChartRef"
        :groups="topGroups"
        :products="selectedProducts"
        height="520px"
      />
    </article>
  </section>

  <section class="mb-8">
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">对比明细</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">数据来源为工作簿已确认基准分</p>
      </div>
      <button :class="primaryButtonClass" @click="downloadExcel">导出 Excel</button>
    </div>
    <ComparisonTable :groups="topGroups" :products="selectedProducts" />
  </section>
</template>
