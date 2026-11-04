import { computed, ref } from 'vue';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationInputs, NodeEvaluation, ScoreNode } from '../core/types';
import {
  buildBaselineInputs,
  hisense65U7nVaBaselineV1,
  rtingsRuleV1
} from '../data/rtingsRule';

export function useScoring() {
  const inputs = computed<EvaluationInputs>(() => buildBaselineInputs(hisense65U7nVaBaselineV1));
  const result = computed(() => evaluateRule(rtingsRuleV1, inputs.value));

  const nodeById = computed(() => {
    const map = new Map<string, ScoreNode>();
    for (const node of rtingsRuleV1.nodes) map.set(node.id, node);
    return map;
  });

  const baselineRowByNode = computed(() => {
    const map = new Map<string, (typeof hisense65U7nVaBaselineV1.rows)[number]>();
    for (const row of hisense65U7nVaBaselineV1.rows) map.set(row.nodeId, row);
    return map;
  });

  const topGroups = computed(() => result.value.children);
  const warnings = computed(() => result.value.warnings);

  const selectedNodeId = ref<string>(rtingsRuleV1.rootId);
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
    rule: rtingsRuleV1,
    baseline: hisense65U7nVaBaselineV1,
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
