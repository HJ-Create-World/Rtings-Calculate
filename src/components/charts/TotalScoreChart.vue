<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

const props = defineProps<{
  entries: Array<{ label: string; value: number | null }>;
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
</script>

<template>
  <BaseChart :configuration="configuration" label="多产品总分对比图表" />
</template>
