import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import type { EvaluationDraft, EvaluationDraftValue } from '../types/evaluation';
import { normalizeBacklightType, normalizeScreenType } from '../utils/productMetadata';
import { migrateDraft } from '../utils/draftMigration';

export const publicConfig = {
  endpoint: 'https://rtings-score-workbench.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_rA0i84BMgp4SbpWeJ6Capl_2v3398kTvA7fu4hLcSmDnAXc5C3fC9d8'
} as const;

export interface EvaluationMetadata {
  size: number | null;
  screenType: 'oled' | 'lcd' | 'unknown';
  backlightType: 'emissive' | 'mini-led' | 'led' | 'unknown';
}

const METADATA_KEY = '__meta__';

export interface CloudEvaluation {
  id: number;
  client_id: string;
  brand: string;
  model: string;
  test_date: string;
  engineer: string;
  remark: string;
  rule_version: string;
  status: string;
  inputs: Record<string, EvaluationDraftValue>;
  expected_total: number | null;
  created_at: string;
  updated_at: string;
}

export interface CloudEvaluationInsert {
  client_id: string;
  brand?: string;
  model?: string;
  test_date?: string;
  engineer?: string;
  remark?: string;
  rule_version: string;
  status?: string;
  inputs: Record<string, EvaluationDraftValue>;
  expected_total?: number | null;
}

type AppDatabase = {
  public: {
    Tables: {
      evaluations: {
        Row: CloudEvaluation;
        Insert: CloudEvaluationInsert;
        Update: Partial<CloudEvaluationInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const cloud = createWorkBuddyCloud<AppDatabase>({
  endpoint: publicConfig.endpoint,
  oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
  publishableKey: publicConfig.publishableKey
});

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null || result.data === undefined) {
    throw new Error('云数据库返回空结果');
  }
  return result.data;
}

function toRecord(draft: EvaluationDraft, expectedTotal: number | null): CloudEvaluationInsert {
  const metadata: EvaluationMetadata = {
    size: draft.size ?? null,
    screenType: draft.screenType,
    backlightType: draft.backlightType
  };
  return {
    client_id: draft.id,
    brand: draft.brand,
    model: draft.model,
    test_date: draft.testDate,
    engineer: draft.engineer,
    remark: draft.remark,
    rule_version: draft.ruleVersion,
    status: 'draft',
    inputs: {
      ...draft.values,
      [METADATA_KEY]: metadata
    } as Record<string, EvaluationDraftValue>,
    expected_total: expectedTotal
  };
}

export async function saveEvaluationToCloud(
  draft: EvaluationDraft,
  expectedTotal: number | null
): Promise<CloudEvaluation> {
  const rows = await unwrap(
    await cloud.database
      .from('evaluations')
      .upsert(toRecord(draft, expectedTotal), { onConflict: 'client_id' })
      .select()
  );
  return rows[0] as CloudEvaluation;
}

export async function listCloudEvaluations(limit = 100): Promise<CloudEvaluation[]> {
  const rows = await unwrap(
    await cloud.database
      .from('evaluations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)
  );
  return rows as CloudEvaluation[];
}

export async function getCloudEvaluation(clientId: string): Promise<CloudEvaluation | null> {
  const rows = await unwrap(
    await cloud.database
      .from('evaluations')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()
  );
  return rows as CloudEvaluation | null;
}

export function cloudEvaluationToDraft(record: CloudEvaluation): EvaluationDraft {
  const inputs = { ...(record.inputs ?? {}) } as Record<string, EvaluationDraftValue & Partial<EvaluationMetadata>>;
  const metadata = inputs[METADATA_KEY] as Partial<EvaluationMetadata> | undefined;
  delete inputs[METADATA_KEY];
  return migrateDraft({
    id: record.client_id,
    brand: record.brand ?? '',
    model: record.model ?? '',
    testDate: record.test_date ?? '',
    engineer: record.engineer ?? '',
    size: typeof metadata?.size === 'number' ? metadata.size : null,
    screenType: normalizeScreenType(metadata?.screenType),
    backlightType: normalizeBacklightType(metadata?.backlightType),
    remark: record.remark ?? '',
    ruleVersion: record.rule_version,
    values: inputs,
    updatedAt: record.updated_at
  });
}

export function cloudErrorMessage(error: unknown): string {
  if (!error) return '未知错误';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '云数据库操作失败';
}
