<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    autocomplete?: string;
    ariaLabel?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: '请输入密码',
    autocomplete: 'current-password',
    ariaLabel: '密码',
    disabled: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const visible = ref(false);

function inputClass() {
  return [
    'h-10 w-full rounded-lg border bg-white px-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200',
    'border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400'
  ];
}
</script>

<template>
  <div class="relative">
    <input
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-label="ariaLabel"
      :disabled="disabled"
      :class="inputClass()"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700"
      :aria-label="visible ? '隐藏密码' : '显示密码'"
      @click="visible = !visible"
    >
      <svg
        v-if="!visible"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg
        v-else
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-2.6 3.4" />
        <path d="M6.3 6.3A16.7 16.7 0 0 0 2 12s3.5 7 10 7c1.8 0 3.3-.4 4.6-1" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </svg>
    </button>
  </div>
</template>
