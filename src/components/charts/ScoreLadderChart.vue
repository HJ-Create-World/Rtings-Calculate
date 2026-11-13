<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration, Plugin } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

export interface LadderEntry {
  label: string;
  value: number | null;
  rank: number;
}

const props = defineProps<{
  entries: LadderEntry[];
  metricLabel?: string;
  height?: string;
  chartTitle?: string;
}>();

const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null);

const scoreLabelPlugin: Plugin<'bar'> = {
  id: 'ladderScoreLabel',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data ?? [];

    meta.data.forEach((bar, index) => {
      const value = values[index];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      const { ctx } = chart;
      const nearRightEdge = bar.x > chart.chartArea.right - 46;
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
    labels: props.entries.map(entry => `#${entry.rank} ${entry.label}`),
    datasets: [
      {
        label: props.metricLabel ?? '评分',
        data: props.entries.map(entry => entry.value),
        backgroundColor: props.entries.map((_, index) => corporatePalette[index % corporatePalette.length]),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 30
      }
    ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 48 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(context) {
            const entry = props.entries[context[0]?.dataIndex ?? 0];
            return entry ? `${entry.label}（#${entry.rank}）` : '';
          },
          label(context) {
            return `${props.metricLabel ?? '评分'} ${Number(context.parsed.x).toFixed(1)}`;
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
        grid: { display: false },
        ticks: { autoSkip: false }
      }
    }
  }
}));

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
    label="评分天梯图"
  />
</template>
