<script setup lang="ts">
import { computed, ref } from 'vue';
import OptionChips from '../components/OptionChips.vue';
import UiSelect from '../components/UiSelect.vue';
import ImportView from './ImportView.vue';
import { useEvaluationDraft } from '../composables/useEvaluationDraft';
import { rtingsRule } from '../data/rtingsRule';
import type { ScoreNode } from '../core/types';
import { cloudErrorMessage, saveEvaluationToCloud } from '../services/cloud';
import {
  deleteLocalEvaluation,
  listLocalEvaluations,
  saveLocalEvaluation,
  validateDraftMeta
} from '../services/localEvaluations';
import type { LocalEvaluation } from '../services/localEvaluations';
import { formatScore, statusClass, statusLabel, warningLabel } from '../utils/format';
import { collectLeafItemsByDocumentOrder, getMainDimensionNodes } from '../utils/ruleDisplay';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const {
  draft,
  result,
  filledCount,
  updateMeta,
  updateValue,
  resetDraft
} = useEvaluationDraft();

const groups = getMainDimensionNodes();
const groupOptions = groups.map(group => ({ value: group.id, label: group.label }));
const selectedGroupId = ref(groups[0]?.id ?? '');
const keyword = ref('');
const inputMode = ref<'manual' | 'import'>('manual');
const inputModeOptions = [
  { value: 'manual', label: '手工录入' },
  { value: 'import', label: 'Excel 导入' }
];

const inputNodeCount = rtingsRule.nodes.filter(node => node.inputType !== 'aggregate').length;
const hasAnyInput = computed(() => filledCount.value > 0);
const warningGroups = computed(() => {
  const groupsByCode = new Map<string, { code: string; count: number; messages: string[] }>();
  for (const warning of result.value.warnings) {
    const current = groupsByCode.get(warning.code) ?? {
      code: warning.code,
      count: 0,
      messages: []
    };
    current.count += 1;
    if (!current.messages.includes(warning.message)) current.messages.push(warning.message);
    groupsByCode.set(warning.code, current);
  }
  return [...groupsByCode.values()];
});

function parentLabel(node: ScoreNode): string {
  const parent = rtingsRule.nodes.find(item => item.id === node.parentId);
  return parent?.label ?? '';
}

function unitOf(node: ScoreNode): string {
  if (node.inputType !== 'objective') return '0~10';
  const mapping = rtingsRule.mappings.find(item => item.id === node.mappingId);
  return node.unit ?? mapping?.unit ?? '数值';
}

function mappingFor(node: ScoreNode) {
  return rtingsRule.mappings.find(item => item.id === node.mappingId);
}

function categoryOptions(node: ScoreNode) {
  const mapping = mappingFor(node);
  return mapping?.kind === 'categorical' ? mapping.values ?? [] : [];
}

function categorySelectOptions(node: ScoreNode) {
  return [
    { value: '', label: '请选择' },
    ...categoryOptions(node).map(option => ({ value: option.value, label: option.value }))
  ];
}

const allItems = computed(() =>
  collectLeafItemsByDocumentOrder(selectedGroupId.value).map(item => item.node)
);
const visibleItems = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return allItems.value;
  return allItems.value.filter(node =>
    `${parentLabel(node)} ${node.label}`.toLowerCase().includes(text)
  );
});

const metaFields = [
  { key: 'brand', label: '品牌', required: true, type: 'text' },
  { key: 'model', label: '型号', required: true, type: 'text' },
  { key: 'testDate', label: '测试日期', required: true, type: 'date' },
  { key: 'engineer', label: '测试工程师', required: true, type: 'text' }
] as const;

const metaErrors = ref<Partial<Record<'brand' | 'model' | 'testDate' | 'engineer', string>>>({});
const cloudSaving = ref(false);
const cloudMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const localSaving = ref(false);
const localMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const localEvaluations = ref<LocalEvaluation[]>(listLocalEvaluations());

function refreshLocalEvaluations() {
  localEvaluations.value = listLocalEvaluations();
}

function saveToLocal() {
  localMessage.value = null;
  const validation = validateDraftMeta(draft.value);
  metaErrors.value = validation.errors;
  if (!validation.valid) {
    localMessage.value = { type: 'error', text: '请先填写品牌、型号、测试日期和测试工程师' };
    return;
  }

  localSaving.value = true;
  try {
    saveLocalEvaluation(draft.value, result.value.value);
    refreshLocalEvaluations();
    localMessage.value = { type: 'success', text: '已保存到本机历史库' };
  } catch {
    localMessage.value = { type: 'error', text: '本机保存失败，请检查浏览器存储权限' };
  } finally {
    localSaving.value = false;
  }
}

async function saveToCloud() {
  const validation = validateDraftMeta(draft.value);
  metaErrors.value = validation.errors;
  if (!validation.valid) {
    cloudMessage.value = { type: 'error', text: '请先填写品牌、型号、测试日期和测试工程师' };
    return;
  }

  cloudSaving.value = true;
  cloudMessage.value = null;
  try {
    await saveEvaluationToCloud(draft.value, result.value.value);
    cloudMessage.value = {
      type: 'success',
      text: '已保存到云端历史评测库'
    };
  } catch (error) {
    cloudMessage.value = {
      type: 'error',
      text: cloudErrorMessage(error)
    };
  } finally {
    cloudSaving.value = false;
  }
}

function loadLocalEvaluation(record: LocalEvaluation) {
  draft.value = JSON.parse(JSON.stringify(record.draft));
  metaErrors.value = {};
  localMessage.value = { type: 'success', text: '已载入本机保存的评测' };
}

function removeLocalEvaluation(id: string) {
  deleteLocalEvaluation(id);
  refreshLocalEvaluations();
}

function objectiveValue(node: ScoreNode): string {
  return draft.value.values[node.id]?.objectiveRaw ?? '';
}

function subjectiveValue(node: ScoreNode): number | null {
  const score = draft.value.values[node.id]?.subjectiveScore;
  return score === null || score === undefined ? null : score / 10;
}

function hasInput(node: ScoreNode): boolean {
  const value = draft.value.values[node.id];
  if (node.inputType === 'objective') return Boolean(value?.objectiveRaw?.trim());
  return value?.subjectiveScore !== null && value?.subjectiveScore !== undefined;
}

function itemStatusClass(node: ScoreNode): string {
  const evaluation = result.value.nodes[node.id];
  if (!node.includeInParent) return 'status-excluded';
  if (evaluation?.status === 'scored') return 'status-scored';
  if (!hasInput(node)) return 'status-neutral';
  return 'status-incomplete';
}

function itemScoreLabel(node: ScoreNode): string {
  const evaluation = result.value.nodes[node.id];
  if (!node.includeInParent) return '不计入';
  if (evaluation?.status === 'scored') return formatScore(evaluation.value);
  if (!hasInput(node)) return '未填';
  return '待确认';
}

function isEstimated(node: ScoreNode): boolean {
  return Boolean(result.value.nodes[node.id]?.mappingTrace?.estimated);
}

function itemScoreTitle(node: ScoreNode): string {
  const evaluation = result.value.nodes[node.id];
  if (node.inputType === 'subjective' && evaluation?.status === 'scored') {
    return '主观项：工程师直接评分，不走映射或反推规则';
  }
  if (evaluation?.status === 'scored') {
    return evaluation.mappingTrace?.matchedInterval?.rawText ?? '';
  }
  return evaluation?.warnings[0]?.message ?? '';
}
</script>

<template>
  <div class="mb-6">
    <OptionChips v-model="inputMode" :options="inputModeOptions" />
  </div>

  <ImportView v-if="inputMode === 'import'" />

  <template v-else>
  <section class="mb-8 grid gap-6 lg:grid-cols-4">
    <article :class="cardClass" class="p-6 lg:col-span-3">
      <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">产品档案</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <label
          v-for="field in metaFields"
          :key="field.key"
          class="grid gap-2 text-sm"
        >
          <span class="text-gray-700">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </span>
          <input
            :value="draft[field.key]"
            :type="field.type ?? 'text'"
            :class="[inputClass, metaErrors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '']"
            @input="updateMeta({ [field.key]: ($event.target as HTMLInputElement).value })"
          />
          <span v-if="metaErrors[field.key]" class="text-xs text-red-600">
            {{ metaErrors[field.key] }}
          </span>
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
          <strong class="mt-1 block text-lg">{{ filledCount }} / {{ inputNodeCount }}</strong>
        </div>
      </div>
      <button :class="secondaryButtonClass" class="mt-4 w-full" @click="resetDraft">清空草稿</button>
      <button
        :class="secondaryButtonClass"
        class="mt-3 w-full"
        :disabled="localSaving"
        @click="saveToLocal"
      >
        {{ localSaving ? '保存中…' : '保存到本机' }}
      </button>
      <button
        :class="primaryButtonClass"
        class="mt-3 w-full"
        :disabled="cloudSaving"
        @click="saveToCloud"
      >
        {{ cloudSaving ? '保存中…' : '保存到云端' }}
      </button>
      <p
        v-if="cloudMessage"
        :class="[
          'mt-3 rounded-lg p-3 text-xs',
          cloudMessage.type === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-600'
        ]"
      >
        {{ cloudMessage.text }}
      </p>
      <p
        v-if="localMessage"
        :class="[
          'mt-3 rounded-lg p-3 text-xs',
          localMessage.type === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-600'
        ]"
      >
        {{ localMessage.text }}
      </p>
    </article>
  </section>

  <section v-if="localEvaluations.length" :class="cardClass" class="mb-6 p-6">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h2 class="text-xl font-semibold tracking-tight text-gray-900">本机保存记录</h2>
      <span :class="['text-xs', mutedTextClass]">{{ localEvaluations.length }} 条</span>
    </div>
    <div class="overflow-x-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">品牌 / 型号</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">测试日期</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">工程师</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900">总分</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="record in localEvaluations"
            :key="record.draft.id"
            class="transition-colors duration-200 hover:bg-gray-50"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ record.draft.brand }} {{ record.draft.model }}</p>
              <p :class="['text-xs', mutedTextClass]">{{ record.draft.engineer || '—' }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ record.draft.testDate || '—' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ record.draft.engineer || '—' }}</td>
            <td class="px-4 py-3 text-right font-medium text-blue-700">
              {{ formatScore(record.expectedTotal) }}
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                :class="secondaryButtonClass"
                class="!px-3 !py-1 !text-xs"
                @click="loadLocalEvaluation(record)"
              >
                载入修改
              </button>
              <button
                type="button"
                class="ml-2 rounded-lg px-3 py-1 text-xs font-medium text-red-600 transition-all duration-200 ease-out hover:bg-red-50 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                @click="removeLocalEvaluation(record.draft.id)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section v-if="!hasAnyInput" class="mb-6">
    <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
      <p class="font-medium">尚未填写测试值</p>
      <p class="mt-1">
        请从下方选择分组并录入客观测试值或主观评分。系统不会自动补零，因此在数据完整前不输出正式总分。
      </p>
    </div>
  </section>

  <section v-else-if="warningGroups.length" class="mb-6">
    <details class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
      <summary class="cursor-pointer font-medium">
        计算提示（{{ result.warnings.length }} 条）
      </summary>
      <div class="mt-3 space-y-3">
        <div v-for="group in warningGroups" :key="group.code">
          <p class="font-medium">{{ warningLabel(group.code) }} · {{ group.count }}</p>
          <ul class="mt-1 list-disc space-y-1 pl-5">
            <li v-for="message in group.messages" :key="message">{{ message }}</li>
          </ul>
        </div>
      </div>
    </details>
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
            <th class="px-4 py-3 text-left font-semibold text-gray-900">输入值</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">类型 / 单位</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">单项评分</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">备注</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="node in visibleItems" :key="node.id" class="transition-colors duration-200 hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ node.label }}</p>
              <p class="text-xs text-gray-500">{{ parentLabel(node) }}</p>
            </td>
            <td class="px-4 py-3">
              <div v-if="categoryOptions(node).length" class="w-36">
                <UiSelect
                  :model-value="objectiveValue(node)"
                  :options="categorySelectOptions(node)"
                  aria-label="选择类别值"
                  @update:model-value="updateValue(node.id, { objectiveRaw: $event })"
                />
              </div>
              <input
                v-else-if="node.inputType === 'objective'"
                :value="objectiveValue(node)"
                type="text"
                inputmode="decimal"
                :placeholder="`数值${unitOf(node) === '数值' ? '或 inf' : `（${unitOf(node)}）`}`"
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
                inputmode="decimal"
                placeholder="输入评分，如 9.5"
                :class="[inputClass, 'w-32']"
                @input="updateValue(node.id, { subjectiveScore: Math.round(($event.target as HTMLInputElement).valueAsNumber * 10) })"
              />
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ node.inputType === 'objective' ? '客观' : '主观' }} ·
              {{ node.inputType === 'subjective' ? '工程师评分' : unitOf(node) }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="['inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs', itemStatusClass(node)]"
                :title="itemScoreTitle(node)"
              >
                {{ itemScoreLabel(node) }}
                <span
                  v-if="isEstimated(node)"
                  class="rounded-full bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700"
                >
                  预估
                </span>
              </span>
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
</template>
