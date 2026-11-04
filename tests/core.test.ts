import { describe, expect, it } from 'vitest';
import { evaluateRule, validateMapping } from '../src/core';
import type { EvaluationInputs, ObjectiveMapping, ScoringRule } from '../src/core';

const boundaryMapping: ObjectiveMapping = {
  id: 'boundary',
  label: '边界映射',
  unit: 'cd/m²',
  direction: 'higherBetter',
  intervals: [
    {
      scoreTenths: 80,
      min: 100,
      max: 200,
      minInclusive: true,
      maxInclusive: false,
      source: 'engineerEstimate'
    },
    {
      scoreTenths: 100,
      min: 200,
      max: null,
      minInclusive: true,
      maxInclusive: false,
      source: 'engineerEstimate'
    }
  ]
};

function buildRule(): ScoringRule {
  return {
    version: 'test-v1',
    rootId: 'root',
    nodes: [
      {
        id: 'root',
        parentId: null,
        label: '总分',
        kind: 'group',
        inputType: 'aggregate',
        weight: null,
        includeInParent: false
      },
      {
        id: 'objectiveLeaf',
        parentId: 'root',
        label: '客观项',
        kind: 'leaf',
        inputType: 'objective',
        weight: 0.4,
        includeInParent: true,
        mappingId: 'boundary'
      },
      {
        id: 'subjectiveLeaf',
        parentId: 'root',
        label: '主观项',
        kind: 'leaf',
        inputType: 'subjective',
        weight: 0.6004,
        includeInParent: true
      },
      {
        id: 'excludedLeaf',
        parentId: 'root',
        label: 'ABL 主观项',
        kind: 'leaf',
        inputType: 'subjective',
        weight: 0.175,
        includeInParent: false
      }
    ],
    mappings: [boundaryMapping]
  };
}

function input(
  objectiveValue: number | null,
  subjectiveTenths: number | null
): EvaluationInputs {
  return {
    objectiveLeaf: { objective: { value: objectiveValue } },
    subjectiveLeaf: { subjective: { scoreTenths: subjectiveTenths } },
    excludedLeaf: { subjective: { scoreTenths: 90 } }
  };
}

describe('客观区间映射', () => {
  it('统一使用下含上不含', () => {
    const rule = buildRule();
    const lowerEdge = evaluateRule(rule, input(100, 80));
    const upperEdge = evaluateRule(rule, input(200, 80));

    expect(lowerEdge.nodes.objectiveLeaf.value).toBe(8);
    expect(upperEdge.nodes.objectiveLeaf.value).toBe(10);
  });

  it('10.0 分对应开放上界，inf 可以命中', () => {
    const rule = buildRule();
    const result = evaluateRule(rule, input(Number.POSITIVE_INFINITY, 80));

    expect(result.nodes.objectiveLeaf.value).toBe(10);
    expect(result.nodes.objectiveLeaf.mappingTrace?.matchedInterval?.max).toBeNull();
  });

  it('未命中区间时标为 incomplete，不自动取邻近分', () => {
    const rule = buildRule();
    const result = evaluateRule(rule, input(99.999, 80));

    expect(result.nodes.objectiveLeaf.status).toBe('incomplete');
    expect(result.nodes.objectiveLeaf.value).toBeNull();
    expect(result.status).toBe('incomplete');
  });

  it('区间重叠时不选择第一个，而是要求修正', () => {
    const mapping: ObjectiveMapping = {
      ...boundaryMapping,
      intervals: [
        ...boundaryMapping.intervals,
        {
          scoreTenths: 90,
          min: 150,
          max: 180,
          minInclusive: true,
          maxInclusive: true,
          source: 'engineerEstimate'
        }
      ]
    };
    const rule = { ...buildRule(), mappings: [mapping] };
    const result = evaluateRule(rule, input(160, 80));

    expect(result.nodes.objectiveLeaf.status).toBe('incomplete');
    expect(result.warnings.some(w => w.code === 'OVERLAP_INTERVALS')).toBe(true);
    expect(validateMapping(mapping).length).toBeGreaterThan(0);
  });
});

describe('聚合与追溯', () => {
  it('兼容 Excel 原样 SUMPRODUCT，不归一化', () => {
    const result = evaluateRule(buildRule(), input(150, 70));

    expect(result.value).toBeCloseTo(0.4 * 8 + 0.6004 * 7, 12);
    expect(result.warnings.some(w => w.code === 'WEIGHT_SUM_NOT_ONE')).toBe(true);
  });

  it('未计入父项的主观分不影响总分，但保留评分', () => {
    const result = evaluateRule(buildRule(), input(150, 70));

    expect(result.nodes.excludedLeaf.status).toBe('scored');
    expect(result.nodes.excludedLeaf.value).toBe(9);
    expect(result.nodes.excludedLeaf.contributionToParent).toBeNull();
  });

  it('子项缺失时总分不完整，但保留 partialValue 便于排查', () => {
    const result = evaluateRule(buildRule(), input(150, null));

    expect(result.status).toBe('incomplete');
    expect(result.value).toBeNull();
    expect(result.partialValue).toBeCloseTo(3.2, 12);
    expect(result.warnings.some(w => w.code === 'INCOMPLETE_CHILD')).toBe(true);
  });
});
