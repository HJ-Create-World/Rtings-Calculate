import { describe, expect, it } from 'vitest';
import { evaluateRule, validateMapping } from '../src/core';
import {
  buildHisenseBaselineInputs,
  hisense65U7nVaBaselineV1,
  rtingsRuleV1
} from '../src/data/rtingsRule';

describe('Rtings 工作簿规则 v1', () => {
  it('区间表无重叠', () => {
    const warnings = rtingsRuleV1.mappings.flatMap(mapping =>
      validateMapping(mapping).map(warning => ({
        mappingId: mapping.id,
        ...warning
      }))
    );

    expect(warnings).toEqual([]);
  });

  it('权威基准客观项能通过区间映射得到工程师分数', () => {
    const inputs = buildHisenseBaselineInputs();
    const result = evaluateRule(rtingsRuleV1, inputs);
    const objectiveRows = hisense65U7nVaBaselineV1.rows.filter(row => {
      const node = rtingsRuleV1.nodes.find(item => item.id === row.nodeId);
      return node?.inputType === 'objective';
    });

    expect(objectiveRows.length).toBe(19);
    for (const row of objectiveRows) {
      const evaluation = result.nodes[row.nodeId];
      expect(evaluation?.status, row.nodeId).toBe('scored');
      expect(evaluation?.value, row.nodeId).toBeCloseTo(row.expectedScore!, 10);
    }
  });

  it('权威基准聚合总分与 000005 G2 一致', () => {
    const inputs = buildHisenseBaselineInputs();
    const result = evaluateRule(rtingsRuleV1, inputs);

    expect(result.status).toBe('scored');
    expect(result.value).toBeCloseTo(hisense65U7nVaBaselineV1.expectedTotal, 10);
  });

  it('保留 Excel 原样聚合语义并提示权重和异常', () => {
    const inputs = buildHisenseBaselineInputs();
    const result = evaluateRule(rtingsRuleV1, inputs);
    const weightWarnings = result.warnings.filter(
      warning => warning.code === 'WEIGHT_SUM_NOT_ONE'
    );

    expect(
      weightWarnings.some(warning => warning.nodeId?.includes('supported-resolutions'))
    ).toBe(true);
  });

  it('ABL 不计入总分，Lighting Zone Transitions 计入 3%', () => {
    const inputs = buildHisenseBaselineInputs();
    const result = evaluateRule(rtingsRuleV1, inputs);
    const ablNodes = rtingsRuleV1.nodes.filter(node =>
      node.label.includes('Automatic Brightness Limiting')
    );
    const transitionNode = rtingsRuleV1.nodes.find(
      node => node.label === 'Lighting Zone Transitions'
    );

    expect(ablNodes.length).toBeGreaterThan(0);
    for (const node of ablNodes) {
      expect(node.includeInParent).toBe(false);
      expect(result.nodes[node.id]?.contributionToParent ?? 0).toBe(0);
    }

    expect(transitionNode?.includeInParent).toBe(true);
    expect(transitionNode?.weight).toBeCloseTo(0.03, 10);
  });
});
