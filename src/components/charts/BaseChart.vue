<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import type { ChartConfiguration } from 'chart.js';

const props = defineProps<{
  configuration: ChartConfiguration;
  label: string;
}>();

const canvasRef = ref<HTMLCanvasElement>();
let chart: Chart | undefined;

function render() {
  if (!canvasRef.value) return;
  chart?.destroy();
  chart = new Chart(canvasRef.value, props.configuration);
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
</script>

<template>
  <div class="h-72 w-full">
    <canvas ref="canvasRef" role="img" :aria-label="label"></canvas>
  </div>
</template>
