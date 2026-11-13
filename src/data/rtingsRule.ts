import baselinesV1Json from './baselines/rtings-baselines.v1.json';
import baselinesV3Json from './baselines/rtings-baselines-v3.json';
import ruleV1Json from './rtings-rule.v1.json';
import ruleV3Json from './rtings-rule-v3.json';
import type {
  EvaluationInputs,
  ObjectiveMapping,
  ScoringRule,
  ScoreNode
} from '../core/types';
import type { BacklightType, ScreenType } from '../utils/productMetadata';

export const rtingsRuleV1 = ruleV1Json as unknown as ScoringRule;
export const rtingsRuleV3 = ruleV3Json as unknown as ScoringRule;
export const rtingsRule = rtingsRuleV3;

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
  brand?: string;
  model?: string;
  releaseYear?: number | null;
  size?: string | number | null;
  /** 官方系列机型支持的全部尺寸；自建评测为单尺寸。 */
  sizes?: number[];
  screenType?: ScreenType;
  backlightType?: BacklightType;
  methodology?: string;
  productColumn?: string;
  totalCell?: string;
  source?: string;
  expectedTotal: number;
  expectedScores: Record<string, number>;
  inputs: Record<string, { objective?: { value: number | null; text?: string }; subjective?: { scoreTenths: number } }>;
  rows?: BaselineRow[];
}

export interface BaselineCollection {
  version: string;
  source: string;
  items: ProductBaseline[];
}

export const rtingsBaselinesV1 = baselinesV1Json as unknown as BaselineCollection;
export const rtingsBaselinesV3 = baselinesV3Json as unknown as BaselineCollection;
export const rtingsBaselines = rtingsBaselinesV3;

export const hisense65U7nVaBaselineV1 = getBaselineById('hisense-65u7n-rtings-va')!;
export const defaultBaselineV3 = rtingsBaselinesV3.items[0];

export function getBaselineById(id: string): ProductBaseline | undefined {
  return rtingsBaselinesV1.items.find(baseline => baseline.id === id);
}

export function getV3BaselineById(id: string): ProductBaseline | undefined {
  return rtingsBaselinesV3.items.find(baseline => baseline.id === id);
}

/**
 * v1 基准带 rows，按旧工作簿结构构造输入；
 * v3 基准直接保存来自 CSV 的官方输入。
 */
export function buildBaselineInputs(
  baseline: ProductBaseline,
  rule: ScoringRule = rtingsRule
): EvaluationInputs {
  if (baseline.rows?.length) {
    const nodeById = new Map<string, ScoreNode>(rule.nodes.map(node => [node.id, node]));
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

  return baseline.inputs as EvaluationInputs;
}

export function getMappingById(id: string): ObjectiveMapping | undefined {
  return rtingsRule.mappings.find(mapping => mapping.id === id);
}
