<script setup lang="ts">
import UiSelect from './UiSelect.vue';
import { inputClass, mutedTextClass } from '../utils/ui';

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
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="shrink-0">
        <h2 class="text-lg font-semibold tracking-tight text-gray-900">评分区间筛选</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          筛选总分或指定维度在区间内的机型；留空表示不限制
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[520px]">
        <UiSelect
          :model-value="metric"
          :options="metricOptions"
          aria-label="选择区间筛选维度"
          @update:model-value="emit('update:metric', $event)"
        />
        <input
          :value="min"
          type="number"
          min="0"
          max="10"
          step="0.1"
          placeholder="最低分，如 7.0"
          :class="inputClass"
          aria-label="最低分"
          @input="emit('update:min', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="max"
          type="number"
          min="0"
          max="10"
          step="0.1"
          placeholder="最高分，如 9.0"
          :class="inputClass"
          aria-label="最高分"
          @input="emit('update:max', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </section>
</template>
