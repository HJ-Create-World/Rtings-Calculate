<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration, Plugin } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

const props = defineProps<{
  entries: Array<{ label: string; value: number | null }>;
  height?: string;
}>();

const scoreLabelPlugin: Plugin<'bar'> = {
  id: 'scoreLabel',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data ?? [];

    meta.data.forEach((bar, index) => {
      const value = values[index];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      const { ctx } = chart;
      const nearRightEdge = bar.x > chart.chartArea.right - 42;
      ctx.save();
      ctx.font = '600 12px "Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = nearRightEdge ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = nearRightEdge ? '#ffffff' : '#1f2937';
      ctx.fillText(value.toFixed(1), nearRightEdge ? bar.x - 8 : bar.x + 8, bar.y);
      ctx.restore();
    });
  }
};

const configuration = computed<ChartConfiguration<'bar'>>(() => ({
  type: 'bar',
  plugins: [scoreLabelPlugin],
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
    layout: { padding: { right: 42 } },
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
        reverse: true,
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
