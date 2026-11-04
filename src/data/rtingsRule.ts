import baselinesJson from './baselines/rtings-baselines.v1.json';
import ruleJson from './rtings-rule.v1.json';
import type {
  EvaluationInputs,
  ObjectiveMapping,
  ScoringRule,
  ScoreNode
} from '../core/types';

export const rtingsRuleV1 = ruleJson as unknown as ScoringRule;

export interface BaselineRow {
  excelRow: number;
  nodeId: string;
  kind: 'leaf' | 'dimension';
  label: string;
  weight: number | null;
  includeInParent: boolean;
  expectedScore: number | null;
  rawText: string;
  rawNumber: number | null;
}

export interface ProductBaseline {
  id: string;
  label: string;
  productColumn: string;
  totalCell: string;
  expectedTotal: number;
  expectedScores: Record<string, number>;
  inputs: Record<string, { objective?: { value: number }; subjective?: { scoreTenths: number } }>;
  rows: BaselineRow[];
}

export interface BaselineCollection {
  version: string;
  source: string;
  items: ProductBaseline[];
}

export const rtingsBaselinesV1 = baselinesJson as unknown as BaselineCollection;

export const hisense65U7nVaBaselineV1 = getBaselineById('hisense-65u7n-rtings-va')!;

export function getBaselineById(id: string): ProductBaseline | undefined {
  return rtingsBaselinesV1.items.find(baseline => baseline.id === id);
}

/**
 * 基准输入包含两层：
 * - 有区间表的客观项：用原始测量值走映射。
 * - 无区间表/主观项：用工程师评分直接输入。
 */
export function buildBaselineInputs(baseline: ProductBaseline): EvaluationInputs {
  const nodeById = new Map<string, ScoreNode>(rtingsRuleV1.nodes.map(node => [node.id, node]));
  const rowByNode = new Map<string, BaselineRow>(baseline.rows.map(row => [row.nodeId, row]));
  const inputs: EvaluationInputs = {};

  for (const [nodeId, score] of Object.entries(baseline.expectedScores)) {
    const node = nodeById.get(nodeId);
    const row = rowByNode.get(nodeId);
    if (!node || !row) continue;

    if (node.inputType === 'objective' && row.rawNumber !== null) {
      inputs[nodeId] = { objective: { value: row.rawNumber } };
      continue;
    }

    inputs[nodeId] = {
      subjective: { scoreTenths: Math.round(score * 10) }
    };
  }

  return inputs;
}

export function getMappingById(id: string): ObjectiveMapping | undefined {
  return rtingsRuleV1.mappings.find(mapping => mapping.id === id);
}
