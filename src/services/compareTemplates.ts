export interface CompareGroupTemplate {
  id: string;
  name: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompareGroupTemplateInput {
  id?: string;
  name: string;
  productIds: string[];
}

const STORAGE_KEY = 'rtings-calculate:compare-group-templates:v1';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}`;
}

function safeRead(): CompareGroupTemplate[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as CompareGroupTemplate[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(templates: CompareGroupTemplate[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function listCompareGroupTemplates(): CompareGroupTemplate[] {
  return safeRead().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function upsertCompareGroupTemplate(input: CompareGroupTemplateInput): CompareGroupTemplate {
  const now = new Date().toISOString();
  const templates = safeRead();
  const existingId = input.id && templates.some(template => template.id === input.id)
    ? input.id
    : createId();
  const existing = templates.find(template => template.id === existingId);
  const record: CompareGroupTemplate = {
    ...input,
    productIds: [...new Set(input.productIds)],
    id: existingId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  safeWrite([record, ...templates.filter(template => template.id !== existingId)]);
  return record;
}

export function deleteCompareGroupTemplate(id: string) {
  safeWrite(safeRead().filter(template => template.id !== id));
}
