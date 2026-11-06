import { mapObjectiveValue } from './mapping';
import type {
  AggregatePolicy,
  EvaluationInputs,
  EvaluationResult,
  NodeEvaluation,
  RuleWarning,
  ScoreNode,
  ScoringRule
} from './types';

const WEIGHT_EPSILON = 1e-9;

const DEFAULT_POLICY: AggregatePolicy = {
  mode: 'excelSum',
  missing: 'block',
  roundingStep: null
};

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

function roundToStep(value: number, step: number | null | undefined): number {
  if (!step || step <= 0) return value;
  return Number((Math.round(value / step) * step).toFixed(10));
}

function sumWeights(children: ScoreNode[]): number {
  return children.reduce((total, child) => total + (child.weight ?? 0), 0);
}

export function evaluateRule(
  rule: ScoringRule,
  inputs: EvaluationInputs
): EvaluationResult {
  const policy = rule.aggregate ?? DEFAULT_POLICY;
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
      const warnings: RuleWarning[] = [];

      const canContribute = children.map(
        child =>
          child.includeInParent &&
          child.weight !== null &&
          (policy.mode === 'renormalize' ? child.weight > 0 : true)
      );

      if (policy.mode === 'renormalize') {
        const contributing = children
          .map((child, index) => ({ child, evaluation: childEvaluations[index], index }))
          .filter(
            item =>
              canContribute[item.index] && item.evaluation.status === 'scored'
          );

        const configuredWeightSum = sumWeights(
          children.filter((_child, index) => canContribute[index])
        );
        if (
          configuredWeightSum > 0 &&
          Math.abs(configuredWeightSum - 1) > WEIGHT_EPSILON
        ) {
          warnings.push({
            code: 'WEIGHT_SUM_NOT_ONE',
            message: `${node.label} 计入子项权重和为 ${configuredWeightSum}，已按可用子项重归一`,
            nodeId: node.id
          });
        }

        if (!contributing.length) {
          const hasConfigured = canContribute.some(Boolean);
          const result: NodeEvaluation = {
            nodeId: node.id,
            status: hasConfigured ? 'incomplete' : 'excluded',
            value: null,
            partialValue: 0,
            contributionToParent: null,
            children: childEvaluations,
            warnings: hasConfigured
              ? [
                  {
                    code: 'INCOMPLETE_CHILD',
                    message: `${node.label} 缺少可评分的子项`,
                    nodeId: node.id
                  }
                ]
              : []
          };
          evaluated.set(node.id, result);
          return result;
        }

        const weightSum = contributing.reduce(
          (total, item) => total + item.child.weight!,
          0
        );
        const weightedSum = contributing.reduce(
          (total, item) => total + item.child.weight! * item.evaluation.value!,
          0
        );
        const normalized = weightSum > 0 ? weightedSum / weightSum : 0;

        contributing.forEach(item => {
          item.evaluation.contributionToParent =
            (item.child.weight! * item.evaluation.value!) / weightSum;
        });
        children.forEach((_child, index) => {
          if (!canContribute[index] || childEvaluations[index].status !== 'scored') {
            childEvaluations[index].contributionToParent = null;
          }
        });

        const result: NodeEvaluation = {
          nodeId: node.id,
          status: 'scored',
          value: roundToStep(normalized, policy.roundingStep),
          partialValue: normalized,
          contributionToParent: null,
          children: childEvaluations,
          warnings
        };
        evaluated.set(node.id, result);
        return result;
      }

      let partialValue = 0;
      let hasIncomplete = false;
      let hasIncluded = false;

      children.forEach((child, index) => {
        const childEvaluation = childEvaluations[index];
        if (!canContribute[index]) {
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
        const weightSum = sumWeights(children.filter((_child, index) => canContribute[index]));
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
        value: status === 'scored' ? roundToStep(partialValue, policy.roundingStep) : null,
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

      const trace = mapObjectiveValue(
        mapping,
        input?.objective?.value ?? null,
        input?.objective?.text
      );
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
