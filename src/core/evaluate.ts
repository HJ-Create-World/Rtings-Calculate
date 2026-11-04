import { mapObjectiveValue } from './mapping';
import type {
  EvaluationInputs,
  EvaluationResult,
  NodeEvaluation,
  RuleWarning,
  ScoreNode,
  ScoringRule
} from './types';

const WEIGHT_EPSILON = 1e-9;

function validateRule(rule: ScoringRule): RuleWarning[] {
  const warnings: RuleWarning[] = [];
  const ids = new Set<string>();

  for (const node of rule.nodes) {
    if (ids.has(node.id)) {
      warnings.push({
        code: 'INVALID_RULE',
        message: `节点 ID 重复：${node.id}`
      });
    }
    ids.add(node.id);
  }

  const nodeById = new Map(rule.nodes.map(node => [node.id, node]));

  for (const node of rule.nodes) {
    if (node.id === rule.rootId) {
      if (node.parentId !== null) {
        warnings.push({
          code: 'INVALID_RULE',
          message: `根节点 ${node.id} 的 parentId 必须为 null`,
          nodeId: node.id
        });
      }
      continue;
    }

    if (!node.parentId || !nodeById.has(node.parentId)) {
      warnings.push({
        code: 'INVALID_RULE',
        message: `节点 ${node.id} 的父项不存在`,
        nodeId: node.id
      });
    }

    if (node.inputType === 'objective' && !node.mappingId) {
      warnings.push({
        code: 'INVALID_RULE',
        message: `客观节点 ${node.id} 缺少 mappingId`,
        nodeId: node.id
      });
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(node: ScoreNode): void {
    if (visiting.has(node.id)) {
      throw new Error(`评分规则存在循环依赖：${node.id}`);
    }
    if (visited.has(node.id)) return;

    visiting.add(node.id);
    const parent = node.parentId ? nodeById.get(node.parentId) : undefined;
    if (parent) visit(parent);

    visiting.delete(node.id);
    visited.add(node.id);
  }

  for (const node of rule.nodes) visit(node);
  return warnings;
}

function sumWeights(children: ScoreNode[]): number {
  return children.reduce((total, child) => total + (child.weight ?? 0), 0);
}

export function evaluateRule(
  rule: ScoringRule,
  inputs: EvaluationInputs
): EvaluationResult {
  const validationWarnings = validateRule(rule);
  const nodeById = new Map(rule.nodes.map(node => [node.id, node]));
  const childrenByParent = new Map<string, ScoreNode[]>();

  for (const node of rule.nodes) {
    if (!node.parentId) continue;
    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }

  const evaluated = new Map<string, NodeEvaluation>();

  function evaluateNode(nodeId: string): NodeEvaluation {
    const cached = evaluated.get(nodeId);
    if (cached) return cached;

    const node = nodeById.get(nodeId);
    if (!node) throw new Error(`评分节点不存在：${nodeId}`);

    if (node.inputType === 'aggregate') {
      const children = childrenByParent.get(node.id) ?? [];
      const childEvaluations = children.map(child => evaluateNode(child.id));

      let partialValue = 0;
      let hasIncomplete = false;
      let hasIncluded = false;
      const warnings: RuleWarning[] = [];

      children.forEach((child, index) => {
        const childEvaluation = childEvaluations[index];
        const canContribute = child.includeInParent && child.weight !== null;

        if (!canContribute) {
          childEvaluation.contributionToParent = null;
          return;
        }

        hasIncluded = true;
        if (childEvaluation.status === 'scored') {
          const contribution = child.weight! * childEvaluation.value!;
          partialValue += contribution;
          childEvaluation.contributionToParent = contribution;
          return;
        }

        hasIncomplete = true;
        childEvaluation.contributionToParent = null;
        warnings.push({
          code: 'INCOMPLETE_CHILD',
          message: `子项 ${child.label} 不完整，父项 ${node.label} 无法给出正式分`,
          nodeId: node.id
        });
      });

      if (hasIncluded) {
        const weightSum = sumWeights(children.filter(child => child.includeInParent));
        if (Math.abs(weightSum - 1) > WEIGHT_EPSILON) {
          warnings.push({
            code: 'WEIGHT_SUM_NOT_ONE',
            message: `${node.label} 计入子项权重和为 ${weightSum}，按 Excel 原样聚合`,
            nodeId: node.id
          });
        }
      }

      const status = !hasIncluded
        ? 'excluded'
        : hasIncomplete
          ? 'incomplete'
          : 'scored';

      const result: NodeEvaluation = {
        nodeId: node.id,
        status,
        value: status === 'scored' ? partialValue : null,
        partialValue,
        contributionToParent: null,
        children: childEvaluations,
        warnings
      };

      evaluated.set(node.id, result);
      return result;
    }

    const input = inputs[node.id];
    const warnings: RuleWarning[] = [];

    if (node.inputType === 'objective') {
      const mapping = rule.mappings.find(item => item.id === node.mappingId);
      if (!mapping) {
        warnings.push({
          code: 'INVALID_RULE',
          message: `找不到节点 ${node.label} 的映射表`,
          nodeId: node.id
        });
        const result: NodeEvaluation = {
          nodeId: node.id,
          status: 'incomplete',
          value: null,
          partialValue: 0,
          contributionToParent: null,
          children: [],
          warnings
        };
        evaluated.set(node.id, result);
        return result;
      }

      const trace = mapObjectiveValue(mapping, input?.objective?.value ?? null);
      const result: NodeEvaluation = {
        nodeId: node.id,
        status: trace.status,
        value: trace.scoreTenths === null ? null : trace.scoreTenths / 10,
        partialValue: trace.scoreTenths === null ? 0 : trace.scoreTenths / 10,
        contributionToParent: null,
        children: [],
        mappingTrace: trace,
        warnings: [...warnings, ...trace.warnings]
      };
      evaluated.set(node.id, result);
      return result;
    }

    const subjectiveScore = input?.subjective?.scoreTenths ?? null;
    const validSubjective =
      subjectiveScore !== null &&
      Number.isFinite(subjectiveScore) &&
      subjectiveScore >= 0 &&
      subjectiveScore <= 100;

    if (!validSubjective) {
      if (subjectiveScore !== null) {
        warnings.push({
          code: 'INVALID_SUBJECTIVE_SCORE',
          message: `${node.label} 主观分必须在 0~10 且一位小数内`,
          nodeId: node.id
        });
      }
      const result: NodeEvaluation = {
        nodeId: node.id,
        status: 'incomplete',
        value: null,
        partialValue: 0,
        contributionToParent: null,
        children: [],
        subjectiveScoreTenths: subjectiveScore,
        warnings
      };
      evaluated.set(node.id, result);
      return result;
    }

    const result: NodeEvaluation = {
      nodeId: node.id,
      status: 'scored',
      value: subjectiveScore! / 10,
      partialValue: subjectiveScore! / 10,
      contributionToParent: null,
      children: [],
      subjectiveScoreTenths: subjectiveScore,
      warnings
    };
    evaluated.set(node.id, result);
    return result;
  }

  const root = evaluateNode(rule.rootId);
  const allWarnings = [...validationWarnings];

  function collectWarnings(evaluation: NodeEvaluation): void {
    allWarnings.push(...evaluation.warnings);
    evaluation.children.forEach(collectWarnings);
  }

  collectWarnings(root);

  return {
    rootId: rule.rootId,
    status: root.status,
    value: root.value,
    partialValue: root.partialValue,
    children: root.children,
    nodes: Object.fromEntries([...evaluated.entries()]),
    warnings: allWarnings
  };
}
