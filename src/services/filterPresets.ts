import type { BacklightType, ScreenType } from '../utils/productMetadata';

export interface ProductFilterPreset {
  id: string;
  name: string;
  keyword: string;
  brand: string;
  year: string;
  size: string;
  screenType: ScreenType;
  backlightType: BacklightType;
  scoreMetric: string;
  scoreMin: string;
  scoreMax: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterPresetInput {
  id?: string;
  name: string;
  keyword: string;
  brand: string;
  year: string;
  size: string;
  screenType: ScreenType;
  backlightType: BacklightType;
  scoreMetric: string;
  scoreMin: string;
  scoreMax: string;
}

const STORAGE_KEY = 'rtings-calculate:filter-presets:v1';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}`;
}

function safeRead(): ProductFilterPreset[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as ProductFilterPreset[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(presets: ProductFilterPreset[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function listFilterPresets(): ProductFilterPreset[] {
  return safeRead().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function upsertFilterPreset(input: ProductFilterPresetInput): ProductFilterPreset {
  const now = new Date().toISOString();
  const presets = safeRead();
  const existingId = input.id && presets.some(preset => preset.id === input.id)
    ? input.id
    : createId();
  const existing = presets.find(preset => preset.id === existingId);
  const record: ProductFilterPreset = {
    ...input,
    id: existingId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  safeWrite([record, ...presets.filter(preset => preset.id !== existingId)]);
  return record;
}

export function deleteFilterPreset(id: string) {
  safeWrite(safeRead().filter(preset => preset.id !== id));
}
