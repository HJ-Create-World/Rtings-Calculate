<script setup lang="ts">
import { computed, ref } from 'vue';
import { getReferenceValues } from '../data/rtingsReferences';
import type { ScoreNode } from '../core/types';
import { collectSubDimensionGroups } from '../utils/ruleDisplay';
import { formatScore, formatWeight } from '../utils/format';
import { mutedTextClass } from '../utils/ui';

export interface DetailTableBaseline {
  expectedScores: Record<string, number | null>;
  inputs: Record<string, { objective?: { value: number | null; text?: string }; subjective?: { scoreTenths: number | null } }>;
}

const props = defineProps<{
  baseline: DetailTableBaseline;
  topGroups: ScoreNode[];
  selectedGroupId: string;
}>();

const emit = defineEmits<{
  (event: 'update:selectedGroupId', value: string): void;
}>();

const columnOptions = [
  { value: 'subDimension', label: '子类维度' },
  { value: 'item', label: '具体测试项' },
  { value: 'weight', label: '权重' },
  { value: 'seven', label: '7分参考值' },
  { value: 'eight', label: '8分参考值' },
  { value: 'input', label: '实测输入' },
  { value: 'score', label: '得分' }
];

const visibleColumns = ref<string[]>(columnOptions.map(option => option.value));
const visibleColumnSet = computed(() => new Set(visibleColumns.value));
const columnPanelOpen = ref(false);

const groups = computed(() =>
  collectSubDimensionGroups(props.selectedGroupId).filter(group => group.items.length > 0)
);

function hasColumn(column: string) {
  return visibleColumnSet.value.has(column);
}

function inputValue(nodeId: string, inputType: string): string | number {
  const value = props.baseline.inputs[nodeId];
  if (!value) return '—';

  if (inputType === 'subjective') {
    return value.subjective?.scoreTenths !== null && value.subjective?.scoreTenths !== undefined
      ? value.subjective.scoreTenths / 10
      : '—';
  }

  if (value.objective?.text) return value.objective.text;
  if (value.objective?.value !== null && value.objective?.value !== undefined) {
    return value.objective.value;
  }
  return '—';
}

function toggleColumn(column: string) {
  if (visibleColumns.value.length === 1 && visibleColumns.value.includes(column)) return;
  visibleColumns.value = visibleColumns.value.includes(column)
    ? visibleColumns.value.filter(item => item !== column)
    : [...visibleColumns.value, column];
}

function resetColumns() {
  visibleColumns.value = columnOptions.map(option => option.value);
}
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="min-w-0">
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">具体测试项评分</h3>
        <p :class="['mt-1 text-sm', mutedTextClass]">
          按工作簿顺序展示 · 7/8 分参考值来自 Rtings计算文档.xlsx
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <label class="grid gap-1 sm:w-64">
          <span class="text-xs font-medium text-gray-500">主维度</span>
          <select
            :value="selectedGroupId"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="选择主维度"
            @change="emit('update:selectedGroupId', ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="group in topGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.label }}
            </option>
          </select>
        </label>

        <details class="relative sm:w-44" :open="columnPanelOpen" @toggle="columnPanelOpen = ($event.target as HTMLDetailsElement).open">
          <summary
            class="flex h-10 cursor-pointer list-none select-none items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-all duration-200 ease-out hover:bg-gray-50 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 [&::-webkit-details-marker]:hidden"
            aria-label="选择表格展示项"
          >
            <span>展示列</span>
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {{ visibleColumns.length }}/{{ columnOptions.length }}
            </span>
          </summary>

          <div class="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-md">
            <div class="grid grid-cols-2 gap-x-3 gap-y-2">
              <label
                v-for="option in columnOptions"
                :key="option.value"
                class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2"
                  :checked="hasColumn(option.value)"
                  @change="toggleColumn(option.value)"
                />
                <span class="truncate">{{ option.label }}</span>
              </label>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-700"
                @click="resetColumns"
              >
                重置
              </button>
              <span :class="['text-xs', mutedTextClass]">至少保留一项</span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th v-if="hasColumn('subDimension')" class="w-40 px-4 py-3 text-left font-semibold text-gray-900">子类维度</th>
            <th v-if="hasColumn('item')" class="min-w-52 px-4 py-3 text-left font-semibold text-gray-900">具体测试项</th>
            <th v-if="hasColumn('weight')" class="w-24 px-4 py-3 text-right font-semibold text-gray-900">权重</th>
            <th v-if="hasColumn('seven')" class="min-w-40 px-4 py-3 text-left font-semibold text-gray-900">7分参考值</th>
            <th v-if="hasColumn('eight')" class="min-w-40 px-4 py-3 text-left font-semibold text-gray-900">8分参考值</th>
            <th v-if="hasColumn('input')" class="w-32 px-4 py-3 text-right font-semibold text-gray-900">实测输入</th>
            <th v-if="hasColumn('score')" class="w-24 px-4 py-3 text-right font-semibold text-gray-900">得分</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <template v-for="group in groups" :key="group.node.id">
            <tr class="bg-blue-50/70">
              <td
                :colspan="visibleColumns.length"
                class="px-4 py-3 font-semibold text-blue-700"
              >
                {{ group.node.label }}
                <span class="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-blue-700">
                  子维度权重 {{ formatWeight(group.node.weight) }}
                </span>
              </td>
            </tr>
            <tr
              v-for="item in group.items"
              :key="item.node.id"
              class="transition-colors duration-200 hover:bg-gray-50"
            >
              <td v-if="hasColumn('subDimension')" class="px-4 py-3 text-gray-600">
                {{ group.node.label }}
              </td>
              <td v-if="hasColumn('item')" class="px-4 py-3 text-gray-900">
                {{ item.node.label }}
              </td>
              <td v-if="hasColumn('weight')" class="px-4 py-3 text-right text-gray-700">
                {{ formatWeight(item.node.weight) }}
              </td>
              <td v-if="hasColumn('seven')" class="px-4 py-3 text-gray-700">
                {{ getReferenceValues(item.node.id).seven }}
              </td>
              <td v-if="hasColumn('eight')" class="px-4 py-3 text-gray-700">
                {{ getReferenceValues(item.node.id).eight }}
              </td>
              <td v-if="hasColumn('input')" class="px-4 py-3 text-right text-gray-700">
                {{ inputValue(item.node.id, item.node.inputType) }}
              </td>
              <td v-if="hasColumn('score')" class="px-4 py-3 text-right font-medium text-gray-900">
                {{ formatScore(baseline.expectedScores[item.node.id] ?? null) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </article>
</template>
