<script setup lang="ts">
import { secondaryButtonClass } from '../utils/ui';

defineProps<{
  options: Array<{ value: string; label: string }>;
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[
        secondaryButtonClass,
        modelValue === option.value ? '!border-blue-600 !bg-blue-50 !text-blue-700' : ''
      ]"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
