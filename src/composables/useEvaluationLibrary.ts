import { computed, ref, watch } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { ScoringRule } from '../core/types';
import { buildDraftInputs } from './useEvaluationDraft';
import { useAuth } from './useAuth';
import {
  cloudEvaluationToDraft,
  cloudErrorMessage,
  listCloudEvaluations
} from '../services/cloud';
import type { CloudEvaluation } from '../services/cloud';
import { listLocalEvaluations } from '../services/localEvaluations';
import type { LocalEvaluation } from '../services/localEvaluations';
import type { ProductBaseline } from '../data/rtingsRule';
import { buildBaselineInputs, rtingsBaselinesV3 } from '../data/rtingsRule';
import { getRuleForVersion, useRuleRuntime } from './useRuleRuntime';
import type { EvaluationDraft } from '../types/evaluation';

const cloudRecords = ref<CloudEvaluation[]>([]);
const localRecords = ref<LocalEvaluation[]>([]);
const { currentRule } = useRuleRuntime();
const ruleVersionMap = ref(new Map<string, ScoringRule>());
const loadingRuleVersions = new Set<string>();
const libraryLoading = ref(false);
const libraryError = ref('');
const libraryLoaded = ref(false);

function productLabel(draft: EvaluationDraft): string {
  const label = `${draft.brand} ${draft.model}`.trim();
  return label || `未命名评测 ${draft.testDate || ''}`.trim();
}

function toProduct(
  record: CloudEvaluation | LocalEvaluation,
  source: 'cloud' | 'local'
): ProductBaseline | null {
  const rule = ruleVersionMap.value.get(('client_id' in record
    ? (record as CloudEvaluation).rule_version
    : (record as LocalEvaluation).draft.ruleVersion) ?? currentRule.value.version);
  if (!rule) return null;
  const draft = 'client_id' in record
    ? cloudEvaluationToDraft(record as CloudEvaluation, rule)
    : (record as LocalEvaluation).draft;

  const inputs = buildDraftInputs(draft, rule);
  const result = evaluateRule(rule, inputs);
  const expectedScores: Record<string, number> = {};
  for (const evaluation of Object.values(result.nodes)) {
    if (evaluation.status === 'scored' && evaluation.value !== null) {
      expectedScores[evaluation.nodeId] = evaluation.value;
    }
  }

  const recordAny = record as any;
  const year = draft.testDate?.slice(0, 4);
  return {
    id: source === 'cloud' ? recordAny.client_id : recordAny.draft.id,
    label: productLabel(draft),
    brand: draft.brand || '自建评测',
    model: draft.model || '未命名机型',
    releaseYear: year ? Number(year) : null,
    size: draft.size ?? null,
    sizes: draft.size !== null && draft.size !== undefined ? [draft.size] : [],
    screenType: draft.screenType,
    backlightType: draft.backlightType,
    methodology: source === 'cloud' ? '云端历史评测' : '本机历史评测',
    source,
    expectedTotal: result.value ?? recordAny.expected_total ?? null,
    expectedScores,
    inputs: inputs as ProductBaseline['inputs']
  };
}

async function loadMissingRuleVersions() {
  const records = [
    ...cloudRecords.value.map(record => record.rule_version),
    ...localRecords.value.map(record => record.draft.ruleVersion)
  ].filter(Boolean) as string[];
  const missing = [...new Set(records)].filter(version => !ruleVersionMap.value.has(version));

  await Promise.all(missing.map(async version => {
    if (loadingRuleVersions.has(version)) return;
    loadingRuleVersions.add(version);
    try {
      const rule = await getRuleForVersion(version);
      const next = new Map(ruleVersionMap.value);
      next.set(version, rule);
      ruleVersionMap.value = next;
    } catch {
      // 单个历史版本加载失败不阻断整个评测库；对应记录会暂时隐藏。
    } finally {
      loadingRuleVersions.delete(version);
    }
  }));
}

watch(
  [cloudRecords, localRecords],
  () => {
    void loadMissingRuleVersions();
  },
  { immediate: true }
);

const savedProducts = computed<ProductBaseline[]>(() => {
  const cloudItems = cloudRecords.value
    .map(record => toProduct(record, 'cloud'))
    .filter(Boolean) as ProductBaseline[];
  const cloudIds = new Set(cloudItems.map(item => item.id));
  const localItems = localRecords.value
    .filter(item => !cloudIds.has(item.draft.id))
    .map(record => toProduct(record, 'local'))
    .filter(Boolean) as ProductBaseline[];
  return [...cloudItems, ...localItems];
});

const officialProducts = computed<ProductBaseline[]>(() =>
  rtingsBaselinesV3.items.map(baseline => {
    const inputs = buildBaselineInputs(baseline, currentRule.value);
    const result = evaluateRule(currentRule.value, inputs);
    const expectedScores: Record<string, number> = {};
    for (const evaluation of Object.values(result.nodes)) {
      if (evaluation.status === 'scored' && evaluation.value !== null) {
        expectedScores[evaluation.nodeId] = evaluation.value;
      }
    }
    return {
      ...baseline,
      expectedTotal: result.value ?? baseline.expectedTotal,
      expectedScores,
      inputs: inputs as ProductBaseline['inputs']
    };
  })
);

const allEvaluationProducts = computed<ProductBaseline[]>(() => [
  ...savedProducts.value,
  ...officialProducts.value
]);

async function refreshEvaluationLibrary(force = false) {
  if (libraryLoaded.value && !force) return;
  const { session } = useAuth();
  const appToken = session.value?.token;
  libraryLoading.value = true;
  libraryError.value = '';
  try {
    const [cloud, local] = await Promise.all([
      listCloudEvaluations(200, appToken),
      Promise.resolve(listLocalEvaluations())
    ]);
    cloudRecords.value = cloud;
    localRecords.value = local;
    libraryLoaded.value = true;
  } catch (exception) {
    libraryError.value = cloudErrorMessage(exception);
  } finally {
    libraryLoading.value = false;
  }
}

function getEvaluationProductById(id: string): ProductBaseline | undefined {
  return allEvaluationProducts.value.find(product => product.id === id);
}

export function useEvaluationLibrary() {
  return {
    libraryLoading,
    libraryError,
    libraryLoaded,
    cloudRecords,
    localRecords,
    savedProducts,
    allBaselines: allEvaluationProducts,
    refreshEvaluationLibrary,
    getEvaluationProductById
  };
}
