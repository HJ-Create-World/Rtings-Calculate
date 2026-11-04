<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import type { ChartConfiguration, Plugin } from 'chart.js';

const props = defineProps<{
  configuration: ChartConfiguration;
  label: string;
  height?: string;
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

function render() {
  if (!canvasRef.value) return;
  chart?.destroy();
  chart = new Chart(canvasRef.value, {
    ...props.configuration,
    plugins: [...(props.configuration.plugins ?? []), whiteBackgroundPlugin]
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
  () => props.configuration,
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
