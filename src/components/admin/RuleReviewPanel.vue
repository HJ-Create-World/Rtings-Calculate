<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiSelect from '../UiSelect.vue';
import { useAuth } from '../../composables/useAuth';
import {
  createRuleReview,
  deleteRuleReview,
  getDataDiff,
  getDataSnapshot,
  listDataDiffs,
  listRuleReviews,
  listRuleVersions,
  ruleAdminErrorMessage,
  updateRuleReview,
  type DataDiff,
  type DataDiffReport,
  type DataSnapshotFull,
  type RuleReview,
  type RuleVersion
} from '../../services/ruleAdministration';
import {
  aiErrorMessage,
  buildColumnReviewContexts,
  generateColumnSuggestions,
  generateProductSuggestions,
  listLlmModels,
  type AiSuggestionDraft,
  type ColumnReviewContext,
  type LlmModelOption
} from '../../services/aiReview';
import { mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../../utils/ui';
import RuleDraftPanel from './RuleDraftPanel.vue';

const { session } = useAuth();

const diffs = ref<DataDiff[]>([]);
const models = ref<LlmModelOption[]>([]);
const ruleVersions = ref<RuleVersion[]>([]);
const reviews = ref<RuleReview[]>([]);
const report = ref<DataDiffReport | null>(null);
const snapshot = ref<DataSnapshotFull | null>(null);

const selectedDiffId = ref('');
const selectedModelId = ref('');
const selectedColumnIds = ref<string[]>([]);
const drafts = ref<AiSuggestionDraft[]>([]);
const selectedDraftIds = ref<string[]>([]);
const reviewNote = ref('');

const loading = ref(false);
const modelsLoading = ref(false);
const aiRunning = ref(false);
const aiProgress = ref('');
const savingDrafts = ref(false);
const updatingReviewId = ref('');
const error = ref('');
const notice = ref('');
const aiError = ref('');

const diffOptions = computed(() => [
  { value: '', label: '选择差异报告' },
  ...diffs.value.map(diff => ({
    value: diff.id,
    label: `${diff.baseVersionLabel ?? '旧版本'} → ${diff.targetVersionLabel ?? '新版本'}`
  }))
]);

const modelOptions = computed(() => {
  if (modelsLoading.value) {
    return [{ value: '', label: '模型加载中…' }];
  }
  if (!models.value.length) {
    return [{ value: '', label: aiError.value ? 'AI 能力未开启 / 无可用模型' : '暂无可用 AI 模型' }];
  }
  return [
    { value: '', label: '选择 AI 模型' },
    ...models.value.map(model => ({
      value: model.id,
      label: model.credits ? `${model.name} · ${model.credits}` : model.name
    }))
  ];
});

const activeRuleVersion = computed(() =>
  ruleVersions.value.find(version => version.status === 'active') ?? null
);

const addedColumns = computed(() => report.value?.report.addedColumns ?? []);
const addedProducts = computed(() => report.value?.report.addedProducts ?? []);
const columnContexts = computed<ColumnReviewContext[]>(() =>
  snapshot.value && addedColumns.value.length
    ? buildColumnReviewContexts(snapshot.value, addedColumns.value)
    : []
);

const selectedColumnsForAi = computed(() =>
  addedColumns.value.filter(column => selectedColumnIds.value.includes(column))
);

const existingByKey = computed(() =>
  new Set(reviews.value.map(review => `${review.objectType}:${review.itemId}`))
);

const canGenerate = computed(() => Boolean(
  selectedDiffId.value && selectedModelId.value && selectedColumnsForAi.value.length && snapshot.value
));

const summary = computed(() => report.value?.report.summary);

async function loadModels() {
  const token = session.value?.token;
  if (!token) return;
  modelsLoading.value = true;
  aiError.value = '';
  try {
    const modelList = await listLlmModels();
    models.value = modelList;
    if (!modelList.length) {
      aiError.value = '当前应用暂无可用 AI 模型，请稍后刷新或检查 WorkBuddy 云服务 AI 能力状态。';
    } else if (!selectedModelId.value) {
      selectedModelId.value = modelList[0].id;
    }
  } catch (err) {
    aiError.value = aiErrorMessage(err);
    models.value = [];
    selectedModelId.value = '';
  } finally {
    modelsLoading.value = false;
  }
}

async function load() {
  const token = session.value?.token;
  if (!token) return;
  loading.value = true;
  error.value = '';
  try {
    const [diffList, versionList] = await Promise.all([
      listDataDiffs(token),
      listRuleVersions(token)
    ]);
    diffs.value = diffList;
    ruleVersions.value = versionList;

    if (!selectedDiffId.value && diffList.length) selectedDiffId.value = diffList[0].id;
    if (selectedDiffId.value) await selectDiff(selectedDiffId.value);
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '加载审阅数据失败');
  } finally {
    loading.value = false;
  }
}

async function refreshReviews() {
  const token = session.value?.token;
  if (!token || !report.value) return;
  reviews.value = await listRuleReviews(token, report.value.targetSnapshotId);
}

async function selectDiff(diffId: string) {
  selectedDiffId.value = diffId;
  report.value = null;
  snapshot.value = null;
  reviews.value = [];
  drafts.value = [];
  selectedDraftIds.value = [];
  selectedColumnIds.value = [];
  error.value = '';
  notice.value = '';
  if (!diffId) return;

  loading.value = true;
  try {
    const token = session.value?.token;
    if (!token) return;
    const detail = await getDataDiff(token, diffId);
    report.value = detail;
    snapshot.value = await getDataSnapshot(token, detail.targetSnapshotId);
    selectedColumnIds.value = (detail.report.addedColumns ?? []).slice(0, 8);
    await refreshReviews();
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '加载差异报告失败');
  } finally {
    loading.value = false;
  }
}

function toggleSelection(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value];
}

async function generateSuggestions() {
  const token = session.value?.token;
  if (!token || !report.value || !snapshot.value || !selectedModelId.value) return;
  if (!selectedColumnsForAi.value.length) {
    error.value = '请选择至少一个新增测试列';
    return;
  }

  aiRunning.value = true;
  error.value = '';
  notice.value = '';
  aiProgress.value = 'AI 正在分析新增测试列…';
  try {
    const suggestions = await generateColumnSuggestions({
      modelId: selectedModelId.value,
      report: report.value,
      snapshot: snapshot.value,
      columns: selectedColumnsForAi.value,
      onProgress: (completed, total) => {
        aiProgress.value = `AI 分析进度：${completed} / ${total} 批`;
      }
    });

    const existing = new Set(drafts.value.map(draft => `${draft.objectType}:${draft.itemId}`));
    const next = suggestions.filter(draft => !existing.has(`${draft.objectType}:${draft.itemId}`));
    drafts.value = [...next, ...drafts.value];
    selectedDraftIds.value = next.map(draft => `${draft.objectType}:${draft.itemId}`);
    notice.value = `AI 已生成 ${next.length} 条建议草稿，请确认后保存`;
  } catch (err) {
    error.value = aiErrorMessage(err);
  } finally {
    aiRunning.value = false;
    aiProgress.value = '';
  }
}

async function generateProducts() {
  const token = session.value?.token;
  if (!token || !report.value || !selectedModelId.value) return;
  if (!addedProducts.value.length) {
    notice.value = '当前差异没有新增机型';
    return;
  }

  aiRunning.value = true;
  error.value = '';
  notice.value = '';
  aiProgress.value = 'AI 正在分析新增机型…';
  try {
    const suggestions = await generateProductSuggestions({
      modelId: selectedModelId.value,
      report: report.value,
      onProgress: (completed, total) => {
        aiProgress.value = `AI 机型分析进度：${completed} / ${total} 批`;
      }
    });
    const existing = new Set(drafts.value.map(draft => `${draft.objectType}:${draft.itemId}`));
    const next = suggestions.filter(draft => !existing.has(`${draft.objectType}:${draft.itemId}`));
    drafts.value = [...next, ...drafts.value];
    selectedDraftIds.value = [
      ...selectedDraftIds.value,
      ...next.map(draft => `${draft.objectType}:${draft.itemId}`)
    ];
    notice.value = `AI 已生成 ${next.length} 条机型建议草稿`;
  } catch (err) {
    error.value = aiErrorMessage(err);
  } finally {
    aiRunning.value = false;
    aiProgress.value = '';
  }
}

async function saveDrafts() {
  const token = session.value?.token;
  if (!token || !report.value) return;
  const targets = drafts.value.filter(draft =>
    selectedDraftIds.value.includes(`${draft.objectType}:${draft.itemId}`)
  );
  if (!targets.length) {
    notice.value = '请先选择要保存的建议';
    return;
  }

  savingDrafts.value = true;
  error.value = '';
  notice.value = '';
  try {
    let saved = 0;
    for (const draft of targets) {
      const key = `${draft.objectType}:${draft.itemId}`;
      if (existingByKey.value.has(key)) continue;
      await createRuleReview(token, {
        targetSnapshotId: report.value.targetSnapshotId,
        ruleVersionId: activeRuleVersion.value?.id ?? null,
        objectType: draft.objectType,
        itemId: draft.itemId,
        title: draft.title,
        recommendation: draft.recommendation,
        payload: draft.payload,
        sourceType: draft.sourceType,
        model: draft.model,
        confidence: draft.confidence,
        evidence: draft.evidence
      });
      saved += 1;
    }
    notice.value = `已保存 ${saved} 条建议到审阅库`;
    await refreshReviews();
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '保存 AI 建议失败');
  } finally {
    savingDrafts.value = false;
  }
}

async function changeReview(review: RuleReview, status: RuleReview['status']) {
  const token = session.value?.token;
  if (!token) return;
  updatingReviewId.value = review.id;
  error.value = '';
  notice.value = '';
  try {
    const updated = await updateRuleReview(token, review.id, status, reviewNote.value.trim() || review.reviewNote || undefined);
    const index = reviews.value.findIndex(item => item.id === review.id);
    if (index >= 0) reviews.value[index] = { ...reviews.value[index], ...updated };
    notice.value = '审阅状态已更新';
    reviewNote.value = '';
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '更新审阅状态失败');
  } finally {
    updatingReviewId.value = '';
  }
}

async function removeReview(review: RuleReview) {
  const token = session.value?.token;
  if (!token) return;
  updatingReviewId.value = review.id;
  try {
    await deleteRuleReview(token, review.id);
    reviews.value = reviews.value.filter(item => item.id !== review.id);
    notice.value = '建议已删除';
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '删除建议失败');
  } finally {
    updatingReviewId.value = '';
  }
}

function formatPercent(value?: number | null): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';
}

function recommendationLabel(value: string): string {
  const labels: Record<string, string> = {
    objective_mapping: '候选客观映射',
    subjective: '候选主观评分',
    display_only: '仅展示',
    exclude: '排除',
    needs_raw_data: '缺原始数据',
    candidate_product: '候选机型'
  };
  return labels[value] ?? value;
}

onMounted(() => {
  void load();
  void loadModels();
});
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div class="min-w-0">
        <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">差异审阅与 AI 建议</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          AI 只生成候选建议，不直接修改规则；管理员确认后写入审阅库
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <button
          :class="secondaryButtonClass"
          class="!px-3 !py-2 !text-xs"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? '数据刷新中…' : '刷新数据' }}
        </button>
        <button
          :class="secondaryButtonClass"
          class="!px-3 !py-2 !text-xs"
          :disabled="modelsLoading"
          @click="loadModels"
        >
          {{ modelsLoading ? '模型刷新中…' : '刷新模型' }}
        </button>
      </div>
    </div>

    <div class="mb-6 grid gap-3 lg:grid-cols-2">
      <UiSelect
        :model-value="selectedDiffId"
        :options="diffOptions"
        aria-label="选择差异报告"
        searchable
        @update:model-value="selectDiff"
      />
      <UiSelect
        v-model="selectedModelId"
        :options="modelOptions"
        aria-label="选择 AI 模型"
        searchable
      />
    </div>

    <p v-if="aiProgress" class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{{ aiProgress }}</p>
    <p v-if="notice" class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ notice }}</p>
    <p v-if="aiError" class="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
      {{ aiError }}
      <span v-if="modelsLoading" class="ml-2">正在加载可用模型…</span>
    </p>
    <p v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

    <div v-if="summary" class="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">基线版本</p>
        <strong class="mt-1 block text-base text-gray-900">{{ summary.baseVersionLabel }}</strong>
      </article>
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">目标版本</p>
        <strong class="mt-1 block text-base text-gray-900">{{ summary.targetVersionLabel }}</strong>
      </article>
      <article class="rounded-xl bg-blue-50 p-4">
        <p class="text-xs text-blue-700">新增列</p>
        <strong class="mt-1 block text-2xl text-blue-700">{{ summary.addedColumns }}</strong>
      </article>
      <article class="rounded-xl bg-amber-50 p-4">
        <p class="text-xs text-amber-700">移除列</p>
        <strong class="mt-1 block text-2xl text-amber-700">{{ summary.removedColumns }}</strong>
      </article>
      <article class="rounded-xl bg-emerald-50 p-4">
        <p class="text-xs text-emerald-700">新增机型</p>
        <strong class="mt-1 block text-2xl text-emerald-700">{{ summary.addedProducts }}</strong>
      </article>
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">变化单元格</p>
        <strong class="mt-1 block text-2xl text-gray-900">{{ summary.changedCells }}</strong>
      </article>
    </div>

    <section class="rounded-xl border border-gray-200 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">新增测试列</h3>
          <p :class="['mt-1 text-sm', mutedTextClass]">已选 {{ selectedColumnsForAi.length }} / {{ addedColumns.length }} 列</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            :class="secondaryButtonClass"
            :disabled="!addedColumns.length"
            @click="selectedColumnIds = addedColumns.slice(0, 8)"
          >
            选前 8 列
          </button>
          <button
            :class="secondaryButtonClass"
            :disabled="!addedColumns.length"
            @click="selectedColumnIds = [...addedColumns]"
          >
            全选
          </button>
          <button
            :class="primaryButtonClass"
            :disabled="aiRunning || !canGenerate"
            @click="generateSuggestions"
          >
            {{ aiRunning ? 'AI 分析中…' : '生成 AI 建议' }}
          </button>
        </div>
      </div>

      <div class="mt-4 max-h-[420px] overflow-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr>
              <th class="w-12 px-3 py-3"></th>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">测试列</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">数据特征</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">官方得分</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="context in columnContexts" :key="context.label" class="hover:bg-gray-50">
              <td class="px-3 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4"
                  :checked="selectedColumnIds.includes(context.label)"
                  :aria-label="`选择 ${context.label}`"
                  @change="selectedColumnIds = toggleSelection(selectedColumnIds, context.label)"
                />
              </td>
              <td class="px-3 py-3">
                <p class="font-medium text-gray-900">{{ context.label }}</p>
              </td>
              <td class="px-3 py-3 text-xs text-gray-600">
                有效 {{ context.stats.nonEmptyCount }} / {{ context.stats.rowCount }} ·
                数值 {{ context.stats.numericCount }} ·
                唯一 {{ context.stats.uniqueCount }}
                <template v-if="context.stats.min !== undefined">
                  · 范围 {{ context.stats.min }} ~ {{ context.stats.max }}
                </template>
              </td>
              <td class="px-3 py-3 text-right text-xs text-gray-600">
                {{ context.stats.scoreCount }}
                <template v-if="context.stats.scoreMean !== undefined">
                  · 均值 {{ context.stats.scoreMean.toFixed(1) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="addedProducts.length" class="mt-6 rounded-xl border border-gray-200 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">新增机型</h3>
          <p :class="['mt-1 text-sm', mutedTextClass]">{{ addedProducts.length }} 台候选机型</p>
        </div>
        <button :class="primaryButtonClass" :disabled="aiRunning" @click="generateProducts">
          {{ aiRunning ? 'AI 分析中…' : '生成机型建议' }}
        </button>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="product in addedProducts"
          :key="product.product"
          class="rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <p class="font-medium text-gray-900">{{ product.product }}</p>
          <p :class="['mt-2 text-xs', mutedTextClass]">
            品牌列：{{ product.value['Brand (general:brand)'] ?? '—' }} ·
            屏幕：{{ product.value['Panel Type (test:217)'] ?? '—' }} ·
            背光：{{ product.value['Backlight (test:215)'] ?? '—' }}
          </p>
        </article>
      </div>
    </section>

    <section v-if="drafts.length" class="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">AI 建议草稿</h3>
          <p :class="['mt-1 text-sm', mutedTextClass]">已选 {{ selectedDraftIds.length }} / {{ drafts.length }} 条</p>
        </div>
        <button :class="primaryButtonClass" :disabled="savingDrafts || !selectedDraftIds.length" @click="saveDrafts">
          {{ savingDrafts ? '保存中…' : '保存选中建议' }}
        </button>
      </div>

      <div class="mt-4 grid gap-4 xl:grid-cols-2">
        <article
          v-for="draft in drafts"
          :key="`${draft.objectType}:${draft.itemId}`"
          class="rounded-xl border border-gray-200 bg-white p-4"
        >
          <label class="flex items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 h-4 w-4"
              :checked="selectedDraftIds.includes(`${draft.objectType}:${draft.itemId}`)"
              @change="selectedDraftIds = toggleSelection(selectedDraftIds, `${draft.objectType}:${draft.itemId}`)"
            />
            <span>
              <span class="block font-medium text-gray-900">{{ draft.title }}</span>
              <span :class="['mt-1 block text-xs', mutedTextClass]">{{ draft.itemId }}</span>
            </span>
          </label>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">
              {{ recommendationLabel(draft.recommendation) }}
            </span>
            <span class="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
              置信度 {{ formatPercent(draft.confidence) }}
            </span>
            <span class="rounded-full bg-gray-100 px-2 py-1 text-gray-600">{{ draft.model }}</span>
          </div>
          <p class="mt-3 text-sm leading-6 text-gray-700">{{ draft.rationale }}</p>
        </article>
      </div>
    </section>

    <section class="mt-6 rounded-xl border border-gray-200 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 class="text-lg font-semibold text-gray-900">已保存建议</h3>
        <input
          v-model="reviewNote"
          type="text"
          placeholder="审阅备注（更新状态时使用）"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:max-w-sm"
        />
      </div>

      <div class="mt-4 max-h-[520px] overflow-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">对象</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">建议</th>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">状态</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="review in reviews" :key="review.id" class="hover:bg-gray-50">
              <td class="px-3 py-3">
                <p class="font-medium text-gray-900">{{ review.title }}</p>
                <p class="text-xs text-gray-500">{{ review.itemId }} · {{ review.model ?? review.sourceType }}</p>
              </td>
              <td class="px-3 py-3">
                <span class="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                  {{ recommendationLabel(review.recommendation) }}
                </span>
                <p :class="['mt-2 text-xs', mutedTextClass]">置信度 {{ formatPercent(review.confidence) }}</p>
              </td>
              <td class="px-3 py-3">
                <span
                  :class="[
                    'rounded-full px-2 py-1 text-xs',
                    review.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : review.status === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : review.status === 'deferred'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ review.status === 'approved' ? '已确认' : review.status === 'rejected' ? '已拒绝' : review.status === 'deferred' ? '暂缓' : '待审阅' }}
                </span>
              </td>
              <td class="px-3 py-3 text-right">
                <div class="inline-flex flex-wrap justify-end gap-1">
                  <button
                    :class="secondaryButtonClass"
                    class="!px-2 !py-1 !text-xs"
                    :disabled="updatingReviewId === review.id"
                    @click="changeReview(review, 'approved')"
                  >
                    确认
                  </button>
                  <button
                    :class="secondaryButtonClass"
                    class="!px-2 !py-1 !text-xs"
                    :disabled="updatingReviewId === review.id"
                    @click="changeReview(review, 'deferred')"
                  >
                    暂缓
                  </button>
                  <button
                    :class="secondaryButtonClass"
                    class="!px-2 !py-1 !text-xs !text-red-600 hover:!bg-red-50"
                    :disabled="updatingReviewId === review.id"
                    @click="removeReview(review)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <RuleDraftPanel
      :reviews="reviews"
      :report="report"
      :snapshot="snapshot"
      :active-version="activeRuleVersion ?? null"
    />
  </section>
</template>
