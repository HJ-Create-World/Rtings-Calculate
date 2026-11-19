import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import type { EvaluationDraft, EvaluationDraftValue } from '../types/evaluation';
import type { ScoringRule } from '../core/types';
import {
  normalizeBacklightType,
  normalizeScreenType,
  type BacklightType,
  type ScreenType
} from '../utils/productMetadata';
import { migrateDraft } from '../utils/draftMigration';

export const publicConfig = {
  endpoint: 'https://rtings-score-workbench.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_rA0i84BMgp4SbpWeJ6Capl_2v3398kTvA7fu4hLcSmDnAXc5C3fC9d8'
} as const;

export interface EvaluationMetadata {
  size: number | null;
  screenType: ScreenType;
  backlightType: BacklightType;
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

interface CloudRpcError {
  code?: string | number | null;
  message?: string;
  status?: number;
  error?: {
    code?: string | number | null;
    message?: string;
    status?: number;
  };
}

function isTransientCloudError(error: unknown): boolean {
  const raw = error as CloudRpcError | null;
  const code = `${raw?.code ?? raw?.error?.code ?? ''}`;
  const message = `${raw?.message ?? raw?.error?.message ?? ''}`;
  return /(^|\b)(502|503|504)(\b|$)/i.test(code)
    || /bad gateway|service unavailable|gateway timeout|gateway_network_error|fetch failed|network error/i.test(message);
}

export async function rpcWithRetry(
  functionName: string,
  params: Record<string, unknown>,
  retries = 2
): Promise<{ data: unknown; error: unknown }> {
  let lastResult: { data: unknown; error: unknown } | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await cloud.database.rpc(functionName, params as Record<string, unknown>) as { data: unknown; error: unknown };
    if (!result.error) return result;

    lastResult = result;
    const transient = isTransientCloudError(result.error);
    if (!transient || attempt === retries) break;
    await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
  }

  return lastResult ?? { data: null, error: new Error('云服务请求失败') };
}

export function cloudErrorMessage(error: unknown, fallback = '云服务请求失败'): string {
  if (!error) return fallback;
  const raw = error as CloudRpcError | Error;
  const code = 'error' in raw ? (raw as CloudRpcError).error?.code : (raw as CloudRpcError).code;
  const message = 'message' in raw
    ? (raw as { message?: string }).message
    : (raw as CloudRpcError).error?.message;
  const text = message ?? '';

  if (code === 'capability_disabled') {
    return '本应用尚未开通大模型调用能力（服务端返回 capability_disabled）。请回到 WorkBuddy 对话，对本应用说明“接入大模型 / AI 能力”让平台重新配置；若已接入仍报错，联系 WorkBuddy 支持核查账号的模型调用权限。';
  }
  if (/(^|\b)(502|503|504)(\b|$)/i.test(`${code}`) || /bad gateway|service unavailable|gateway timeout/i.test(text)) {
    return '云服务网关暂时不稳定（502/503/504），已自动重试仍失败。请稍后点击刷新，或换一个网络环境再试。';
  }
  if (/fetch failed|network error|Failed to fetch/i.test(text)) {
    return '云服务网络请求失败。请检查当前网络环境后点击刷新。';
  }
  if (typeof text === 'string' && text.trim()) return text;
  return fallback;
}

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
  expectedTotal: number | null,
  appToken: string
): Promise<CloudEvaluation> {
  const result = unwrap(
    await rpcWithRetry('app_upsert_evaluation', {
      p_token: appToken,
      p_evaluation: toRecord(draft, expectedTotal) as unknown as Record<string, unknown>
    })
  );
  return result as CloudEvaluation;
}

export async function listCloudEvaluations(
  limit = 100,
  appToken?: string
): Promise<CloudEvaluation[]> {
  if (!appToken) return [];
  const result = await unwrap(
    await rpcWithRetry('app_list_evaluations', {
      p_token: appToken,
      p_limit: limit
    })
  );
  return Array.isArray(result) ? (result as CloudEvaluation[]) : [];
}

export async function getCloudEvaluation(
  clientId: string,
  appToken?: string
): Promise<CloudEvaluation | null> {
  if (!appToken) return null;
  const result = await unwrap(
    await rpcWithRetry('app_get_evaluation', {
      p_token: appToken,
      p_client_id: clientId
    })
  );
  return result ? (result as CloudEvaluation) : null;
}

export function cloudEvaluationToDraft(record: CloudEvaluation, rule?: ScoringRule): EvaluationDraft {
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
  }, rule);
}
