<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import type { ChartConfiguration, Plugin } from 'chart.js';

const props = defineProps<{
  configuration: ChartConfiguration;
  label: string;
  height?: string;
  chartTitle?: string;
}>();

const canvasRef = ref<HTMLCanvasElement>();
let chart: Chart | undefined;

const whiteBackgroundPlugin: Plugin = {
  id: 'whiteBackground',
  beforeDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

const exportTitlePlugin: Plugin = {
  id: 'exportTitle',
  beforeDraw(chart) {
    const title = props.chartTitle;
    if (!title) return;
    const { ctx, chartArea } = chart;
    if (!chartArea || chartArea.top < 28) return;
    ctx.save();
    ctx.font = '600 16px "Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, chart.width / 2, Math.max(18, chartArea.top - 22));
    ctx.restore();
  }
};

function render() {
  if (!canvasRef.value) return;
  const baseOptions = (props.configuration.options ?? {}) as Record<string, any>;
  const baseLayout = (baseOptions.layout ?? {}) as Record<string, any>;
  const basePadding = (baseLayout.padding ?? {}) as Record<string, number>;
  const titleTop = props.chartTitle ? 52 : 0;
  chart?.destroy();
  chart = new Chart(canvasRef.value, {
    ...props.configuration,
    options: {
      ...baseOptions,
      layout: {
        ...baseLayout,
        padding: {
          ...basePadding,
          top: Math.max(Number(basePadding.top ?? 0), titleTop)
        }
      }
    },
    plugins: [...(props.configuration.plugins ?? []), whiteBackgroundPlugin, exportTitlePlugin]
  });
}

function downloadPng(fileName: string) {
  if (!chart) return;
  const link = document.createElement('a');
  link.href = chart.toBase64Image('image/png', 1);
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.click();
}

onMounted(render);

watch(
  () => [props.configuration, props.chartTitle],
  () => render(),
  { deep: true }
);

onBeforeUnmount(() => {
  chart?.destroy();
  chart = undefined;
});

defineExpose({ downloadPng });
</script>

<template>
  <div class="w-full" :style="{ height: height ?? '18rem' }">
    <canvas ref="canvasRef" role="img" :aria-label="label"></canvas>
  </div>
</template>
