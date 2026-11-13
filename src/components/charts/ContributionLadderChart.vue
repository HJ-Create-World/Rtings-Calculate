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
  chartTitle?: string;
}>();

const baseChartRef = ref<InstanceType<typeof BaseChart> | null>(null);

const configuration = computed<ChartConfiguration<'bar'>>(() => ({
  type: 'bar',
  data: {
    labels: props.products.map((product, index) => `#${index + 1} ${product.label}`),
    datasets: props.groups.map((group, index) => ({
      label: group.label,
      data: props.products.map(
        product => (product.expectedScores[group.id] ?? 0) * (group.weight ?? 0)
      ),
      backgroundColor: `${corporatePalette[index % corporatePalette.length]}CC`,
      borderColor: corporatePalette[index % corporatePalette.length],
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 26
    }))
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          title(context) {
            const product = props.products[context[0]?.dataIndex ?? 0];
            return product?.model || product?.label || '';
          },
          label(context) {
            const group = props.groups[context.datasetIndex];
            return `${group?.label ?? ''} · 贡献 ${Number(context.parsed.x).toFixed(3)}`;
          },
          afterBody(context) {
            const product = props.products[context[0]?.dataIndex ?? 0];
            if (!product) return [];
            const total = props.groups.reduce(
              (sum, group) => sum + (product.expectedScores[group.id] ?? 0) * (group.weight ?? 0),
              0
            );
            return [`合计贡献 ${total.toFixed(3)}`];
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        title: { display: true, text: '对 Mixed Usage 的贡献值' }
      },
      y: {
        stacked: true,
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
    label="主维度贡献天梯图"
  />
</template>
