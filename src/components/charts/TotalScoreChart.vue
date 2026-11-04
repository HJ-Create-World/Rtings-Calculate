<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

const props = defineProps<{
  entries: Array<{ label: string; value: number | null }>;
  height?: string;
}>();

const configuration = computed<ChartConfiguration<'bar'>>(() => ({
  type: 'bar',
  data: {
    labels: props.entries.map(entry => entry.label),
    datasets: [
      {
        label: 'Mixed Usage 总分',
        data: props.entries.map(entry => entry.value),
        backgroundColor: props.entries.map((_, index) => corporatePalette[index % corporatePalette.length]),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 36
      }
    ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            return `总分 ${Number(context.parsed.x).toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: 10,
        grid: { color: '#f3f4f6' },
        ticks: { precision: 1 }
      },
      y: {
        grid: { display: false }
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
    label="多产品总分对比图表"
  />
</template>
