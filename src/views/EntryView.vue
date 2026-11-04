<script setup lang="ts">
import { computed, ref } from 'vue';
import OptionChips from '../components/OptionChips.vue';
import { useEvaluationDraft } from '../composables/useEvaluationDraft';
import { rtingsRuleV1 } from '../data/rtingsRule';
import type { ScoreNode } from '../core/types';
import { formatScore, statusClass, statusLabel, warningLabel } from '../utils/format';
import { cardClass, inputClass, mutedTextClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const {
  draft,
  result,
  filledCount,
  updateMeta,
  updateValue,
  resetDraft
} = useEvaluationDraft();

const groups = rtingsRuleV1.nodes.filter(node => node.parentId === rtingsRuleV1.rootId);
const groupOptions = groups.map(group => ({ value: group.id, label: group.label }));
const selectedGroupId = ref(groups[0]?.id ?? '');
const keyword = ref('');

function collectTestItems(nodeId: string): ScoreNode[] {
  return rtingsRuleV1.nodes
    .filter(node => node.parentId === nodeId)
    .flatMap(child => (child.inputType === 'aggregate' ? collectTestItems(child.id) : [child]));
}

function parentLabel(node: ScoreNode): string {
  const parent = rtingsRuleV1.nodes.find(item => item.id === node.parentId);
  return parent?.label ?? '';
}

function unitOf(node: ScoreNode): string {
  if (node.inputType !== 'objective') return '0~10';
  const mapping = rtingsRuleV1.mappings.find(item => item.id === node.mappingId);
  return mapping?.unit ?? '数值';
}

const allItems = computed(() => collectTestItems(selectedGroupId.value));
const visibleItems = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return allItems.value;
  return allItems.value.filter(node =>
    `${parentLabel(node)} ${node.label}`.toLowerCase().includes(text)
  );
});

const metaFields = [
  { key: 'brand', label: '品牌' },
  { key: 'model', label: '型号' },
  { key: 'testDate', label: '测试日期' },
  { key: 'engineer', label: '测试工程师' }
] as const;

function objectiveValue(node: ScoreNode): string {
  return draft.value.values[node.id]?.objectiveRaw ?? '';
}

function subjectiveValue(node: ScoreNode): number | null {
  const score = draft.value.values[node.id]?.subjectiveScore;
  return score === null || score === undefined ? null : score / 10;
}
</script>

<template>
  <section class="mb-8 grid gap-6 lg:grid-cols-4">
    <article :class="cardClass" class="p-6 lg:col-span-3">
      <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">产品档案</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <label v-for="field in metaFields" :key="field.key" class="grid gap-2 text-sm">
          <span class="text-gray-700">{{ field.label }}</span>
          <input
            :value="draft[field.key]"
            type="text"
            :class="inputClass"
            @input="updateMeta({ [field.key]: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="grid gap-2 text-sm md:col-span-2">
          <span class="text-gray-700">备注</span>
          <textarea
            :value="draft.remark"
            rows="3"
            :class="inputClass"
            @input="updateMeta({ remark: ($event.target as HTMLTextAreaElement).value })"
          ></textarea>
        </label>
      </div>
    </article>

    <article :class="cardClass" class="p-6">
      <h2 class="text-xl font-semibold tracking-tight text-gray-900">实时计算</h2>
      <div class="mt-4 grid gap-3 text-sm text-gray-700">
        <div class="rounded-lg bg-gray-50 p-4">
          <p class="text-xs text-gray-500">当前总分</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ formatScore(result.value) }}</strong>
        </div>
        <div class="rounded-lg bg-gray-50 p-4">
          <p class="text-xs text-gray-500">状态</p>
          <span :class="['mt-1 inline-flex rounded-full px-2 py-1 text-xs', statusClass(result.status)]">
            {{ statusLabel(result.status) }}
          </span>
        </div>
        <div class="rounded-lg bg-gray-50 p-4">
          <p class="text-xs text-gray-500">已填测试项</p>
          <strong class="mt-1 block text-lg">{{ filledCount }}</strong>
        </div>
      </div>
      <button :class="secondaryButtonClass" class="mt-4 w-full" @click="resetDraft">清空草稿</button>
    </article>
  </section>

  <section v-if="result.warnings.length" class="mb-6 space-y-3">
    <div
      v-for="warning in result.warnings"
      :key="warning.code + warning.message"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
    >
      <strong class="font-medium">{{ warningLabel(warning.code) }}</strong>
      <span class="ml-2">{{ warning.message }}</span>
    </div>
  </section>

  <section :class="cardClass" class="p-6">
    <div class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">测试值录入</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">数据自动保存在本机浏览器，刷新后不丢失</p>
      </div>
      <input v-model="keyword" type="search" placeholder="搜索测试项" :class="inputClass" />
    </div>

    <div class="mb-6">
      <OptionChips v-model="selectedGroupId" :options="groupOptions" />
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">测试项</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">类型 / 单位</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">输入值</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">备注</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="node in visibleItems" :key="node.id" class="transition-colors duration-200 hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ node.label }}</p>
              <p class="text-xs text-gray-500">{{ parentLabel(node) }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ node.inputType === 'objective' ? '客观' : '主观' }} · {{ unitOf(node) }}
            </td>
            <td class="px-4 py-3">
              <input
                v-if="node.inputType === 'objective'"
                :value="objectiveValue(node)"
                type="text"
                inputmode="decimal"
                placeholder="数值或 inf"
                :class="[inputClass, 'w-36']"
                @input="updateValue(node.id, { objectiveRaw: ($event.target as HTMLInputElement).value })"
              />
              <input
                v-else
                :value="subjectiveValue(node)"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="0~10"
                :class="[inputClass, 'w-28']"
                @input="updateValue(node.id, { subjectiveScore: ($event.target as HTMLInputElement).valueAsNumber })"
              />
            </td>
            <td class="px-4 py-3">
              <input
                :value="draft.values[node.id]?.note ?? ''"
                type="text"
                placeholder="备注"
                :class="[inputClass, 'w-full min-w-40']"
                @input="updateValue(node.id, { note: ($event.target as HTMLInputElement).value })"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
