<script setup lang="ts">
import { secondaryButtonClass } from '../utils/ui';

defineProps<{
  options: Array<{ value: string; label: string }>;
  modelValue: string[];
}>();

const emit = defineEmits<{
  (event: 'toggle', value: string): void;
}>();

function isSelected(modelValue: string[], value: string) {
  return modelValue.includes(value);
}
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[
        secondaryButtonClass,
        isSelected(modelValue, option.value) ? '!border-blue-600 !bg-blue-50 !text-blue-700' : ''
      ]"
      :aria-pressed="isSelected(modelValue, option.value)"
      @click="emit('toggle', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
