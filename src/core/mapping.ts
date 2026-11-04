import type {
  MappingInterval,
  MappingTrace,
  ObjectiveMapping,
  RuleWarning
} from './types';

function matchesLower(value: number, interval: MappingInterval): boolean {
  if (interval.min === null) return true;
  return interval.minInclusive ? value >= interval.min : value > interval.min;
}

function matchesUpper(value: number, interval: MappingInterval): boolean {
  if (interval.max === null) return true;
  return interval.maxInclusive ? value <= interval.max : value < interval.max;
}

/**
 * 按确认口径查找客观分：
 * - 下含上不含；相邻高分区的下界必须包含，10.0 分使用开放上界。
 * - inf 用 Infinity 表示。
 * - 未命中、重叠都返回 incomplete，不自动取邻近分。
 */
export function mapObjectiveValue(
  mapping: ObjectiveMapping,
  value: number | null
): MappingTrace {
  if (value === null) {
    return {
      mappingId: mapping.id,
      value: null,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'NO_MATCHING_INTERVAL',
          message: `未填写：${mapping.label}`,
          nodeId: mapping.id
        }
      ]
    };
  }

  const matched = mapping.intervals.filter(
    interval => matchesLower(value, interval) && matchesUpper(value, interval)
  );

  if (matched.length === 0) {
    return {
      mappingId: mapping.id,
      value,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'NO_MATCHING_INTERVAL',
          message: `值 ${value} 未命中 ${mapping.label} 的已有区间`,
          nodeId: mapping.id
        }
      ]
    };
  }

  if (matched.length > 1) {
    return {
      mappingId: mapping.id,
      value,
      matchedInterval: matched[0],
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'OVERLAP_INTERVALS',
          message: `值 ${value} 命中 ${matched.length} 个重叠区间，需修正规则`,
          nodeId: mapping.id
        }
      ]
    };
  }

  return {
    mappingId: mapping.id,
    value,
    matchedInterval: matched[0],
    scoreTenths: matched[0].scoreTenths,
    status: 'scored',
    warnings: []
  };
}

/** 区间表发布前的基础校验；不修改数据。 */
export function validateMapping(mapping: ObjectiveMapping): RuleWarning[] {
  const warnings: RuleWarning[] = [];

  for (let i = 0; i < mapping.intervals.length; i += 1) {
    const left = mapping.intervals[i];

    for (let j = i + 1; j < mapping.intervals.length; j += 1) {
      const right = mapping.intervals[j];
      const leftMax = left.max ?? Number.POSITIVE_INFINITY;
      const rightMax = right.max ?? Number.POSITIVE_INFINITY;
      const leftMin = left.min ?? Number.NEGATIVE_INFINITY;
      const rightMin = right.min ?? Number.NEGATIVE_INFINITY;

      const overlaps = leftMin < rightMax && rightMin < leftMax;
      const touchingExclusive =
        left.max !== null &&
        right.min !== null &&
        left.max === right.min &&
        !left.maxInclusive &&
        !right.minInclusive;

      if (overlaps && !touchingExclusive) {
        warnings.push({
          code: 'OVERLAP_INTERVALS',
          message: `${mapping.label} 区间 ${left.scoreTenths / 10} 与 ${
            right.scoreTenths / 10
          } 重叠`,
          nodeId: mapping.id
        });
      }
    }
  }

  return warnings;
}
