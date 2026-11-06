import { computed, ref } from 'vue';
import { evaluateRule } from '../core/evaluate';
import { buildDraftInputs } from './useEvaluationDraft';
import {
  cloudEvaluationToDraft,
  cloudErrorMessage,
  listCloudEvaluations
} from '../services/cloud';
import type { CloudEvaluation } from '../services/cloud';
import { listLocalEvaluations } from '../services/localEvaluations';
import type { LocalEvaluation } from '../services/localEvaluations';
import type { ProductBaseline } from '../data/rtingsRule';
import { rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';
import type { EvaluationDraft } from '../types/evaluation';

const cloudRecords = ref<CloudEvaluation[]>([]);
const localRecords = ref<LocalEvaluation[]>([]);
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
  const draft = 'client_id' in record
    ? cloudEvaluationToDraft(record as CloudEvaluation)
    : (record as LocalEvaluation).draft;
  if (draft.ruleVersion !== rtingsRule.version) return null;

  const inputs = buildDraftInputs(draft);
  const result = evaluateRule(rtingsRule, inputs);
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
    size: '',
    methodology: source === 'cloud' ? '云端历史评测' : '本机历史评测',
    source,
    expectedTotal: result.value ?? recordAny.expected_total ?? null,
    expectedScores,
    inputs: inputs as ProductBaseline['inputs']
  };
}

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

const allEvaluationProducts = computed<ProductBaseline[]>(() => [
  ...savedProducts.value,
  ...rtingsBaselinesV3.items
]);

async function refreshEvaluationLibrary(force = false) {
  if (libraryLoaded.value && !force) return;
  libraryLoading.value = true;
  libraryError.value = '';
  try {
    const [cloud, local] = await Promise.all([
      listCloudEvaluations(200),
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
