<script setup lang="ts">
import UiSelect from './UiSelect.vue';
import DualRangeSlider from './DualRangeSlider.vue';
import { mutedTextClass } from '../utils/ui';

defineProps<{
  metricOptions: Array<{ value: string; label: string }>;
  metric: string;
  min: string;
  max: string;
}>();

const emit = defineEmits<{
  (event: 'update:metric', value: string): void;
  (event: 'update:min', value: string): void;
  (event: 'update:max', value: string): void;
}>();
</script>

<template>
  <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="shrink-0">
        <h2 class="text-lg font-semibold tracking-tight text-gray-900">评分区间筛选</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          拖动进度条筛选指定维度机型，默认 6.0 ~ 8.0 分
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(280px,1.2fr)] lg:w-auto lg:min-w-[560px]">
        <UiSelect
          :model-value="metric"
          :options="metricOptions"
          aria-label="选择区间筛选维度"
          @update:model-value="emit('update:metric', $event)"
        />
        <div class="grid gap-2">
          <div class="flex items-center justify-between text-xs text-gray-600">
            <span>当前区间</span>
            <span class="font-medium text-gray-900">
              {{ Number(min || 0).toFixed(1) }} ~ {{ Number(max || 10).toFixed(1) }}
            </span>
          </div>
          <DualRangeSlider
            :min-value="min"
            :max-value="max"
            aria-label="评分区间"
            @update:min-value="emit('update:min', $event)"
            @update:max-value="emit('update:max', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
