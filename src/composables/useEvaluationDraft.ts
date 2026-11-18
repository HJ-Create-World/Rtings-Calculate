import { computed, ref, watch } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationInputs } from '../core/types';
import type { EvaluationDraft, EvaluationDraftValue } from '../types/evaluation';
import type { ScoringRule } from '../core/types';
import { normalizeBacklightType, normalizeScreenType } from '../utils/productMetadata';
import { migrateDraftValues } from '../utils/draftMigration';
import { useRuleRuntime } from './useRuleRuntime';

const STORAGE_KEY = 'rtings-calculate:evaluation-draft:v3';
const { currentRule } = useRuleRuntime();

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}`;
}

function emptyDraft(): EvaluationDraft {
  return {
    id: createId(),
    brand: '',
    model: '',
    testDate: '',
    engineer: '',
    size: null,
    screenType: 'unknown',
    backlightType: 'unknown',
    remark: '',
    ruleVersion: currentRule.value.version,
    values: {},
    updatedAt: new Date().toISOString()
  };
}

export function parseObjectiveNumber(raw: string | undefined | null): number | null {
  let text = (raw ?? '').trim().toLowerCase().replace(/,/g, '');
  if (!text) return null;
  if (text === 'inf' || text === 'infinity' || text === '∞') {
    return Number.POSITIVE_INFINITY;
  }

  // 允许工程师按习惯带常见单位；评分规则仍使用纯数值。
  text = text
    .replace(/\s*(?::1|n:1)\s*$/, '')
    .replace(/\s*(cd\/m²|cd\/m2|nit|nits|ms|hz|k|Δe|de|px\/s|counts\/s|lx)\s*$/, '')
    .replace(/\s*%\s*$/, '')
    .trim();

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function parseSubjectiveScore(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  // UI 输入 0~10，draft 内部统一保存 0~100 的十分位整数。
  if (raw < 0 || raw > 100) return null;
  return Math.round(raw);
}

export function buildDraftInputs(
  draft: EvaluationDraft,
  rule: ScoringRule = currentRule.value
): EvaluationInputs {
  const inputs: EvaluationInputs = {};
  const nodeById = new Map(rule.nodes.map(node => [node.id, node]));

  for (const [nodeId, value] of Object.entries(draft.values)) {
    const node = nodeById.get(nodeId);
    if (!node || !node.includeInParent) continue;

    if (node.inputType === 'objective') {
      const parsed = parseObjectiveNumber(value.objectiveRaw);
      const rawText = value.objectiveRaw?.trim();
      if (parsed !== null) {
        inputs[nodeId] = { objective: { value: parsed } };
      } else if (rawText) {
        inputs[nodeId] = { objective: { value: null, text: rawText } };
      }
      continue;
    }

    if (node.inputType === 'subjective') {
      const scoreTenths = parseSubjectiveScore(value.subjectiveScore);
      if (scoreTenths !== null) {
        inputs[nodeId] = { subjective: { scoreTenths } };
      }
    }
  }

  return inputs;
}

function loadDraft(): EvaluationDraft {
  if (typeof localStorage === 'undefined') return emptyDraft();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as EvaluationDraft;
    if (parsed.ruleVersion !== currentRule.value.version) return emptyDraft();
    return {
      ...emptyDraft(),
      ...parsed,
      size: typeof parsed.size === 'number' ? parsed.size : null,
      screenType: normalizeScreenType(parsed.screenType),
      backlightType: normalizeBacklightType(parsed.backlightType),
      values: migrateDraftValues(parsed.values ?? {}, currentRule.value)
    };
  } catch {
    return emptyDraft();
  }
}

const draft = ref<EvaluationDraft>(loadDraft());

watch(
  draft,
  value => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...value, updatedAt: new Date().toISOString() })
    );
  },
  { deep: true }
);

watch(
  () => currentRule.value.version,
  version => {
    if (draft.value.ruleVersion !== version) {
      draft.value = {
        ...draft.value,
        ruleVersion: version,
        values: migrateDraftValues(draft.value.values ?? {}, currentRule.value)
      };
    }
  }
);

export function useEvaluationDraft() {

  const inputs = computed<EvaluationInputs>(() => buildDraftInputs(draft.value));
  const result = computed(() => evaluateRule(currentRule.value, inputs.value));
  const includedLeafNodeIds = computed(() => new Set(
    currentRule.value.nodes
      .filter(node => node.inputType !== 'aggregate' && node.includeInParent)
      .map(node => node.id)
  ));
  const filledCount = computed(() =>
    Object.entries(draft.value.values).filter(([nodeId, value]) => {
      if (!includedLeafNodeIds.value.has(nodeId)) return false;
      return Boolean(value.objectiveRaw?.trim()) || value.subjectiveScore !== null && value.subjectiveScore !== undefined;
    }).length
  );

  function updateMeta(patch: Partial<Omit<EvaluationDraft, 'id' | 'values' | 'ruleVersion' | 'updatedAt'>>) {
    draft.value = { ...draft.value, ...patch };
  }

  function updateValue(nodeId: string, patch: Partial<EvaluationDraftValue>) {
    const current = draft.value.values[nodeId] ?? {};
    draft.value = {
      ...draft.value,
      values: {
        ...draft.value.values,
        [nodeId]: { ...current, ...patch }
      }
    };
  }

  function replaceDraft(next: EvaluationDraft) {
    draft.value = { ...next, updatedAt: new Date().toISOString() };
  }

  function resetDraft() {
    draft.value = emptyDraft();
  }

  return {
    draft,
    inputs,
    result,
    filledCount,
    updateMeta,
    updateValue,
    replaceDraft,
    resetDraft
  };
}

export type EvaluationDraftContext = ReturnType<typeof useEvaluationDraft>;
