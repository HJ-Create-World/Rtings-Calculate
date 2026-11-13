<script setup lang="ts">
const props = defineProps<{
  testItems: string[];
  products: Array<{ label: string; values: Array<number | null> }>;
  highlightIndex?: number | null;
}>();

function scoreClass(score: number | null | undefined) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return 'bg-gray-50 text-gray-400';
  }
  if (score >= 8.5) return 'bg-blue-600 text-white';
  if (score >= 7) return 'bg-blue-100 text-blue-800';
  if (score >= 5) return 'bg-gray-50 text-gray-700';
  return 'bg-red-50 text-red-700';
}
</script>

<template>
  <div class="overflow-auto rounded-xl border border-gray-200">
    <table class="min-w-full border-collapse text-sm">
      <thead class="sticky top-0 z-30 bg-gray-50">
        <tr>
          <th class="sticky left-0 z-40 w-56 min-w-56 border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900">
            测试项 / 机型
          </th>
          <th
            v-for="product in products"
            :key="`header-${product.label}`"
            class="min-w-32 border-b border-gray-200 bg-gray-50 px-3 py-3 text-center font-semibold text-gray-900"
            :title="product.label"
          >
            <span class="block max-w-32 truncate">{{ product.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="(testItem, rowIndex) in testItems"
          :key="testItem"
          class="transition-colors duration-200"
          :class="highlightIndex === rowIndex ? 'bg-blue-50/60' : 'hover:bg-gray-50'"
        >
          <th
            class="sticky left-0 z-20 border-r border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-900"
            :class="highlightIndex === rowIndex ? '!bg-blue-50 text-blue-700' : ''"
            :title="testItem"
          >
            <span class="block max-w-56 truncate">{{ testItem }}</span>
          </th>
          <td
            v-for="product in products"
            :key="`cell-${product.label}-${testItem}`"
            class="border-r border-gray-100 px-3 py-2 text-center font-medium"
            :class="scoreClass(product.values[rowIndex])"
          >
            {{ product.values[rowIndex] === null || product.values[rowIndex] === undefined
              ? '—'
              : Number(product.values[rowIndex]).toFixed(1) }}
          </td>
        </tr>
        <tr v-if="!testItems.length || !products.length">
          <td
            :colspan="products.length + 1"
            class="px-4 py-8 text-center text-sm text-gray-500"
          >
            请选择测试项和机型后查看热力表。
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="mt-3 text-xs text-gray-500">
    颜色越深代表得分越高；第一列与表头已固定，方便大量机型和测试项横向对照。
  </p>
</template>
