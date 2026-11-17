<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    minValue: string | number;
    maxValue: string | number;
    rangeMin?: number;
    rangeMax?: number;
    step?: number;
    ariaLabel?: string;
  }>(),
  {
    rangeMin: 0,
    rangeMax: 10,
    step: 0.1,
    ariaLabel: '分数区间'
  }
);

const emit = defineEmits<{
  (event: 'update:minValue', value: string): void;
  (event: 'update:maxValue', value: string): void;
}>();

const lowerValue = computed(() => {
  const value = Number(props.minValue);
  if (!Number.isFinite(value)) return props.rangeMin;
  return Math.min(Math.max(value, props.rangeMin), props.rangeMax);
});

const upperValue = computed(() => {
  const value = Number(props.maxValue);
  if (!Number.isFinite(value)) return props.rangeMax;
  return Math.min(Math.max(value, props.rangeMin), props.rangeMax);
});

const lowerPercent = computed(() =>
  ((lowerValue.value - props.rangeMin) / (props.rangeMax - props.rangeMin)) * 100
);

const upperPercent = computed(() =>
  ((upperValue.value - props.rangeMin) / (props.rangeMax - props.rangeMin)) * 100
);

function updateLower(event: Event) {
  const next = Number((event.target as HTMLInputElement).value);
  emit('update:minValue', String(Math.min(next, upperValue.value)));
}

function updateUpper(event: Event) {
  const next = Number((event.target as HTMLInputElement).value);
  emit('update:maxValue', String(Math.max(next, lowerValue.value)));
}
</script>

<template>
  <div class="relative h-6 w-full" :aria-label="ariaLabel">
    <div class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200"></div>
    <div
      class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-600"
      :style="{
        left: `${lowerPercent}%`,
        width: `${Math.max(0, upperPercent - lowerPercent)}%`
      }"
    ></div>

    <input
      type="range"
      class="dual-range-input"
      :min="rangeMin"
      :max="rangeMax"
      :step="step"
      :value="lowerValue"
      :aria-label="`${ariaLabel}最低值`"
      @input="updateLower"
    />
    <input
      type="range"
      class="dual-range-input"
      :min="rangeMin"
      :max="rangeMax"
      :step="step"
      :value="upperValue"
      :aria-label="`${ariaLabel}最高值`"
      @input="updateUpper"
    />
  </div>
</template>

<style scoped>
.dual-range-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  pointer-events: none;
}

.dual-range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid #2563eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  cursor: pointer;
  pointer-events: auto;
}

.dual-range-input::-moz-range-thumb {
  height: 14px;
  width: 14px;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid #2563eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  cursor: pointer;
  pointer-events: auto;
}

.dual-range-input::-moz-range-track {
  background: transparent;
}
</style>
