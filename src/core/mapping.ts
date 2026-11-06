import type {
  MappingInterval,
  MappingTrace,
  ObjectiveMapping,
  RuleWarning
} from './types';

function matchesLower(value: number, interval: MappingInterval): boolean {
  if (interval.infiniteOnly) return false;
  if (interval.min === null) return true;
  return interval.minInclusive ? value >= interval.min : value > interval.min;
}

function matchesUpper(value: number, interval: MappingInterval): boolean {
  if (interval.infiniteOnly) return false;
  if (interval.max === null) return true;
  return interval.maxInclusive ? value <= interval.max : value < interval.max;
}

function matchesInterval(value: number, interval: MappingInterval): boolean {
  if (interval.infiniteOnly) {
    return value === Number.POSITIVE_INFINITY;
  }
  return matchesLower(value, interval) && matchesUpper(value, interval);
}

function mapByIntervals(
  mapping: ObjectiveMapping,
  value: number
): MappingTrace {
  const intervals = mapping.intervals ?? [];
  const matched = intervals.filter(interval => matchesInterval(value, interval));

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

function mapByAnchors(mapping: ObjectiveMapping, value: number): MappingTrace {
  const anchors = (mapping.anchors ?? [])
    .map(item => (Array.isArray(item) ? { value: item[0], score: item[1] } : item))
    .sort((a, b) => a.value - b.value);
  if (!anchors.length) {
    return {
      mappingId: mapping.id,
      value,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        { code: 'INVALID_RULE', message: `${mapping.label} 缺少锚点`, nodeId: mapping.id }
      ]
    };
  }

  const exact = anchors.find(anchor => anchor.value === value);
  if (exact) {
    return {
      mappingId: mapping.id,
      value,
      scoreTenths: exact.score * 10,
      status: 'scored',
      warnings: []
    };
  }

  const lower = [...anchors].reverse().find(anchor => anchor.value < value);
  const upper = anchors.find(anchor => anchor.value > value);

  if (!lower || !upper) {
    return {
      mappingId: mapping.id,
      value,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'NO_MATCHING_INTERVAL',
          message: `值 ${value} 超出 ${mapping.label} 的实测锚点范围 [${anchors[0].value}, ${
            anchors[anchors.length - 1].value
          }]，不外推`,
          nodeId: mapping.id
        }
      ]
    };
  }

  const ratio = (value - lower.value) / (upper.value - lower.value);
  const score = lower.score + ratio * (upper.score - lower.score);
  return {
    mappingId: mapping.id,
    value,
    scoreTenths: score * 10,
    status: 'scored',
    warnings: []
  };
}

function mapByIdentity(mapping: ObjectiveMapping, value: number): MappingTrace {
  if (value < 0 || value > 10 || !Number.isFinite(value)) {
    return {
      mappingId: mapping.id,
      value,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'NO_MATCHING_INTERVAL',
          message: `${mapping.label} 的直接评分必须在 0~10 内`,
          nodeId: mapping.id
        }
      ]
    };
  }
  return {
    mappingId: mapping.id,
    value,
    scoreTenths: value * 10,
    status: 'scored',
    warnings: []
  };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapByCategorical(
  mapping: ObjectiveMapping,
  text: string | undefined
): MappingTrace {
  const raw = text?.trim();
  if (!raw) {
    return {
      mappingId: mapping.id,
      value: null,
      scoreTenths: null,
      status: 'incomplete',
      warnings: []
    };
  }

  const matched = (mapping.values ?? []).find(
    item => normalizeText(item.value) === normalizeText(raw)
  );
  if (!matched) {
    return {
      mappingId: mapping.id,
      value: null,
      scoreTenths: null,
      status: 'incomplete',
      warnings: [
        {
          code: 'NO_MATCHING_INTERVAL',
          message: `类别值“${raw}”未命中 ${mapping.label} 的映射表`,
          nodeId: mapping.id
        }
      ]
    };
  }

  return {
    mappingId: mapping.id,
    value: null,
    matchedInterval: undefined,
    scoreTenths: matched.score * 10,
    status: 'scored',
    warnings: []
  };
}

/**
 * 客观项统一入口：
 * - intervals：旧工作簿区间表，下含上不含。
 * - anchors：CSV 反推锚点，范围内线性插值，范围外不外推。
 * - identity：人工 0~10 评级直接得分。
 * - categorical：类别值精确映射。
 */
export function mapObjectiveValue(
  mapping: ObjectiveMapping,
  value: number | null,
  text?: string
): MappingTrace {
  const kind = mapping.kind ?? (mapping.intervals ? 'intervals' : 'anchors');

  if (kind === 'categorical') {
    return mapByCategorical(mapping, text);
  }

  if (value === null) {
    const normalized = normalizeText(text ?? '');
    if (normalized === 'inf' || normalized === 'infinity' || normalized === '∞') {
      return mapByIntervals(mapping, Number.POSITIVE_INFINITY);
    }
    return {
      mappingId: mapping.id,
      value: null,
      scoreTenths: null,
      status: 'incomplete',
      warnings: []
    };
  }

  if (kind === 'anchors') return mapByAnchors(mapping, value);
  if (kind === 'identity') return mapByIdentity(mapping, value);
  return mapByIntervals(mapping, value);
}

/** 映射表发布前的基础校验；不修改数据。 */
export function validateMapping(mapping: ObjectiveMapping): RuleWarning[] {
  const warnings: RuleWarning[] = [];
  const kind = mapping.kind ?? (mapping.intervals ? 'intervals' : 'anchors');

  if (kind !== 'intervals') return warnings;
  const intervals = mapping.intervals ?? [];

  for (let i = 0; i < intervals.length; i += 1) {
    const left = intervals[i];

    for (let j = i + 1; j < intervals.length; j += 1) {
      const right = intervals[j];
      if (left.infiniteOnly || right.infiniteOnly) continue;
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
