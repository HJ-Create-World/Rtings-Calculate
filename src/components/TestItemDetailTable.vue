<script setup lang="ts">
import { computed, ref } from 'vue';
import CheckboxChips from './CheckboxChips.vue';
import OptionChips from './OptionChips.vue';
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
  visibleColumns.value = visibleColumns.value.includes(column)
    ? visibleColumns.value.filter(item => item !== column)
    : [...visibleColumns.value, column];
}
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">具体测试项评分</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          按工作簿顺序展示，7/8 分参考值来自 Rtings计算文档.xlsx
        </p>
      </div>
      <CheckboxChips
        :options="columnOptions"
        :model-value="visibleColumns"
        @toggle="toggleColumn"
      />
    </div>

    <OptionChips
      class="mt-5"
      :model-value="selectedGroupId"
      :options="topGroups.map(group => ({ value: group.id, label: group.label }))"
      @update:model-value="emit('update:selectedGroupId', $event)"
    />

    <div class="mt-5 overflow-x-auto rounded-xl border border-gray-200">
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
