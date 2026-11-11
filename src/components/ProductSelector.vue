<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ProductBaseline } from '../data/rtingsRule';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const props = defineProps<{
  products: ProductBaseline[];
  selectedIds: string[];
  collapsedCount?: number;
}>();

const emit = defineEmits<{
  (event: 'toggle', productId: string): void;
}>();

const keyword = ref('');
const brand = ref('');
const year = ref('');
const expanded = ref(false);
const defaultCollapsedCount = 12;

const brands = computed(() =>
  [...new Set(props.products.map(product => product.brand ?? '未分类'))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN')
  )
);

const years = computed(() =>
  [...new Set(props.products.map(product => product.releaseYear).filter(Boolean) as number[])]
    .sort((a, b) => b - a)
);

const filteredProducts = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return props.products
    .filter(product => {
      const matchesText =
        !text ||
        `${product.label} ${product.brand ?? ''} ${product.model ?? ''}`
          .toLowerCase()
          .includes(text);
      const matchesBrand = !brand.value || (product.brand ?? '未分类') === brand.value;
      const matchesYear = !year.value || String(product.releaseYear ?? '') === year.value;
      return matchesText && matchesBrand && matchesYear;
    })
    .sort((a, b) => {
      const yearDiff = (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      return yearDiff || a.label.localeCompare(b.label, 'zh-CN');
    });
});

const selectedSet = computed(() => new Set(props.selectedIds));

const selectedProducts = computed(() =>
  props.selectedIds
    .map(id => props.products.find(product => product.id === id))
    .filter(Boolean) as ProductBaseline[]
);

const visibleProducts = computed(() => {
  if (expanded.value || filteredProducts.value.length <= (props.collapsedCount ?? defaultCollapsedCount)) {
    return filteredProducts.value;
  }
  const selectedVisible = filteredProducts.value.filter(product => selectedSet.value.has(product.id));
  const remaining = filteredProducts.value.filter(product => !selectedSet.value.has(product.id));
  const limit = Math.max(0, (props.collapsedCount ?? defaultCollapsedCount) - selectedVisible.length);
  return [...selectedVisible, ...remaining.slice(0, limit)];
});

const hasActiveFilters = computed(() => Boolean(keyword.value || brand.value || year.value));

watch(
  () => props.products.length,
  () => {
    expanded.value = filteredProducts.value.length <= (props.collapsedCount ?? defaultCollapsedCount);
  },
  { immediate: true }
);

function isSelected(productId: string) {
  return selectedSet.value.has(productId);
}

function clearFilters() {
  keyword.value = '';
  brand.value = '';
  year.value = '';
}
</script>

<template>
  <section :class="cardClass" class="p-6">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="shrink-0">
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">产品搜索</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          已选 {{ selectedIds.length }} 台 · 筛选结果 {{ filteredProducts.length }} 台
        </p>
      </div>
      <div class="grid gap-3 md:grid-cols-3 lg:w-auto lg:min-w-[680px]">
        <select v-model="brand" :class="inputClass" aria-label="按品牌筛选">
          <option value="">全部品牌</option>
          <option v-for="item in brands" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="year" :class="inputClass" aria-label="按年份筛选">
          <option value="">全部年份</option>
          <option v-for="item in years" :key="item" :value="String(item)">{{ item }}</option>
        </select>
        <input v-model="keyword" type="search" placeholder="搜索品牌 / 型号" :class="inputClass" />
      </div>
    </div>

    <div v-if="selectedProducts.length" class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="product in selectedProducts"
        :key="`selected-${product.id}`"
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-all duration-200 ease-out hover:bg-blue-700 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :aria-label="`取消选择 ${product.label}`"
        @click="emit('toggle', product.id)"
      >
        {{ product.label }}
        <span aria-hidden="true">×</span>
      </button>
      <button
        v-if="selectedProducts.length > 1"
        type="button"
        :class="secondaryButtonClass"
        class="!px-3 !py-1 !text-xs"
        @click="selectedProducts.forEach(product => emit('toggle', product.id))"
      >
        清空选择
      </button>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        v-for="product in visibleProducts"
        :key="product.id"
        type="button"
        :class="[
          secondaryButtonClass,
          isSelected(product.id) ? '!border-blue-600 !bg-blue-50 !text-blue-700' : ''
        ]"
        :aria-pressed="isSelected(product.id)"
        @click="emit('toggle', product.id)"
      >
        {{ product.label }}
        <span
          v-if="product.source === 'cloud' || product.source === 'local'"
          class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700"
        >
          {{ product.source === 'cloud' ? '云端' : '本机' }}
        </span>
      </button>
    </div>

    <div v-if="filteredProducts.length > (collapsedCount ?? defaultCollapsedCount)" class="mt-4">
      <button :class="primaryButtonClass" @click="expanded = !expanded">
        {{ expanded ? '收起产品列表' : `展开全部 ${filteredProducts.length} 台` }}
      </button>
    </div>

    <p v-if="!filteredProducts.length" :class="['mt-4 text-sm', mutedTextClass]">
      没有符合筛选条件的产品。
    </p>

    <div v-if="hasActiveFilters" class="mt-3">
      <button :class="secondaryButtonClass" @click="clearFilters">清除筛选</button>
    </div>
  </section>
</template>
