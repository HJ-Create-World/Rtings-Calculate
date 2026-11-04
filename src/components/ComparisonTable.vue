<script setup lang="ts">
import type { ScoreNode } from '../core/types';
import type { ProductBaseline } from '../data/rtingsRule';
import { formatScore } from '../utils/format';

defineProps<{
  groups: ScoreNode[];
  products: ProductBaseline[];
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left font-semibold text-gray-900">评测项</th>
          <th
            v-for="product in products"
            :key="product.id"
            class="px-6 py-3 text-right font-semibold text-gray-900"
          >
            {{ product.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr class="transition-colors duration-200 hover:bg-gray-50">
          <td class="px-6 py-3 font-medium text-gray-900">Mixed Usage 总分</td>
          <td
            v-for="product in products"
            :key="product.id"
            class="px-6 py-3 text-right font-semibold text-blue-700"
          >
            {{ formatScore(product.expectedTotal) }}
          </td>
        </tr>
        <tr
          v-for="group in groups"
          :key="group.id"
          class="transition-colors duration-200 hover:bg-gray-50"
        >
          <td class="px-6 py-3 text-gray-700">{{ group.label }}</td>
          <td
            v-for="product in products"
            :key="product.id"
            class="px-6 py-3 text-right text-gray-700"
          >
            {{ formatScore(product.expectedScores[group.id] ?? null) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
