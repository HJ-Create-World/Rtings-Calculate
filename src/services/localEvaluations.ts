import type { EvaluationDraft } from '../types/evaluation';

const STORAGE_KEY = 'rtings-calculate:local-evaluations:v3';

export interface LocalEvaluation {
  savedAt: string;
  expectedTotal: number | null;
  draft: EvaluationDraft;
}

function safeRead(): LocalEvaluation[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalEvaluation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(items: LocalEvaluation[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listLocalEvaluations(): LocalEvaluation[] {
  return safeRead().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function saveLocalEvaluation(draft: EvaluationDraft, expectedTotal: number | null): LocalEvaluation {
  const items = safeRead().filter(item => item.draft.id !== draft.id);
  const record: LocalEvaluation = {
    savedAt: new Date().toISOString(),
    expectedTotal,
    draft: JSON.parse(JSON.stringify(draft))
  };
  items.unshift(record);
  safeWrite(items.slice(0, 200));
  return record;
}

export function deleteLocalEvaluation(id: string) {
  safeWrite(safeRead().filter(item => item.draft.id !== id));
}

export function getLocalEvaluation(id: string): LocalEvaluation | undefined {
  return safeRead().find(item => item.draft.id === id);
}

export interface DraftMetaValidation {
  valid: boolean;
  errors: Partial<Record<'brand' | 'model' | 'testDate' | 'engineer', string>>;
}

export function validateDraftMeta(draft: EvaluationDraft): DraftMetaValidation {
  const errors: DraftMetaValidation['errors'] = {};
  if (!draft.brand.trim()) errors.brand = '品牌必填';
  if (!draft.model.trim()) errors.model = '型号必填';
  if (!draft.testDate.trim()) errors.testDate = '测试日期必填';
  if (!draft.engineer.trim()) errors.engineer = '测试工程师必填';
  return { valid: Object.keys(errors).length === 0, errors };
}
