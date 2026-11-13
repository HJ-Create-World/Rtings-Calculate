<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ChartCard from '../components/ChartCard.vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import TestItemDetailTable from '../components/TestItemDetailTable.vue';
import { evaluateRule } from '../core/evaluate';
import { buildDraftInputs, useEvaluationDraft } from '../composables/useEvaluationDraft';
import { rtingsRule } from '../data/rtingsRule';
import {
  cloudEvaluationToDraft,
  cloudErrorMessage,
  listCloudEvaluations
} from '../services/cloud';
import type { CloudEvaluation } from '../services/cloud';
import { formatScore, statusClass, statusLabel } from '../utils/format';
import { exportEvaluationExcel } from '../utils/evaluationExport';
import { getMainDimensionNodes } from '../utils/ruleDisplay';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const router = useRouter();
const { replaceDraft } = useEvaluationDraft();

const records = ref<CloudEvaluation[]>([]);
const loading = ref(false);
const error = ref('');
const keyword = ref('');
const selectedId = ref('');
const exporting = ref(false);
const selectedGroupId = ref(getMainDimensionNodes()[0]?.id ?? '');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    records.value = await listCloudEvaluations(200);
    if (!selectedId.value && records.value.length) {
      selectedId.value = records.value[0].client_id;
    }
  } catch (exception) {
    error.value = cloudErrorMessage(exception);
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);

const filteredRecords = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return records.value;
  return records.value.filter(record =>
    `${record.brand} ${record.model} ${record.engineer} ${record.test_date} ${record.rule_version}`
      .toLowerCase()
      .includes(text)
  );
});

const selectedRecord = computed(() =>
  records.value.find(record => record.client_id === selectedId.value) ?? filteredRecords.value[0]
);

const selectedDraft = computed(() =>
  selectedRecord.value ? cloudEvaluationToDraft(selectedRecord.value) : null
);

const selectedResult = computed(() => {
  if (!selectedDraft.value) return null;
  return evaluateRule(rtingsRule, buildDraftInputs(selectedDraft.value));
});

const topGroups = computed(() =>
  getMainDimensionNodes(rtingsRule.nodes).filter(node => node.includeInParent)
);

const radarSeries = computed(() => {
  if (!selectedRecord.value || !selectedResult.value) return [];
  const result = selectedResult.value;
  return [
    {
      label: `${selectedRecord.value.brand} ${selectedRecord.value.model}`.trim(),
      values: topGroups.value.map(group => result.nodes[group.id]?.value ?? null)
    }
  ];
});

const selectedProduct = computed(() => {
  if (!selectedDraft.value || !selectedResult.value) return null;
  const expectedScores: Record<string, number | null> = {};
  for (const node of rtingsRule.nodes) {
    expectedScores[node.id] = selectedResult.value.nodes[node.id]?.value ?? null;
  }
  return {
    expectedScores,
    inputs: Object.fromEntries(
      Object.entries(selectedDraft.value.values).map(([nodeId, value]) => [
        nodeId,
        value.objectiveRaw !== undefined
          ? { objective: { value: null, text: value.objectiveRaw } }
          : value.subjectiveScore !== null && value.subjectiveScore !== undefined
            ? { subjective: { scoreTenths: value.subjectiveScore } }
            : {}
      ])
    )
  };
});

function loadForEdit() {
  if (!selectedDraft.value) return;
  replaceDraft(selectedDraft.value);
  router.push('/entry');
}

async function exportExcel() {
  if (!selectedDraft.value) return;
  exporting.value = true;
  try {
    await exportEvaluationExcel(selectedDraft.value);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <section class="mb-8">
    <h1 :class="['text-3xl md:text-4xl', sectionTitleClass]">云端数据</h1>
    <p :class="['mt-2 text-sm md:text-base', mutedTextClass]">
      查看云端评测输入，载入修改，并导出完整 Excel 报告
    </p>
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <input
        v-model="keyword"
        type="search"
        placeholder="搜索品牌、型号、工程师或日期"
        :class="[inputClass, 'w-full md:w-96']"
      />
      <button :class="secondaryButtonClass" :disabled="loading" @click="refresh">
        {{ loading ? '刷新中…' : '刷新云端数据' }}
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="loading" :class="['mt-4 text-sm', mutedTextClass]">正在加载云端评测…</p>
    <p v-else-if="!records.length" :class="['mt-4 text-sm', mutedTextClass]">
      云端还没有评测记录。可先在评分录入页保存到云端。
    </p>

    <div v-else class="mt-4 overflow-x-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">品牌 / 型号</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">测试日期</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">工程师</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">规则版本</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900">总分</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="record in filteredRecords"
            :key="record.client_id"
            class="cursor-pointer transition-colors duration-200 hover:bg-gray-50"
            :class="selectedRecord?.client_id === record.client_id ? 'bg-blue-50' : ''"
            @click="selectedId = record.client_id"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ record.brand }} {{ record.model }}</p>
              <p :class="['text-xs', mutedTextClass]">{{ record.engineer || '—' }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ record.test_date || '—' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ record.engineer || '—' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ record.rule_version }}</td>
            <td class="px-4 py-3 text-right font-medium text-blue-700">
              {{ formatScore(record.expected_total) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section
    v-if="selectedRecord && selectedDraft && selectedResult"
    :class="cardClass"
    class="mb-6 p-6"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">
          {{ selectedRecord.brand }} {{ selectedRecord.model }}
        </h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          {{ selectedRecord.test_date || '—' }} · {{ selectedRecord.engineer || '—' }} ·
          {{ selectedRecord.rule_version }}
        </p>
      </div>
      <div class="flex shrink-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div class="rounded-xl bg-blue-50 px-4 py-3 text-right">
          <p class="text-xs text-blue-700">Mixed Usage</p>
          <strong class="block text-2xl font-semibold text-blue-700">
            {{ formatScore(selectedResult.value) }}
          </strong>
          <span :class="['mt-2 inline-flex rounded-full px-2 py-1 text-xs', statusClass(selectedResult.status)]">
            {{ statusLabel(selectedResult.status) }}
          </span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button :class="primaryButtonClass" @click="loadForEdit">载入并修改</button>
          <button :class="secondaryButtonClass" :disabled="exporting" @click="exportExcel">
            {{ exporting ? '导出中…' : '导出完整 Excel' }}
          </button>
        </div>
      </div>
    </div>
  </section>

  <section
    v-if="selectedRecord && selectedDraft && selectedResult && selectedProduct"
    class="mb-6"
  >
    <ChartCard title="主维度雷达图" description="云端评测的主维度得分">
      <GroupRadarChart
        :labels="topGroups.map(group => group.label)"
        :series="radarSeries"
        height="460px"
        chart-title="云端主维度雷达图"
      />
    </ChartCard>
  </section>

  <TestItemDetailTable
    v-if="selectedRecord && selectedDraft && selectedResult && selectedProduct"
    :baseline="selectedProduct"
    :top-groups="topGroups"
    :selected-group-id="selectedGroupId"
    @update:selected-group-id="selectedGroupId = $event"
  />
</template>
