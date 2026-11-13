<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';

const props = defineProps<{
  labels: string[];
  series: Array<{ label: string; values: Array<number | null> }>;
  chartType: 'bar' | 'radar';
  height?: string;
  highlightIndex?: number | null;
}>();

const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null);

function isHighlighted(index: number): boolean {
  return props.highlightIndex === index;
}

function labelColor(index: number): string {
  if (!isHighlighted(index)) return '#374151';
  return '#1565C0';
}

const configuration = computed<ChartConfiguration>(() => {
  const datasets = props.series.map((series, index) => ({
    label: series.label,
    data: series.values,
    backgroundColor: `${corporatePalette[index % corporatePalette.length]}26`,
    borderColor: corporatePalette[index % corporatePalette.length],
    pointBackgroundColor: corporatePalette[index % corporatePalette.length],
    borderWidth: isHighlighted(index) ? 3 : 2,
    borderRadius: 6,
    maxBarThickness: 22
  }));

  if (props.chartType === 'radar') {
    return {
      type: 'radar',
      data: { labels: props.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { stepSize: 2, backdropColor: 'transparent' },
            grid: { color: '#f3f4f6' },
            angleLines: { color: '#e5e7eb' },
            pointLabels: {
              color: (context) => labelColor(context.index ?? 0),
              font: (context) => ({
                weight: isHighlighted(context.index ?? 0) ? 700 : 400
              })
            }
          }
        }
      }
    };
  }

  return {
    type: 'bar',
    data: { labels: props.labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { beginAtZero: true, suggestedMax: 10, grid: { color: '#f3f4f6' } },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            color: (context) => labelColor(context.index ?? 0),
            font: (context) => ({
              weight: isHighlighted(context.index ?? 0) ? 700 : 400
            })
          }
        }
      }
    }
  };
});

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
    :label="chartType === 'radar' ? '测试项雷达对比图' : '测试项柱状对比图'"
  />
</template>
