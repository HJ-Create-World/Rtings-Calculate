<script setup lang="ts">
import { secondaryButtonClass } from '../utils/ui';
import type { ProductBaseline } from '../data/rtingsRule';

defineProps<{
  products: ProductBaseline[];
  selectedIds: string[];
}>();

const emit = defineEmits<{
  (event: 'toggle', productId: string): void;
}>();

function isSelected(selectedIds: string[], productId: string) {
  return selectedIds.includes(productId);
}
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="product in products"
      :key="product.id"
      type="button"
      :class="[
        secondaryButtonClass,
        isSelected(selectedIds, product.id)
          ? '!border-blue-600 !bg-blue-50 !text-blue-700'
          : ''
      ]"
      :aria-pressed="isSelected(selectedIds, product.id)"
      @click="emit('toggle', product.id)"
    >
      {{ product.label }}
    </button>
  </div>
</template>
