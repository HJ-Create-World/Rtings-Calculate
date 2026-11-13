<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export interface UiSelectOption {
  value: string;
  label: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    options: readonly UiSelectOption[];
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    searchable?: boolean;
    disabled?: boolean;
    align?: 'left' | 'right';
    buttonClass?: string;
    panelClass?: string;
  }>(),
  {
    placeholder: '请选择',
    searchable: false,
    disabled: false,
    align: 'left',
    buttonClass: '',
    panelClass: ''
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref('');

const selectedOption = computed(
  () => props.options.find(option => option.value === props.modelValue) ?? null
);

const filteredOptions = computed(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return props.options;
  return props.options.filter(option =>
    `${option.label} ${option.description ?? ''}`.toLowerCase().includes(text)
  );
});

function handleClickOutside(event: MouseEvent) {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    close();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
  }
}

function close() {
  open.value = false;
  query.value = '';
}

function choose(option: UiSelectOption) {
  emit('update:modelValue', option.value);
  close();
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside, true);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside, true);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <button
      type="button"
      :disabled="disabled"
      :aria-haspopup="'listbox'"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      :class="[
        'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-900 transition-all duration-200 ease-out',
        'hover:bg-gray-50 active:translate-y-0 active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
        open ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : '',
        buttonClass
      ]"
      @click="open = !open"
    >
      <span class="min-w-0 truncate">
        {{ selectedOption?.label ?? placeholder }}
      </span>
      <svg
        class="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute z-50 mt-2 w-full min-w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md"
      :class="panelClass"
      role="dialog"
      :aria-label="ariaLabel ?? '选项列表'"
    >
      <div v-if="searchable" class="border-b border-gray-100 p-2">
        <input
          v-model="query"
          type="search"
          placeholder="搜索选项"
          class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div class="max-h-64 overflow-y-auto p-1.5">
        <button
          v-for="option in filteredOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ease-out"
          :class="option.value === modelValue ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="choose(option)"
        >
          <span class="min-w-0">
            <span class="block truncate font-medium">{{ option.label }}</span>
            <span
              v-if="option.description"
              class="mt-0.5 block truncate text-xs"
              :class="option.value === modelValue ? 'text-blue-600' : 'text-gray-500'"
            >
              {{ option.description }}
            </span>
          </span>
          <svg
            v-if="option.value === modelValue"
            class="mt-1 h-4 w-4 shrink-0 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </button>

        <p
          v-if="!filteredOptions.length"
          class="px-3 py-6 text-center text-sm text-gray-500"
        >
          没有匹配的选项
        </p>
      </div>
    </div>
  </div>
</template>
