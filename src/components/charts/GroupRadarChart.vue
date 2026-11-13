<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

const props = defineProps<{
  labels: string[];
  series: Array<{ label: string; values: Array<number | null> }>;
  height?: string;
  chartTitle?: string;
}>();

const configuration = computed<ChartConfiguration<'radar'>>(() => ({
  type: 'radar',
  data: {
    labels: props.labels,
    datasets: props.series.map((series, index) => ({
      label: series.label,
      data: series.values,
      borderColor: corporatePalette[index % corporatePalette.length],
      backgroundColor: `${corporatePalette[index % corporatePalette.length]}1A`,
      pointBackgroundColor: corporatePalette[index % corporatePalette.length],
      borderWidth: 2
    }))
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, backdropColor: 'transparent' },
        grid: { color: '#f3f4f6' },
        angleLines: { color: '#e5e7eb' },
        pointLabels: { color: '#374151' }
      }
    }
  }
}));
const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null);

function downloadPng(fileName: string) {
  baseChartRef.value?.downloadPng(fileName);
}

defineExpose({ downloadPng });
</script>

<template>
  <BaseChart
    ref="baseChartRef"
    :configuration="configuration"
    :height="height"
    :chart-title="chartTitle"
    label="主维度评分雷达图"
  />
</template>
