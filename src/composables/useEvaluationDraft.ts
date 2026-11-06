import { computed, ref, watch } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationInputs } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';
import type { EvaluationDraft, EvaluationDraftValue } from '../types/evaluation';

const STORAGE_KEY = 'rtings-calculate:evaluation-draft:v3';

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
    remark: '',
    ruleVersion: rtingsRule.version,
    values: {},
    updatedAt: new Date().toISOString()
  };
}

export function parseObjectiveNumber(raw: string | undefined | null): number | null {
  const text = (raw ?? '').trim().toLowerCase().replace(/,/g, '');
  if (!text) return null;
  if (text === 'inf' || text === 'infinity' || text === '∞') {
    return Number.POSITIVE_INFINITY;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function parseSubjectiveScore(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  if (raw < 0 || raw > 10) return null;
  return Math.round(raw * 10);
}

export function buildDraftInputs(draft: EvaluationDraft): EvaluationInputs {
  const inputs: EvaluationInputs = {};
  const nodeById = new Map(rtingsRule.nodes.map(node => [node.id, node]));

  for (const [nodeId, value] of Object.entries(draft.values)) {
    const node = nodeById.get(nodeId);
    if (!node) continue;

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
    if (parsed.ruleVersion !== rtingsRule.version) return emptyDraft();
    return {
      ...emptyDraft(),
      ...parsed,
      values: parsed.values ?? {}
    };
  } catch {
    return emptyDraft();
  }
}

export function useEvaluationDraft() {
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

  const inputs = computed<EvaluationInputs>(() => buildDraftInputs(draft.value));
  const result = computed(() => evaluateRule(rtingsRule, inputs.value));
  const filledCount = computed(() =>
    Object.values(draft.value.values).filter(value => {
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
