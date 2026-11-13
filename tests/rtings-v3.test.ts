import { describe, expect, it } from 'vitest';
import { evaluateRule } from '../src/core';
import {
  buildBaselineInputs,
  rtingsBaselinesV3,
  rtingsRuleV3
} from '../src/data/rtingsRule';

describe('Rtings 融合版规则 v3', () => {
  it('规则树无重复节点且根节点唯一', () => {
    const ids = rtingsRuleV3.nodes.map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(rtingsRuleV3.aggregate?.mode).toBe('renormalize');
    expect(rtingsRuleV3.aggregate?.roundingStep).toBe(0.1);
  });

  it('CSV 基准总分可在显示精度内复现', () => {
    const failures: string[] = [];
    for (const baseline of rtingsBaselinesV3.items) {
      const result = evaluateRule(rtingsRuleV3, buildBaselineInputs(baseline));
      const actual = result.value;
      const expected = baseline.expectedTotal;
      if (actual === null || Math.abs(actual - expected) > 0.21) {
        failures.push(
          `${baseline.label}: expected=${expected}, actual=${actual ?? 'incomplete'}`
        );
      }
    }

    expect(failures, failures.slice(0, 10).join('\n')).toHaveLength(0);
  });

  it('评分输入引用完整且支持类类别项均可表达 No', () => {
    const mappingIds = new Set(rtingsRuleV3.mappings.map(mapping => mapping.id));
    const issues: string[] = [];

    for (const node of rtingsRuleV3.nodes) {
      if (node.inputType === 'objective' && !node.mappingId) {
        issues.push(`${node.id}: 客观项缺少 mappingId`);
      }
      if (node.mappingId && !mappingIds.has(node.mappingId)) {
        issues.push(`${node.id}: mappingId 不存在`);
      }
    }

    for (const mapping of rtingsRuleV3.mappings) {
      if (mapping.kind !== 'categorical') continue;
      const values = mapping.values ?? [];
      const lower = values.map(value => value.value.toLowerCase());
      if (lower.includes('yes') && !lower.includes('no')) {
        issues.push(`${mapping.id}: 含 Yes 但缺少 No`);
      }
      if (new Set(values.map(value => value.value)).size !== values.length) {
        issues.push(`${mapping.id}: 类别选项重复`);
      }
    }

    expect(issues, issues.join('\n')).toHaveLength(0);
  });
});
