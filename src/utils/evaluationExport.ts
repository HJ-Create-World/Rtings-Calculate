import { buildDraftInputs } from '../composables/useEvaluationDraft';
import { rtingsRule } from '../data/rtingsRule';
import { evaluateRule } from '../core/evaluate';
import type { EvaluationDraft } from '../types/evaluation';
import type { NodeEvaluation } from '../core/types';
import {
  createGroupRadarChartImage,
  createTotalScoreChartImage
} from './chartImage';
import { statusLabel } from './format';

function parentLabel(nodeId: string): string {
  const parent = rtingsRule.nodes.find(node => node.id === nodeId);
  return parent?.label ?? '';
}

function topGroupLabel(nodeId: string): string {
  let current = rtingsRule.nodes.find(node => node.id === nodeId);
  while (current?.parentId && current.parentId !== rtingsRule.rootId) {
    current = rtingsRule.nodes.find(node => node.id === current!.parentId);
  }
  return current?.label ?? '';
}

function leafNodes() {
  return rtingsRule.nodes.filter(node => node.inputType !== 'aggregate');
}

function rawInputText(draft: EvaluationDraft, nodeId: string): string | number | null {
  const value = draft.values[nodeId];
  if (!value) return null;
  if (value.objectiveRaw !== undefined) return value.objectiveRaw;
  if (value.subjectiveScore !== null && value.subjectiveScore !== undefined) {
    return value.subjectiveScore / 10;
  }
  return null;
}

function normalizeHeaderStyle(worksheet: any) {
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FF1F2937' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
  header.height = 22;
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function autoColumns(worksheet: any, widths: number[]) {
  worksheet.columns = widths.map(width => ({ width }));
}

export async function exportEvaluationExcel(draft: EvaluationDraft): Promise<void> {
  const ExcelJS = await import('exceljs');
  const inputs = buildDraftInputs(draft);
  const result = evaluateRule(rtingsRule, inputs);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Rtings Calculate';
  workbook.created = new Date();

  const fileNameParts = [
    'Rtings评分',
    draft.brand || '未命名品牌',
    draft.model || '未命名型号',
    draft.testDate || ''
  ].filter(Boolean).join('-');

  const infoSheet = workbook.addWorksheet('产品信息');
  infoSheet.columns = [
    { header: '字段', key: 'field', width: 22 },
    { header: '内容', key: 'value', width: 48 }
  ];
  infoSheet.addRows([
    { field: '品牌', value: draft.brand },
    { field: '型号', value: draft.model },
    { field: '测试日期', value: draft.testDate },
    { field: '测试工程师', value: draft.engineer },
    { field: '备注', value: draft.remark },
    { field: '规则版本', value: draft.ruleVersion },
    { field: '评测ID', value: draft.id },
    { field: 'Mixed Usage 总分', value: result.value ?? '不完整' },
    { field: '计算状态', value: statusLabel(result.status) },
    { field: '导出时间', value: new Date().toLocaleString('zh-CN') }
  ]);
  normalizeHeaderStyle(infoSheet);

  const topGroups = rtingsRule.nodes.filter(
    node => node.parentId === rtingsRule.rootId && node.includeInParent
  );
  const summarySheet = workbook.addWorksheet('评分汇总');
  summarySheet.columns = [
    { header: '分类目', key: 'label', width: 38 },
    { header: '权重', key: 'weight', width: 12 },
    { header: '得分', key: 'score', width: 12 },
    { header: '贡献值', key: 'contribution', width: 16 },
    { header: '状态', key: 'status', width: 14 }
  ];
  summarySheet.addRows(
    topGroups.map(group => {
      const evaluation = result.nodes[group.id];
      return {
        label: group.label,
        weight: group.weight ?? 0,
        score: evaluation?.value ?? null,
        contribution: evaluation?.contributionToParent ?? null,
        status: statusLabel(evaluation?.status)
      };
    })
  );
  summarySheet.addRow({});
  summarySheet.addRow({ label: 'Mixed Usage 总分', weight: 1, score: result.value, contribution: result.value, status: statusLabel(result.status) });
  normalizeHeaderStyle(summarySheet);
  autoColumns(summarySheet, [38, 12, 12, 16, 14]);

  const detailSheet = workbook.addWorksheet('测试项明细');
  detailSheet.columns = [
    { header: '主维度', key: 'group', width: 28 },
    { header: '子类维度', key: 'dimension', width: 30 },
    { header: '测试项', key: 'label', width: 42 },
    { header: '输入类型', key: 'inputType', width: 12 },
    { header: '单位 / 范围', key: 'unit', width: 16 },
    { header: '输入值', key: 'input', width: 22 },
    { header: '单项评分', key: 'score', width: 12 },
    { header: '权重', key: 'weight', width: 12 },
    { header: '是否计入', key: 'included', width: 12 },
    { header: '状态', key: 'status', width: 14 },
    { header: '提示', key: 'warning', width: 52 }
  ];
  leafNodes().forEach(node => {
    const evaluation = result.nodes[node.id];
    const mapping = rtingsRule.mappings.find(item => item.id === node.mappingId);
    detailSheet.addRow({
      group: topGroupLabel(node.id),
      dimension: parentLabel(node.id),
      label: node.label,
      inputType: node.inputType === 'objective' ? '客观' : '主观',
      unit: node.unit ?? mapping?.unit ?? '',
      input: rawInputText(draft, node.id),
      score: evaluation?.value ?? null,
      weight: node.weight,
      included: node.includeInParent ? '是' : '否',
      status: statusLabel(evaluation?.status),
      warning: evaluation?.warnings[0]?.message ?? ''
    });
  });
  normalizeHeaderStyle(detailSheet);
  autoColumns(detailSheet, [28, 30, 42, 12, 16, 22, 12, 12, 12, 14, 52]);

  const traceSheet = workbook.addWorksheet('计算追踪');
  traceSheet.columns = [
    { header: '层级', key: 'kind', width: 14 },
    { header: '节点ID', key: 'id', width: 52 },
    { header: '节点名称', key: 'label', width: 42 },
    { header: '父项', key: 'parent', width: 34 },
    { header: '权重', key: 'weight', width: 12 },
    { header: '得分', key: 'score', width: 12 },
    { header: '父项贡献', key: 'contribution', width: 16 },
    { header: '状态', key: 'status', width: 14 },
    { header: '警告', key: 'warning', width: 58 }
  ];
  Object.values(result.nodes).forEach((evaluation: NodeEvaluation) => {
    const node = rtingsRule.nodes.find(item => item.id === evaluation.nodeId);
    traceSheet.addRow({
      kind: node?.kind ?? '',
      id: evaluation.nodeId,
      label: node?.label ?? evaluation.nodeId,
      parent: parentLabel(evaluation.nodeId),
      weight: node?.weight ?? null,
      score: evaluation.value,
      contribution: evaluation.contributionToParent,
      status: statusLabel(evaluation.status),
      warning: evaluation.warnings.map(warning => warning.message).join('；')
    });
  });
  normalizeHeaderStyle(traceSheet);
  autoColumns(traceSheet, [14, 52, 42, 34, 12, 12, 16, 14, 58]);

  const chartSheet = workbook.addWorksheet('总览图表');
  chartSheet.columns = [{ width: 3 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }];
  chartSheet.getCell('B2').value = 'Mixed Usage 总分';
  chartSheet.getCell('B2').font = { bold: true, size: 14 };
  const totalImage = workbook.addImage({
    base64: createTotalScoreChartImage([
      { label: `${draft.brand} ${draft.model}`.trim() || '当前机型', value: result.value }
    ]),
    extension: 'png'
  });
  chartSheet.addImage(totalImage, {
    tl: { col: 1, row: 2 },
    ext: { width: 880, height: 440 }
  });

  chartSheet.getCell('B30').value = '主维度评分雷达';
  chartSheet.getCell('B30').font = { bold: true, size: 14 };
  const radarImage = workbook.addImage({
    base64: createGroupRadarChartImage(
      topGroups.map(group => group.label),
      topGroups.map(group => result.nodes[group.id]?.value ?? null),
      `${draft.brand} ${draft.model}`.trim() || '当前机型'
    ),
    extension: 'png'
  });
  chartSheet.addImage(radarImage, {
    tl: { col: 1, row: 29 },
    ext: { width: 880, height: 440 }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNameParts}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}
