<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from './BaseChart.vue';
import { corporatePalette } from '../../utils/chartTheme';
import type { ScoreNode } from '../../core/types';
import type { ProductBaseline } from '../../data/rtingsRule';

const props = defineProps<{
  groups: ScoreNode[];
  products: ProductBaseline[];
  height?: string;
}>();

const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null);

const configuration = computed<ChartConfiguration<'bar'>>(() => ({
  type: 'bar',
  data: {
    labels: props.groups.map(group => group.label),
    datasets: props.products.map((product, index) => ({
      label: product.label,
      data: props.groups.map(
        group => (product.expectedScores[group.id] ?? 0) * (group.weight ?? 0)
      ),
      backgroundColor: `${corporatePalette[index % corporatePalette.length]}26`,
      borderColor: corporatePalette[index % corporatePalette.length],
      borderWidth: 2,
      borderRadius: 6,
      maxBarThickness: 24
    }))
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          title(context) {
            const product = props.products[context[0]?.datasetIndex ?? 0];
            return product?.model || context[0]?.dataset?.label || '';
          },
          label(context) {
            const group = props.groups[context.dataIndex];
            return `${group?.label ?? ''} · 贡献 ${Number(context.parsed.y).toFixed(3)}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        title: { display: true, text: '对 Mixed Usage 的贡献值' }
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
    label="主维度贡献对比图"
  />
</template>
