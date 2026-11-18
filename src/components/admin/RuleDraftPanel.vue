<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { rtingsRule } from '../../data/rtingsRule';
import {
  createRuleVersion,
  getRuleVersion,
  ruleAdminErrorMessage,
  type DataDiffReport,
  type DataSnapshotFull,
  type RuleReview,
  type RuleVersion
} from '../../services/ruleAdministration';
import {
  buildRuleDraft,
  compareRegressions,
  runRegression,
  updateDraftCandidates,
  type DraftCandidate,
  type RegressionReport
} from '../../services/ruleDraft';
import type { ScoringRule } from '../../core/types';
import { inputClass, mutedTextClass, primaryButtonClass, sectionTitleClass } from '../../utils/ui';

const props = defineProps<{
  reviews: RuleReview[];
  report: DataDiffReport | null;
  snapshot: DataSnapshotFull | null;
  activeVersion: RuleVersion | null;
}>();

const { session } = useAuth();

const baseRule = ref<ScoringRule>(rtingsRule);
const selectedReviewIds = ref<string[]>([]);
const candidates = ref<DraftCandidate[]>([]);
const draftRule = ref<ScoringRule | null>(null);
const baseRegression = ref<RegressionReport | null>(null);
const draftRegression = ref<RegressionReport | null>(null);
const comparison = ref<RegressionReport | null>(null);
const skipped = ref<Array<{ itemId: string; reason: string }>>([]);

const draftVersion = ref(`v3.1-ai-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
const generating = ref(false);
const creating = ref(false);
const error = ref('');
const notice = ref('');

const selectableReviews = computed(() =>
  props.reviews.filter(review =>
    review.objectType === 'column' &&
    !['exclude', 'needs_raw_data'].includes(review.recommendation)
  )
);

const selectedReviews = computed(() =>
  props.reviews.filter(review => selectedReviewIds.value.includes(review.id))
);

const includedCandidates = computed(() => candidates.value.filter(candidate => candidate.includeInParent));

const canGenerate = computed(() => Boolean(
  baseRule.value && props.snapshot && selectedReviewIds.value.length
));

const regressionSummary = computed(() => comparison.value?.summary ?? null);

const candidateTable = computed(() =>
  candidates.value.map(candidate => ({
    ...candidate,
    mappingKind: candidate.mapping?.kind ?? (candidate.recommendation === 'subjective' ? 'subjective' : '—'),
    anchorCount: candidate.mapping?.anchors?.length ?? 0,
    valueCount: candidate.mapping?.values?.length ?? 0
  }))
);

async function loadBaseRule() {
  const token = session.value?.token;
  if (!token) return;
  if (props.activeVersion?.id) {
    try {
      const version = await getRuleVersion(token, props.activeVersion.id);
      baseRule.value = version.rule as unknown as ScoringRule;
      return;
    } catch (err) {
      error.value = ruleAdminErrorMessage(err, '读取当前规则版本失败，已回退本地规则');
    }
  }
  baseRule.value = rtingsRule;
}

function toggleReview(reviewId: string) {
  selectedReviewIds.value = selectedReviewIds.value.includes(reviewId)
    ? selectedReviewIds.value.filter(id => id !== reviewId)
    : [...selectedReviewIds.value, reviewId];
}

function toggleCandidate(candidate: DraftCandidate) {
  candidate.includeInParent = !candidate.includeInParent;
  if (candidate.includeInParent && candidate.weight === null) {
    candidate.weight = 0.1;
  }
  if (!candidate.includeInParent) candidate.weight = null;
}

function formatMapping(candidate: DraftCandidate): string {
  if (candidate.recommendation === 'subjective') return '工程师直评';
  if (!candidate.mapping) return '无映射';
  if (candidate.mapping.kind === 'anchors') {
    return `锚点映射 · ${candidate.mapping.anchors?.length ?? 0} 个锚点`;
  }
  if (candidate.mapping.kind === 'categorical') {
    return `类别映射 · ${candidate.mapping.values?.length ?? 0} 个值`;
  }
  return candidate.mapping.kind ?? '映射';
}

async function generateDraft() {
  if (!props.snapshot || !selectedReviews.value.length) return;
  generating.value = true;
  error.value = '';
  notice.value = '';
  try {
    const result = buildRuleDraft({
      baseRule: baseRule.value,
      reviews: selectedReviews.value,
      snapshot: props.snapshot
    });
    draftRule.value = result.rule;
    candidates.value = result.candidates;
    skipped.value = result.skipped;

    const base = runRegression(baseRule.value, props.snapshot);
    const draft = runRegression(result.rule, props.snapshot);
    baseRegression.value = base;
    draftRegression.value = draft;
    comparison.value = compareRegressions(base, draft);

    notice.value = `已生成规则草稿：新增 ${result.addedNodes} 节点 / ${result.addedMappings} 映射，跳过 ${result.skipped.length} 项`;
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '生成规则草稿失败');
  } finally {
    generating.value = false;
  }
}

async function createDraftVersion() {
  const token = session.value?.token;
  if (!token || !draftRule.value) return;
  creating.value = true;
  error.value = '';
  notice.value = '';
  try {
    const rule = updateDraftCandidates(draftRule.value, candidates.value);
    await createRuleVersion(token, {
      version: draftVersion.value.trim(),
      displayName: `AI 规则草稿 ${draftVersion.value.trim()}`,
      description: `由差异审阅建议生成的规则草稿；包含 ${includedCandidates.value.length} 个启用候选节点。`,
      rule: rule as unknown as Record<string, unknown>,
      metadata: {
        source: 'ai-rule-draft',
        targetSnapshotId: props.report?.targetSnapshotId ?? null,
        targetSnapshotLabel: props.report?.report.summary.targetVersionLabel ?? null,
        candidateCount: candidates.value.length,
        includedCandidateCount: includedCandidates.value.length,
        baseVersionId: props.activeVersion?.id ?? null,
        regressionSummary: comparison.value?.summary ?? null
      },
      sourceSnapshotId: props.report?.targetSnapshotId ?? null,
      basedOnVersionId: props.activeVersion?.id ?? null
    });
    notice.value = '规则草稿已保存为 Draft 版本，可在「数据与规则版本」页激活';
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '保存规则草稿失败');
  } finally {
    creating.value = false;
  }
}

watch(
  () => props.activeVersion?.id,
  () => {
    void loadBaseRule();
  },
  { immediate: true }
);

watch(
  () => props.reviews.length,
  () => {
    if (!selectedReviewIds.value.length) {
      selectedReviewIds.value = props.reviews
        .filter(review => review.status === 'approved' && review.objectType === 'column')
        .map(review => review.id);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!selectedReviewIds.value.length) {
    selectedReviewIds.value = props.reviews
      .filter(review => review.status === 'approved' && review.objectType === 'column')
      .map(review => review.id);
  }
  void loadBaseRule();
});
</script>

<template>
  <section class="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 :class="['text-xl', sectionTitleClass]">AI 建议 → 规则草稿与基线回归</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          选择已保存建议，生成候选节点/映射，并用 107 款官方基线对比草稿效果
        </p>
      </div>
      <button :class="primaryButtonClass" :disabled="generating || !canGenerate" @click="generateDraft">
        {{ generating ? '生成中…' : '生成规则草稿' }}
      </button>
    </div>

    <p v-if="notice" class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

    <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section class="rounded-xl border border-gray-200 p-5">
        <h4 class="text-base font-semibold text-gray-900">选择已保存建议</h4>
        <div class="mt-4 max-h-[420px] overflow-auto rounded-lg border border-gray-200">
          <div v-if="!selectableReviews.length" class="p-4 text-sm text-gray-500">
            暂无可转换为规则节点的建议
          </div>
          <label
            v-for="review in selectableReviews"
            :key="review.id"
            class="flex cursor-pointer items-start gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              class="mt-1 h-4 w-4"
              :checked="selectedReviewIds.includes(review.id)"
              @change="toggleReview(review.id)"
            />
            <span>
              <span class="block text-sm font-medium text-gray-900">{{ review.title }}</span>
              <span :class="['mt-1 block text-xs', mutedTextClass]">{{ review.itemId }}</span>
            </span>
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h4 class="text-base font-semibold text-gray-900">规则版本</h4>
          <input
            v-model="draftVersion"
            type="text"
            :class="inputClass"
            placeholder="规则版本号"
          />
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <article class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-500">候选节点</p>
            <strong class="mt-1 block text-2xl text-blue-700">{{ candidates.length }}</strong>
          </article>
          <article class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-500">启用候选</p>
            <strong class="mt-1 block text-2xl text-emerald-700">{{ includedCandidates.length }}</strong>
          </article>
          <article class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs text-gray-500">跳过</p>
            <strong class="mt-1 block text-2xl text-amber-700">{{ skipped.length }}</strong>
          </article>
        </div>

        <div class="mt-5 max-h-[520px] overflow-auto rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="sticky top-0 bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">启用</th>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">测试项</th>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">建议 / 映射</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-900">权重</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="candidate in candidateTable" :key="candidate.reviewId" class="hover:bg-gray-50">
                <td class="px-3 py-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4"
                    :checked="candidate.includeInParent"
                    @change="toggleCandidate(candidate)"
                  />
                </td>
                <td class="px-3 py-3">
                  <p class="font-medium text-gray-900">{{ candidate.title }}</p>
                  <p :class="['mt-1 text-xs', mutedTextClass]">{{ candidate.itemId }}</p>
                </td>
                <td class="px-3 py-3">
                  <span class="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {{ formatMapping(candidate) }}
                  </span>
                  <p :class="['mt-2 text-xs', mutedTextClass]">父项：{{ candidate.suggestedParent }}</p>
                </td>
                <td class="px-3 py-3 text-right">
                  <input
                    v-if="candidate.includeInParent"
                    v-model.number="candidate.weight"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    class="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                  />
                  <span v-else :class="['text-xs', mutedTextClass]">不计入</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section v-if="regressionSummary" class="mt-6 rounded-xl border border-gray-200 p-5">
      <h4 class="text-base font-semibold text-gray-900">基线回归对比</h4>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">评测机型</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ regressionSummary.evaluatedCount }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">MAE</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ regressionSummary.mae.toFixed(3) }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">RMSE</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ regressionSummary.rmse.toFixed(3) }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">最大误差</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ regressionSummary.maxAbsError.toFixed(3) }}</strong>
        </article>
        <article class="rounded-xl bg-emerald-50 p-4">
          <p class="text-xs text-emerald-700">误差 ≤0.1</p>
          <strong class="mt-1 block text-2xl text-emerald-700">{{ regressionSummary.within01 }}</strong>
        </article>
        <article class="rounded-xl bg-emerald-50 p-4">
          <p class="text-xs text-emerald-700">误差 ≤0.2</p>
          <strong class="mt-1 block text-2xl text-emerald-700">{{ regressionSummary.within02 }}</strong>
        </article>
      </div>

      <div class="mt-5 max-h-[420px] overflow-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">机型</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">官方总分</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">基线草稿</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">AI 草稿</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">草稿误差</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in comparison?.rows ?? []" :key="row.product" class="hover:bg-gray-50">
              <td class="px-3 py-3 text-gray-900">{{ row.product }}</td>
              <td class="px-3 py-3 text-right text-gray-700">{{ row.official?.toFixed(1) ?? '—' }}</td>
              <td class="px-3 py-3 text-right text-gray-700">{{ row.base?.toFixed(1) ?? '—' }}</td>
              <td class="px-3 py-3 text-right font-medium text-blue-700">{{ row.draft?.toFixed(1) ?? '—' }}</td>
              <td
                :class="[
                  'px-3 py-3 text-right',
                  (row.draftDiff ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                ]"
              >
                {{ row.draftDiff === null ? '—' : row.draftDiff.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="mt-6 flex justify-end">
      <button
        :class="primaryButtonClass"
        :disabled="creating || !draftRule || !draftVersion.trim()"
        @click="createDraftVersion"
      >
        {{ creating ? '保存中…' : '保存为规则 Draft 版本' }}
      </button>
    </div>
  </section>
</template>
