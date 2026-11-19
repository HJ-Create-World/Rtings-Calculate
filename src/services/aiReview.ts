import { cloud } from './cloud';
import type { DataDiffReport, DataSnapshotFull } from './ruleAdministration';
import { useRuleRuntime } from '../composables/useRuleRuntime';

export interface LlmModelOption {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
  enabled?: boolean;
  maxInputTokens?: number;
  credits?: string;
}

export type AiRecommendation =
  | 'objective_mapping'
  | 'subjective'
  | 'display_only'
  | 'exclude'
  | 'needs_raw_data';

export interface AiSuggestionDraft {
  objectType: 'column' | 'product';
  itemId: string;
  title: string;
  recommendation: AiRecommendation | 'candidate_product';
  confidence: number;
  rationale: string;
  sourceType: 'llm';
  model: string;
  evidence: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export interface ColumnReviewContext {
  label: string;
  stats: {
    rowCount: number;
    nonEmptyCount: number;
    numericCount: number;
    uniqueCount: number;
    min?: number;
    max?: number;
    scoreCount: number;
    scoreMin?: number;
    scoreMax?: number;
    scoreMean?: number;
  };
  samples: Array<{ product: string; raw: string | null; score: number | null }>;
}

const PRODUCT_KEY = 'Product (general:product)';

export async function listLlmModels(): Promise<LlmModelOption[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const models = await cloud.llm.models.list();
      return models
        .filter(model => model.disabled !== true && model.enabled !== false)
        .map(model => ({
          id: model.id,
          name: model.name ?? model.id,
          description: model.descriptionZh ?? model.descriptionEn,
          disabled: model.disabled === true,
          enabled: model.enabled,
          maxInputTokens: model.maxInputTokens,
          credits: model.credits
        }));
    } catch (error) {
      lastError = error;
      const code = (error as { error?: { code?: string | null } })?.error?.code;
      const message = String(
        (error as { error?: { message?: string } })?.error?.message
        ?? (error as Error)?.message
        ?? ''
      );
      if (code === 'capability_disabled' || !/502|503|504|gateway|network/i.test(`${code} ${message}`)) {
        throw error;
      }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/i);
  const content = (fenced?.[1] ?? trimmed).trim();
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('AI 未返回可解析的 JSON');
  }
  try {
    return JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error('AI 返回的 JSON 格式无效');
  }
}

function collectCompletion(
  chunks: AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>
): Promise<string> {
  return (async () => {
    let answer = '';
    for await (const chunk of chunks) {
      answer += chunk.choices?.[0]?.delta?.content ?? '';
    }
    return answer;
  })();
}

function parseSuggestions(
  answer: string,
  expectedIds: string[],
  objectType: 'column' | 'product',
  modelId: string
): AiSuggestionDraft[] {
  const parsed = extractJson(answer);
  const candidates = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
    : Array.isArray(parsed)
      ? parsed
      : [];
  const expected = new Set(expectedIds);
  const validRecommendations = new Set([
    'objective_mapping',
    'subjective',
    'display_only',
    'exclude',
    'needs_raw_data',
    'candidate_product'
  ]);

  return candidates
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map(item => {
      const itemId = String(item.itemId ?? item.itemId ?? item.item_id ?? '');
      const recommendation = String(item.recommendation ?? '');
      const confidence = Number(item.confidence ?? 0);
      return {
        objectType,
        itemId,
        title: String(item.title ?? itemId),
        recommendation: recommendation as AiSuggestionDraft['recommendation'],
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
        rationale: String(item.rationale ?? ''),
        sourceType: 'llm' as const,
        model: modelId,
        evidence: typeof item.evidence === 'object' && item.evidence !== null
          ? item.evidence as Record<string, unknown>
          : {},
        payload: typeof item.payload === 'object' && item.payload !== null
          ? item.payload as Record<string, unknown>
          : {}
      };
    })
    .filter(item => expected.has(item.itemId) && validRecommendations.has(item.recommendation));
}

function existingLeafLabels(): string[] {
  const { currentRule } = useRuleRuntime();
  return currentRule.value.nodes
    .filter(node => node.kind === 'leaf')
    .map(node => node.label);
}

function scoreColumnFor(column: string): string {
  return `${column} score`;
}

function numericOrNull(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/,/g, '');
  if (!text || text.toLowerCase() === 'null') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildColumnReviewContexts(
  snapshot: DataSnapshotFull,
  columns: string[]
): ColumnReviewContext[] {
  const rows = snapshot.snapshot.rows;
  return columns.map(column => {
    const scoreColumn = scoreColumnFor(column);
    const rawValues = rows.map(row => row[column]?.trim() ?? '');
    const scoreValues = rows.map(row => numericOrNull(row[scoreColumn]));
    const numericValues = rawValues
      .map(value => numericOrNull(value))
      .filter((value): value is number => value !== null);
    const validScores = scoreValues.filter((value): value is number => value !== null);
    const samples = rows
      .slice(0, 8)
      .map(row => ({
        product: row[PRODUCT_KEY] ?? '',
        raw: row[column] ?? null,
        score: numericOrNull(row[scoreColumn])
      }));

    return {
      label: column,
      stats: {
        rowCount: rows.length,
        nonEmptyCount: rawValues.filter(Boolean).length,
        numericCount: numericValues.length,
        uniqueCount: new Set(rawValues.filter(Boolean)).size,
        min: numericValues.length ? Math.min(...numericValues) : undefined,
        max: numericValues.length ? Math.max(...numericValues) : undefined,
        scoreCount: validScores.length,
        scoreMin: validScores.length ? Math.min(...validScores) : undefined,
        scoreMax: validScores.length ? Math.max(...validScores) : undefined,
        scoreMean: validScores.length
          ? validScores.reduce((sum, value) => sum + value, 0) / validScores.length
          : undefined
      },
      samples
    };
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function generateBatch(
  systemPrompt: string,
  userPrompt: string,
  modelId: string,
  expectedIds: string[],
  objectType: 'column' | 'product',
  signal?: AbortSignal
): Promise<AiSuggestionDraft[]> {
  const answer = await collectCompletion(
    cloud.llm.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      signal
    })
  );
  return parseSuggestions(answer, expectedIds, objectType, modelId);
}

export async function generateColumnSuggestions(input: {
  modelId: string;
  report: DataDiffReport;
  snapshot: DataSnapshotFull;
  columns: string[];
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number) => void;
}): Promise<AiSuggestionDraft[]> {
  const contexts = buildColumnReviewContexts(input.snapshot, input.columns);
  const batches = chunk(contexts, 5);
  const results: AiSuggestionDraft[] = [];
  const existingLabels = existingLeafLabels();

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const systemPrompt = [
      '你是电视显示测评评分规则审阅助手。',
      '你只能基于提供的官方 Rtings 数据统计给出规则处理建议，不能直接修改评分规则。',
      '必须返回 JSON 对象，不要返回 Markdown 或额外说明。',
      'recommendation 只能是：objective_mapping、subjective、display_only、exclude、needs_raw_data。',
      'objective_mapping 表示有稳定实测值和官方得分关系，可做候选客观映射；',
      'subjective 表示需要工程师主观评分；display_only 表示只展示不评分；exclude 表示不纳入；',
      'needs_raw_data 表示当前缺少原始值或得分，需先补数据。'
    ].join(' ');

    const userPrompt = JSON.stringify({
      task: 'classify-added-columns',
      baseVersion: input.report.report.summary.baseVersionLabel,
      targetVersion: input.report.report.summary.targetVersionLabel,
      currentRuleLeafLabels: existingLabels,
      requestedColumns: batch.map(context => ({
        label: context.label,
        guessedScoreColumn: scoreColumnFor(context.label),
        stats: context.stats,
        samples: context.samples
      })),
      expectedJson: {
        suggestions: [
          {
            itemId: '原样返回列名',
            title: '中文标题',
            recommendation: 'objective_mapping | subjective | display_only | exclude | needs_raw_data',
            confidence: '0~1',
            rationale: '不超过 100 字的中文理由',
            evidence: { key: 'value' },
            payload: { suggestedParent: '建议父维度或空' }
          }
        ]
      }
    });

    results.push(
      ...(await generateBatch(
        systemPrompt,
        userPrompt,
        input.modelId,
        batch.map(context => context.label),
        'column',
        input.signal
      ))
    );
    input.onProgress?.(index + 1, batches.length);
  }

  return results;
}

export async function generateProductSuggestions(input: {
  modelId: string;
  report: DataDiffReport;
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number) => void;
}): Promise<AiSuggestionDraft[]> {
  const products = input.report.report.addedProducts ?? [];
  if (!products.length) return [];
  const batches = chunk(products, 5);
  const results: AiSuggestionDraft[] = [];
  const { currentRule } = useRuleRuntime();
  const existingProducts = currentRule.value.nodes.filter(node => node.kind === 'leaf').length;

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const systemPrompt = [
      '你是电视产品数据审阅助手。',
      '基于 Rtings 差异数据判断新增机型是否可作为候选产品导入。',
      '必须返回 JSON 对象；recommendation 只能是 candidate_product、display_only 或 needs_raw_data。'
    ].join(' ');

    const userPrompt = JSON.stringify({
      task: 'review-added-products',
      existingLeafNodeCount: existingProducts,
      targetVersion: input.report.report.summary.targetVersionLabel,
      addedProducts: batch.map(item => ({
        productId: item.product,
        value: item.value
      })),
      expectedJson: {
        suggestions: [
          {
            itemId: '原样返回机型名',
            title: '中文标题',
            recommendation: 'candidate_product | display_only | needs_raw_data',
            confidence: '0~1',
            rationale: '不超过 80 字的中文理由',
            evidence: { key: 'value' },
            payload: { suggestedScreenType: 'oled|lcd|unknown', suggestedBacklightType: 'string' }
          }
        ]
      }
    });

    results.push(
      ...(await generateBatch(
        systemPrompt,
        userPrompt,
        input.modelId,
        batch.map(item => item.product),
        'product',
        input.signal
      ))
    );
    input.onProgress?.(index + 1, batches.length);
  }

  return results;
}

export function aiErrorMessage(error: unknown): string {
  const code = (error as { error?: { code?: string } })?.error?.code;
  const message = (error as { error?: { message?: string } })?.error?.message;

  if (code === 'capability_disabled') {
    return '本应用尚未开通大模型调用能力（服务端返回 capability_disabled）。这不是网络或模型选择问题，刷新、换模型、重试都不会生效。请在 WorkBuddy 对话中打开本应用，说明“接入大模型 / AI 能力”，让平台重新为本应用配置；若已接入仍报错，请联系 WorkBuddy 支持核查账号的模型调用权限。';
  }
  if (/(^|\b)(502|503|504)(\b|$)/i.test(`${code ?? ''}`) || /bad gateway|service unavailable|gateway timeout|HTTP 502|HTTP 503|HTTP 504/i.test(`${message ?? ''}`)) {
    return 'AI 服务网关暂时不稳定（502/503/504），已自动重试仍失败。请稍后点击「刷新模型」；这不是美网或本地网络的必然问题。';
  }
  if (typeof code === 'string' && code.startsWith('quota_')) {
    return message || 'AI 配额不足或触发限流';
  }
  if (typeof code === 'string' && code.startsWith('request_')) {
    return message || 'AI 请求参数无效';
  }
  if (typeof code === 'string' && code.startsWith('gateway_')) {
    return message || 'AI 服务暂时不可用，请重试';
  }
  if (typeof code === 'string' && code.startsWith('model_')) {
    return message || '所选模型暂不可用';
  }
  if (message) return message;
  if (error instanceof Error && error.message) return error.message;
  return 'AI 分析失败';
}
