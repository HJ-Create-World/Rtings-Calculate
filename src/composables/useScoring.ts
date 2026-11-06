import { computed, ref } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationInputs, NodeEvaluation, ScoreNode } from '../core/types';
import {
  buildBaselineInputs,
  defaultBaselineV3,
  rtingsRule
} from '../data/rtingsRule';
import type { BaselineRow } from '../data/rtingsRule';

export function useScoring() {
  const inputs = computed<EvaluationInputs>(() => buildBaselineInputs(defaultBaselineV3));
  const result = computed(() => evaluateRule(rtingsRule, inputs.value));

  const nodeById = computed(() => {
    const map = new Map<string, ScoreNode>();
    for (const node of rtingsRule.nodes) map.set(node.id, node);
    return map;
  });

  const baselineRowByNode = computed(() => {
    const map = new Map<string, BaselineRow>();
    for (const row of defaultBaselineV3.rows ?? []) map.set(row.nodeId, row);
    return map;
  });

  const topGroups = computed(() => result.value.children);
  const warnings = computed(() => result.value.warnings);

  const selectedNodeId = ref<string>(rtingsRule.rootId);
  const selectedNode = computed(() => nodeById.value.get(selectedNodeId.value));
  const selectedEvaluation = computed(() => result.value.nodes[selectedNodeId.value]);
  const selectedBaselineRow = computed(() =>
    baselineRowByNode.value.get(selectedNodeId.value)
  );
  const selectedChildren = computed(() => selectedEvaluation.value?.children ?? []);

  function selectNode(nodeId: string) {
    selectedNodeId.value = nodeId;
  }

  function labelFor(nodeId: string): string {
    return nodeById.value.get(nodeId)?.label ?? nodeId;
  }

  function pathFor(nodeId: string): ScoreNode[] {
    const path: ScoreNode[] = [];
    let current = nodeById.value.get(nodeId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? nodeById.value.get(current.parentId) : undefined;
    }
    return path;
  }

  return {
    rule: rtingsRule,
    baseline: defaultBaselineV3,
    result,
    warnings,
    topGroups,
    nodeById,
    baselineRowByNode,
    selectedNodeId,
    selectedNode,
    selectedEvaluation,
    selectedBaselineRow,
    selectedChildren,
    selectNode,
    labelFor,
    pathFor
  };
}

export type ScoringContext = ReturnType<typeof useScoring>;
export type { NodeEvaluation };
