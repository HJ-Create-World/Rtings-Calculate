<script setup lang="ts">
import UiSelect from './UiSelect.vue';

defineProps<{
  metricOptions: Array<{ value: string; label: string }>;
  directionOptions: Array<{ value: string; label: string }>;
  limitOptions: Array<{ value: string; label: string }>;
  metric: string;
  direction: string;
  limit: string;
}>();

const emit = defineEmits<{
  (event: 'update:metric', value: string): void;
  (event: 'update:direction', value: string): void;
  (event: 'update:limit', value: string): void;
}>();
</script>

<template>
  <section class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="shrink-0">
        <h2 class="text-lg font-semibold tracking-tight text-gray-900">排序与展示</h2>
      </div>
      <div class="grid gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[560px]">
        <UiSelect
          :model-value="metric"
          :options="metricOptions"
          aria-label="选择排序依据"
          @update:model-value="emit('update:metric', $event)"
        />
        <UiSelect
          :model-value="direction"
          :options="directionOptions"
          aria-label="选择排序方向"
          @update:model-value="emit('update:direction', $event)"
        />
        <UiSelect
          :model-value="limit"
          :options="limitOptions"
          aria-label="选择展示数量"
          @update:model-value="emit('update:limit', $event)"
        />
      </div>
    </div>
  </section>
</template>
