import baselineJson from './baselines/hisense-65u7n-va.v1.json';
import ruleJson from './rtings-rule.v1.json';
import type {
  EvaluationInputs,
  ObjectiveMapping,
  ScoringRule,
  ScoreNode
} from '../core/types';

export const rtingsRuleV1 = ruleJson as unknown as ScoringRule;

export const hisense65U7nVaBaselineV1 = baselineJson as unknown as HisenseBaseline;

export interface HisenseBaseline {
  id: string;
  label: string;
  ruleVersion: string;
  source: {
    sheet: string;
    productColumn: string;
    totalCell: string;
  };
  expectedTotal: number;
  expectedScores: Record<string, number>;
  inputs: Record<string, { subjective?: { scoreTenths: number } }>;
  rows: Array<{
    excelRow: number;
    nodeId: string;
    kind: 'leaf' | 'dimension';
    label: string;
    weight: number | null;
    includeInParent: boolean;
    expectedScore: number | null;
    rawText: string;
    rawNumber: number | null;
  }>;
}

/**
 * 权威基准当前包含两层输入：
 * - 有区间表的客观项：用原始测量值走映射。
 * - 无区间表/主观项：用工程师评分直接输入。
 */
export function buildHisenseBaselineInputs(
  rule: ScoringRule = rtingsRuleV1,
  baseline: HisenseBaseline = hisense65U7nVaBaselineV1
): EvaluationInputs {
  const nodeById = new Map<string, ScoreNode>(rule.nodes.map(node => [node.id, node]));
  const rowByNode = new Map<string, HisenseBaseline['rows'][number]>(
    baseline.rows.map(row => [row.nodeId, row])
  );
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
