<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import UiSelect from './UiSelect.vue';
import type { ProductBaseline } from '../data/rtingsRule';
import {
  BACKLIGHT_TYPE_OPTIONS,
  SCREEN_TYPE_OPTIONS,
  getProductMetadata,
  type BacklightType,
  type ScreenType
} from '../utils/productMetadata';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const props = defineProps<{
  products: ProductBaseline[];
  selectedIds: string[];
  collapsedCount?: number;
}>();

const emit = defineEmits<{
  (event: 'toggle', productId: string): void;
  (event: 'selectMany', productIds: string[]): void;
  (event: 'clearSelection'): void;
}>();

const keyword = ref('');
const brand = ref('');
const year = ref('');
const size = ref('');
const screenType = ref<ScreenType>('unknown');
const backlightType = ref<BacklightType>('unknown');
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

const sizes = computed(() =>
  [...new Set(
    props.products.flatMap(product => getProductMetadata(product).sizes)
  )].sort((a, b) => a - b)
);

const filteredProducts = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  const selectedSize = Number(size.value);
  return props.products
    .filter(product => {
      const metadata = getProductMetadata(product);
      const matchesText =
        !text ||
        `${product.label} ${product.brand ?? ''} ${product.model ?? ''}`
          .toLowerCase()
          .includes(text);
      const matchesBrand = !brand.value || (product.brand ?? '未分类') === brand.value;
      const matchesYear = !year.value || String(product.releaseYear ?? '') === year.value;
      const matchesSize = !size.value || metadata.sizes.includes(selectedSize);
      const matchesScreen = screenType.value === 'unknown' || metadata.screenType === screenType.value;
      const matchesBacklight =
        backlightType.value === 'unknown' || metadata.backlightType === backlightType.value;
      return matchesText && matchesBrand && matchesYear && matchesSize && matchesScreen && matchesBacklight;
    })
    .sort((a, b) => {
      const yearDiff = (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      return yearDiff || a.label.localeCompare(b.label, 'zh-CN');
    });
});

const selectedSet = computed(() => new Set(props.selectedIds));

const brandOptions = computed(() => [
  { value: '', label: '全部品牌' },
  ...brands.value.map(item => ({ value: item, label: item }))
]);

const yearOptions = computed(() => [
  { value: '', label: '全部年份' },
  ...years.value.map(item => ({ value: String(item), label: String(item) }))
]);

const sizeOptions = computed(() => [
  { value: '', label: '全部尺寸' },
  ...sizes.value.map(item => ({ value: String(item), label: `${item} 英寸` }))
]);

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

const showAllSelected = ref(false);

const collapsedSelectedLimit = 12;
const visibleSelectedProducts = computed(() =>
  showAllSelected.value
    ? selectedProducts.value
    : selectedProducts.value.slice(0, collapsedSelectedLimit)
);
const hiddenSelectedCount = computed(() =>
  Math.max(0, selectedProducts.value.length - visibleSelectedProducts.value.length)
);

const hasActiveFilters = computed(() => Boolean(
  keyword.value || brand.value || year.value || size.value ||
  screenType.value !== 'unknown' || backlightType.value !== 'unknown'
));

const filteredAllSelected = computed(() =>
  filteredProducts.value.length > 0 &&
  filteredProducts.value.every(product => selectedSet.value.has(product.id))
);

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

function selectFiltered() {
  const merged = new Set(props.selectedIds);
  filteredProducts.value.forEach(product => merged.add(product.id));
  emit('selectMany', [...merged]);
}

function clearFiltered() {
  const excluded = new Set(filteredProducts.value.map(product => product.id));
  emit('selectMany', props.selectedIds.filter(id => !excluded.has(id)));
}

function clearAll() {
  emit('clearSelection');
}

function clearFilters() {
  keyword.value = '';
  brand.value = '';
  year.value = '';
  size.value = '';
  screenType.value = 'unknown';
  backlightType.value = 'unknown';
}
</script>

<template>
  <section :class="cardClass" class="p-6">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="shrink-0">
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">产品搜索</h2>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          已选 {{ selectedIds.length }} 台 · 筛选结果 {{ filteredProducts.length }} 台
          <span v-if="filteredAllSelected" class="ml-2 text-blue-600">筛选结果已全选</span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :class="secondaryButtonClass"
          :disabled="!filteredProducts.length"
          @click="selectFiltered"
        >
          全选筛选结果
        </button>
        <button
          type="button"
          :class="secondaryButtonClass"
          :disabled="!filteredProducts.length || !selectedIds.length"
          @click="clearFiltered"
        >
          取消全选
        </button>
        <button
          type="button"
          :class="secondaryButtonClass"
          class="!text-red-600 hover:!bg-red-50"
          :disabled="!selectedIds.length"
          @click="clearAll"
        >
          清空选择
        </button>
      </div>
    </div>

    <div class="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <UiSelect
        v-model="brand"
        :options="brandOptions"
        aria-label="按品牌筛选"
        searchable
      />
      <UiSelect
        v-model="year"
        :options="yearOptions"
        aria-label="按年份筛选"
      />
      <UiSelect
        v-model="size"
        :options="sizeOptions"
        aria-label="按尺寸筛选"
        searchable
      />
      <UiSelect
        v-model="screenType"
        :options="SCREEN_TYPE_OPTIONS"
        aria-label="按屏幕类型筛选"
      />
      <UiSelect
        v-model="backlightType"
        :options="BACKLIGHT_TYPE_OPTIONS"
        aria-label="按背光类型筛选"
      />
      <input v-model="keyword" type="search" placeholder="搜索品牌 / 型号" :class="inputClass" />
    </div>

    <div v-if="selectedProducts.length" class="mt-5 mb-5">
      <div
        class="flex flex-wrap gap-2"
        :class="showAllSelected ? '' : 'max-h-[76px] overflow-hidden'"
      >
          <button
            v-for="product in visibleSelectedProducts"
            :key="`selected-${product.id}`"
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-all duration-200 ease-out hover:bg-blue-700 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :aria-label="`取消选择 ${product.label}`"
            @click="emit('toggle', product.id)"
          >
            {{ product.label }}
            <span aria-hidden="true">×</span>
          </button>
      </div>
      <button
        v-if="hiddenSelectedCount > 0 || showAllSelected"
        type="button"
        class="mt-2 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50"
        @click="showAllSelected = !showAllSelected"
      >
        {{ showAllSelected ? '收起已选' : `展开已选 ${selectedProducts.length} 台` }}
      </button>
    </div>

    <div
      v-if="expanded || !filteredAllSelected"
      class="mt-5 flex flex-wrap gap-3"
      :class="expanded ? '' : 'max-h-[92px] overflow-hidden'"
    >
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

    <div v-if="filteredProducts.length > (collapsedCount ?? defaultCollapsedCount) || filteredAllSelected" class="mt-4">
      <button :class="primaryButtonClass" @click="expanded = !expanded">
        {{ expanded ? '收起产品列表' : `展开产品列表 ${filteredProducts.length} 台` }}
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
