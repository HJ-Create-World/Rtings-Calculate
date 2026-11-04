export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(1);
}

export function formatExact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatWeight(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'NA';
  const percent = value * 100;
  return `${Number(percent.toFixed(2))}%`;
}

export function formatContribution(value: number | null | undefined): string {
  if (value === null || value === undefined) return '不计入';
  return value.toFixed(4);
}

export function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'scored':
      return '已评分';
    case 'incomplete':
      return '不完整';
    case 'excluded':
      return '不计入';
    default:
      return '—';
  }
}

export function statusClass(status: string | undefined): string {
  switch (status) {
    case 'scored':
      return 'status-scored';
    case 'incomplete':
      return 'status-incomplete';
    case 'excluded':
      return 'status-excluded';
    default:
      return 'status-neutral';
  }
}

export function warningLabel(code: string): string {
  switch (code) {
    case 'WEIGHT_SUM_NOT_ONE':
      return '权重和异常';
    case 'NO_MATCHING_INTERVAL':
      return '未命中区间';
    case 'OVERLAP_INTERVALS':
      return '区间重叠';
    case 'INVALID_SUBJECTIVE_SCORE':
      return '主观分无效';
    case 'INVALID_RULE':
      return '规则异常';
    case 'INCOMPLETE_CHILD':
      return '子项不完整';
    default:
      return code;
  }
}
