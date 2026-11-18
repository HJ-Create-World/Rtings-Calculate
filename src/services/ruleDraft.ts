import { evaluateRule } from '../core/evaluate';
import type {
  Direction,
  EvaluationInputs,
  ObjectiveMapping,
  ScoreNode,
  ScoringRule
} from '../core/types';
import type { DataSnapshotFull, RuleReview } from './ruleAdministration';

export const PRODUCT_KEY = 'Product (general:product)';
export const OFFICIAL_TOTAL_COLUMN = 'Mixed Usage (usage:1)';

export interface DraftCandidate {
  reviewId: string;
  objectType: 'column' | 'product';
  itemId: string;
  title: string;
  recommendation: string;
  suggestedParent: string;
  includeInParent: boolean;
  weight: number | null;
  node: ScoreNode | null;
  mapping: ObjectiveMapping | null;
  sourceColumn?: string;
  officialScoreColumn?: string;
}

export interface RuleDraftResult {
  rule: ScoringRule;
  candidates: DraftCandidate[];
  skipped: Array<{ itemId: string; reason: string }>;
  addedNodes: number;
  addedMappings: number;
}

export interface RegressionProductRow {
  product: string;
  official: number | null;
  base: number | null;
  draft: number | null;
  baseDiff: number | null;
  draftDiff: number | null;
}

export interface RegressionSummary {
  productCount: number;
  evaluatedCount: number;
  officialMean: number;
  mae: number;
  rmse: number;
  maxAbsError: number;
  within01: number;
  within02: number;
  improved: number;
  regressed: number;
  unchanged: number;
}

export interface RegressionReport {
  summary: RegressionSummary;
  rows: RegressionProductRow[];
  warnings: string[];
}

function baseLabel(column: string): string {
  return column.replace(/\s*\((?:test|usage|general):[^)]+\)\s*$/, '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'candidate';
}

function normalizeCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function numericOrNull(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/,/g, '');
  if (!text || text.toLowerCase() === 'null') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function officialScoreColumn(column: string): string {
  return `${column} score`;
}

function pearsonCorrelation(pairs: Array<{ x: number; y: number }>): number {
  if (pairs.length < 3) return 0;
  const meanX = pairs.reduce((sum, item) => sum + item.x, 0) / pairs.length;
  const meanY = pairs.reduce((sum, item) => sum + item.y, 0) / pairs.length;
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;
  for (const item of pairs) {
    numerator += (item.x - meanX) * (item.y - meanY);
    sumXSquared += (item.x - meanX) ** 2;
    sumYSquared += (item.y - meanY) ** 2;
  }
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  return denominator > 0 ? numerator / denominator : 0;
}

function buildAnchorMapping(
  label: string,
  sourceColumn: string,
  rows: Array<Record<string, string>>,
  evidence: Record<string, unknown>
): ObjectiveMapping | null {
  const scoreColumn = officialScoreColumn(sourceColumn);
  const pairs = rows
    .map(row => ({
      x: numericOrNull(row[sourceColumn]),
      y: numericOrNull(row[scoreColumn])
    }))
    .filter((item): item is { x: number; y: number } => item.x !== null && item.y !== null);

  if (pairs.length < 5) return null;
  const correlation = pearsonCorrelation(pairs);
  const direction: Direction = correlation < 0 ? 'lowerBetter' : 'higherBetter';

  const grouped = new Map<number, number[]>();
  for (const item of pairs) {
    const values = grouped.get(item.x) ?? [];
    values.push(item.y);
    grouped.set(item.x, values);
  }
  const unique = [...grouped.entries()]
    .map(([value, scores]) => ({
      value,
      score: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    }))
    .sort((left, right) => left.value - right.value);

  const maxAnchors = 30;
  const selected = unique.length <= maxAnchors
    ? unique
    : Array.from({ length: maxAnchors }, (_, index) => {
        const position = index * (unique.length - 1) / (maxAnchors - 1);
        return unique[Math.round(position)];
      });

  const anchors: Array<{ value: number; score: number }> = [];
  for (const anchor of selected) {
    if (!anchors.length || anchors[anchors.length - 1].value !== anchor.value) {
      anchors.push(anchor);
    }
  }
  if (anchors.length < 2) return null;

  return {
    id: `mapping.ai.${slugify(label)}`,
    label,
    unit: '数值',
    direction,
    kind: 'anchors',
    anchors,
    sourceColumn,
    source: 'aiCandidate',
    evidence: 'D',
    ...evidence
  };
}

function buildCategoricalMapping(
  label: string,
  sourceColumn: string,
  rows: Array<Record<string, string>>,
  evidence: Record<string, unknown>
): ObjectiveMapping | null {
  const scoreColumn = officialScoreColumn(sourceColumn);
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    const raw = row[sourceColumn]?.trim();
    const score = numericOrNull(row[scoreColumn]);
    if (!raw || score === null) continue;
    const values = grouped.get(raw) ?? [];
    values.push(score);
    grouped.set(raw, values);
  }
  if (!grouped.size || grouped.size > 12) return null;

  const values = [...grouped.entries()]
    .map(([value, scores]) => ({
      value,
      score: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    }))
    .sort((left, right) => {
      const leftYes = normalizeCompare(left.value) === 'yes' ? 1 : 0;
      const rightYes = normalizeCompare(right.value) === 'yes' ? 1 : 0;
      if (leftYes !== rightYes) return leftYes - rightYes;
      return left.value.localeCompare(right.value, 'zh-CN');
    });

  return {
    id: `mapping.ai.${slugify(label)}`,
    label,
    unit: '类别',
    direction: 'higherBetter',
    kind: 'categorical',
    values,
    sourceColumn,
    source: 'aiCandidate',
    evidence: 'D',
    ...evidence
  };
}

function findDimensionId(rule: ScoringRule, suggestedParent: string): string | null {
  const normalized = normalizeCompare(suggestedParent);
  if (!normalized) return null;
  const matched = rule.nodes.find(node =>
    node.kind === 'dimension' &&
    (normalizeCompare(node.label) === normalized || node.id === suggestedParent)
  );
  return matched?.id ?? null;
}

function cloneRule(rule: ScoringRule): ScoringRule {
  return JSON.parse(JSON.stringify(rule)) as ScoringRule;
}

function buildLeafNode(input: {
  nodeId: string;
  parentId: string;
  label: string;
  recommendation: string;
  includeInParent: boolean;
  weight: number | null;
  mappingId?: string;
}): ScoreNode {
  const isObjective = input.recommendation === 'objective_mapping';
  return {
    id: input.nodeId,
    parentId: input.parentId,
    label: input.label,
    kind: 'leaf',
    inputType: isObjective ? 'objective' : 'subjective',
    weight: input.includeInParent ? input.weight : null,
    includeInParent: input.includeInParent,
    mappingId: isObjective ? input.mappingId : undefined,
    unit: isObjective ? '数值' : '0~10'
  };
}

export function buildRuleDraft(input: {
  baseRule: ScoringRule;
  reviews: RuleReview[];
  snapshot: DataSnapshotFull;
}): RuleDraftResult {
  const rule = cloneRule(input.baseRule);
  const rows = input.snapshot.snapshot.rows;
  const candidates: DraftCandidate[] = [];
  const skipped: Array<{ itemId: string; reason: string }> = [];
  const existingLabels = new Set(rule.nodes.map(node => normalizeCompare(node.label)));
  const newDimensions = new Map<string, string>();

  for (const review of input.reviews) {
    if (review.objectType !== 'column') {
      skipped.push({ itemId: review.itemId, reason: '机型建议不生成规则节点' });
      continue;
    }
    const label = baseLabel(review.itemId);
    if (!label) {
      skipped.push({ itemId: review.itemId, reason: '无法识别测试项名称' });
      continue;
    }
    if (existingLabels.has(normalizeCompare(label))) {
      skipped.push({ itemId: review.itemId, reason: '规则中已存在同名测试项' });
      continue;
    }
    if (review.recommendation === 'needs_raw_data' || review.recommendation === 'exclude') {
      skipped.push({ itemId: review.itemId, reason: '当前建议不进入规则草稿' });
      continue;
    }

    const suggestedParent = String(
      (review.payload?.suggestedParent as string | undefined) ?? ''
    ).trim();
    let parentId = findDimensionId(rule, suggestedParent);
    if (!parentId && suggestedParent) {
      const dimensionId = `ai.dimensions.${slugify(suggestedParent)}`;
      if (!rule.nodes.some(node => node.id === dimensionId)) {
        rule.nodes.push({
          id: dimensionId,
          parentId: rule.rootId,
          label: suggestedParent,
          kind: 'dimension',
          inputType: 'aggregate',
          weight: null,
          includeInParent: false
        });
        newDimensions.set(suggestedParent, dimensionId);
      }
      parentId = newDimensions.get(suggestedParent) ?? dimensionId;
    }
    if (!parentId) parentId = rule.rootId;

    const evidence = {
      aiRecommendation: review.recommendation,
      aiConfidence: review.confidence ?? null,
      aiModel: review.model ?? null,
      targetSnapshot: input.snapshot.versionLabel
    };

    let mapping: ObjectiveMapping | null = null;
    if (review.recommendation === 'objective_mapping') {
      mapping = buildCategoricalMapping(label, review.itemId, rows, evidence)
        ?? buildAnchorMapping(label, review.itemId, rows, evidence);
    }

    const nodeId = `ai.leaves.${slugify(review.itemId)}`;
    const includeInParent = false;
    const node = buildLeafNode({
      nodeId,
      parentId,
      label,
      recommendation: review.recommendation,
      includeInParent,
      weight: null,
      mappingId: mapping?.id
    });

    rule.nodes.push(node);
    if (mapping) rule.mappings.push(mapping);
    existingLabels.add(normalizeCompare(label));

    candidates.push({
      reviewId: review.id,
      objectType: review.objectType,
      itemId: review.itemId,
      title: review.title,
      recommendation: review.recommendation,
      suggestedParent: suggestedParent || rule.nodes.find(item => item.id === parentId)?.label || rule.rootId,
      includeInParent,
      weight: null,
      node,
      mapping,
      sourceColumn: review.itemId,
      officialScoreColumn: officialScoreColumn(review.itemId)
    });
  }

  const addedNodes = rule.nodes.length - input.baseRule.nodes.length;
  const addedMappings = rule.mappings.length - input.baseRule.mappings.length;
  return { rule, candidates, skipped, addedNodes, addedMappings };
}

export function updateDraftCandidates(rule: ScoringRule, candidates: DraftCandidate[]): ScoringRule {
  const next = cloneRule(rule);
  const nodeById = new Map(next.nodes.map(node => [node.id, node]));
  const mappingById = new Map(next.mappings.map(mapping => [mapping.id, mapping]));

  for (const candidate of candidates) {
    if (!candidate.node) continue;
    const node = nodeById.get(candidate.node.id);
    if (node) {
      node.includeInParent = candidate.includeInParent;
      node.weight = candidate.includeInParent ? candidate.weight : null;
    }
    if (candidate.mapping && mappingById.has(candidate.mapping.id)) {
      mappingById.set(candidate.mapping.id, candidate.mapping);
    }
  }
  return next;
}

function scoreColumnForNode(node: ScoreNode, rule: ScoringRule, sourceColumn: string | null): string | null {
  if (node.mappingId) {
    const mapping = rule.mappings.find(item => item.id === node.mappingId);
    if (mapping?.sourceColumn) return officialScoreColumn(mapping.sourceColumn);
  }
  return sourceColumn ? officialScoreColumn(sourceColumn) : null;
}

function columnForNode(node: ScoreNode, rule: ScoringRule, columns: string[]): string | null {
  if (node.mappingId) {
    const mapping = rule.mappings.find(item => item.id === node.mappingId);
    if (mapping?.sourceColumn) return mapping.sourceColumn;
    const testId = node.mappingId.match(/\.(\d+)$/)?.[1];
    if (testId) {
      const matched = columns.find(column => column.includes(`(test:${testId})`));
      if (matched) return matched;
    }
  }
  const label = baseLabel(node.label);
  const normalizedLabel = normalizeCompare(label);
  const byLabel = columns.find(column => normalizeCompare(baseLabel(column)) === normalizedLabel);
  return byLabel ?? null;
}

export function buildSnapshotInputs(
  rule: ScoringRule,
  snapshot: DataSnapshotFull
): Array<{ product: string; inputs: EvaluationInputs }> {
  const columns = snapshot.snapshot.columns;
  const rows = snapshot.snapshot.rows;

  return rows.map(row => {
    const inputs: EvaluationInputs = {};
    for (const node of rule.nodes) {
      if (node.kind !== 'leaf') continue;
      const sourceColumn = columnForNode(node, rule, columns);
      if (!sourceColumn) continue;

      if (node.inputType === 'objective') {
        const mapping = rule.mappings.find(item => item.id === node.mappingId);
        if (mapping?.kind === 'categorical') {
          const text = row[sourceColumn]?.trim();
          if (text) inputs[node.id] = { objective: { value: null, text } };
          continue;
        }
        const value = numericOrNull(row[sourceColumn]);
        if (value !== null) inputs[node.id] = { objective: { value } };
        continue;
      }

      const scoreColumn = scoreColumnForNode(node, rule, sourceColumn);
      if (!scoreColumn) continue;
      const score = numericOrNull(row[scoreColumn]);
      if (score !== null) {
        inputs[node.id] = { subjective: { scoreTenths: Math.round(score * 10) } };
      }
    }
    return { product: row[PRODUCT_KEY] ?? '', inputs };
  });
}

export function runRegression(
  rule: ScoringRule,
  snapshot: DataSnapshotFull
): RegressionReport {
  const samples = buildSnapshotInputs(rule, snapshot);
  const rows: RegressionProductRow[] = [];
  const warnings: string[] = [];
  const errors: number[] = [];
  const officialValues: number[] = [];

  for (const sample of samples) {
    const official = numericOrNull(
      snapshot.snapshot.rows.find(item => item[PRODUCT_KEY] === sample.product)?.[OFFICIAL_TOTAL_COLUMN]
    );
    const result = evaluateRule(rule, sample.inputs);
    if (result.warnings.length) {
      for (const warning of result.warnings) {
        const message = `${sample.product}: ${warning.message}`;
        if (!warnings.includes(message)) warnings.push(message);
      }
    }
    const value = result.value;
    const diff = official !== null && value !== null ? value - official : null;
    rows.push({
      product: sample.product,
      official,
      base: value,
      draft: value,
      baseDiff: diff,
      draftDiff: diff
    });
    if (official !== null && value !== null) {
      officialValues.push(official);
      errors.push(value - official);
    }
  }

  const evaluatedCount = errors.length;
  const mae = evaluatedCount
    ? errors.reduce((sum, value) => sum + Math.abs(value), 0) / evaluatedCount
    : 0;
  const rmse = evaluatedCount
    ? Math.sqrt(errors.reduce((sum, value) => sum + value ** 2, 0) / evaluatedCount)
    : 0;
  const maxAbsError = evaluatedCount ? Math.max(...errors.map(Math.abs)) : 0;

  return {
    summary: {
      productCount: samples.length,
      evaluatedCount,
      officialMean: officialValues.length
        ? officialValues.reduce((sum, value) => sum + value, 0) / officialValues.length
        : 0,
      mae,
      rmse,
      maxAbsError,
      within01: errors.filter(value => Math.abs(value) <= 0.1).length,
      within02: errors.filter(value => Math.abs(value) <= 0.2).length,
      improved: 0,
      regressed: 0,
      unchanged: evaluatedCount
    },
    rows,
    warnings: warnings.slice(0, 80)
  };
}

export function compareRegressions(base: RegressionReport, draft: RegressionReport): RegressionReport {
  const rows = draft.rows.map(draftRow => {
    const baseRow = base.rows.find(item => item.product === draftRow.product);
    const baseDiff = baseRow?.draftDiff ?? null;
    const draftDiff = draftRow.draftDiff;
    const improved = baseDiff !== null && draftDiff !== null && Math.abs(draftDiff) < Math.abs(baseDiff);
    const regressed = baseDiff !== null && draftDiff !== null && Math.abs(draftDiff) > Math.abs(baseDiff);
    return {
      ...draftRow,
      official: draftRow.official,
      base: baseRow?.draft ?? null,
      baseDiff,
      draftDiff,
      ...(improved ? {} : {}),
      ...(regressed ? {} : {})
    } as RegressionProductRow;
  });

  const errors = rows
    .map(row => row.draftDiff)
    .filter((value): value is number => value !== null);
  const evaluatedCount = errors.length;

  return {
    summary: {
      productCount: rows.length,
      evaluatedCount,
      officialMean: draft.summary.officialMean,
      mae: evaluatedCount ? errors.reduce((sum, value) => sum + Math.abs(value), 0) / evaluatedCount : 0,
      rmse: evaluatedCount ? Math.sqrt(errors.reduce((sum, value) => sum + value ** 2, 0) / evaluatedCount) : 0,
      maxAbsError: evaluatedCount ? Math.max(...errors.map(Math.abs)) : 0,
      within01: errors.filter(value => Math.abs(value) <= 0.1).length,
      within02: errors.filter(value => Math.abs(value) <= 0.2).length,
      improved: rows.filter(
        row => row.baseDiff !== null && row.draftDiff !== null &&
          Math.abs(row.draftDiff) < Math.abs(row.baseDiff)
      ).length,
      regressed: rows.filter(
        row => row.baseDiff !== null && row.draftDiff !== null &&
          Math.abs(row.draftDiff) > Math.abs(row.baseDiff)
      ).length,
      unchanged: rows.filter(
        row => row.baseDiff !== null && row.draftDiff !== null &&
          Math.abs(row.draftDiff - row.baseDiff) < 1e-9
      ).length
    },
    rows,
    warnings: draft.warnings
  };
}
