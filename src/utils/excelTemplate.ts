import * as XLSX from 'xlsx';
import { rtingsRule } from '../data/rtingsRule';
import type { ScoreNode } from '../core/types';
import type { EvaluationDraft, ImportValidation } from '../types/evaluation';
import { parseObjectiveNumber } from '../composables/useEvaluationDraft';
import { collectLeafItemsByDocumentOrder, getMainDimensionNodes } from './ruleDisplay';

function shortGroupName(group: ScoreNode): string {
  const key = group.id.replace('mixed-usage.', '');
  const names: Record<string, string> = {
    brightness: 'Brightness',
    'black-level': 'Black Level',
    color: 'Color',
    processing: 'Processing',
    'motion-handling': 'Motion Handling',
    'game-mode': 'Game Mode',
    'direct-reflections': 'Direct Reflections',
    'ambient-black': 'Ambient Black'
  };
  return names[key] ?? group.label.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28);
}

function inputRow(node: ScoreNode) {
  const parent = rtingsRule.nodes.find(item => item.id === node.parentId);
  const mapping = node.mappingId
    ? rtingsRule.mappings.find(item => item.id === node.mappingId)
    : undefined;
  return {
    '维度 / 父级': parent?.label ?? '',
    '测试项': node.label,
    '节点ID': node.id,
    '类型': node.inputType === 'objective' ? '客观' : '主观',
    '单位 / 范围': node.inputType === 'objective' ? mapping?.unit ?? '数值' : '0~10',
    '填写说明': node.inputType === 'objective' ? '填数值或 inf，不带单位' : '填 0~10，支持一位小数',
    '值': '',
    '备注': ''
  };
}

function groupedInputSheets() {
  const groups = getMainDimensionNodes();
  return groups.map((group, index) => {
    const rows = collectLeafItemsByDocumentOrder(group.id)
      .filter(item => item.node.includeInParent)
      .map(item => inputRow(item.node));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [
      { wch: 26 },
      { wch: 34 },
      { wch: 44 },
      { wch: 8 },
      { wch: 16 },
      { wch: 24 },
      { wch: 12 },
      { wch: 24 }
    ];
    return {
      name: `${String(index + 1).padStart(2, '0')} ${shortGroupName(group)}`,
      sheet,
      count: rows.length
    };
  });
}

export function downloadImportTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { 字段: '品牌', 值: '' },
    { 字段: '型号', 值: '' },
    { 字段: '测试日期', 值: '' },
    { 字段: '测试工程师', 值: '' },
    { 字段: '尺寸（英寸）', 值: '' },
    { 字段: '屏幕类型', 值: 'OLED / LCD' },
    { 字段: '背光类型', 值: '自发光 / Mini LED / 普通 LED' },
    { 字段: '备注', 值: '' }
  ]), '产品信息');

  groupedInputSheets().forEach(({ name, sheet }) => {
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    { 说明: '1. 不要修改各分组工作表的“节点ID”“类型”和表头名称。' },
    { 说明: '2. 每个主维度一个工作表；同一主维度内已按维度排列。' },
    { 说明: '3. 客观项填数值或 inf，不要带单位；主观项填 0~10。' },
    { 说明: '4. 留空表示未填写，软件会标为不完整，不会自动补零。' },
    { 说明: '5. 导入前请确认规则版本与当前软件一致。' }
  ]), '导入说明');
  XLSX.writeFile(workbook, 'Rtings-评分导入模板.xlsx');
}

function sheetRows(workbook: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

export async function parseImportWorkbook(file: File): Promise<ImportValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const productRows = sheetRows(workbook, '产品信息');
  const inputSheetNames = workbook.SheetNames.filter(
    name => name !== '产品信息' && name !== '导入说明'
  );
  const inputRows = inputSheetNames.flatMap(name => sheetRows(workbook, name));
  if (!productRows.length) errors.push('缺少“产品信息”工作表或该表为空。');
  if (!inputRows.length) errors.push('缺少分组工作表，或所有分组工作表为空。');

  const productInfo = new Map<string, string>();
  for (const row of productRows) {
    const key = text(row['字段']);
    if (key) productInfo.set(key, text(row['值']));
  }

  const nodeById = new Map(rtingsRule.nodes.map(node => [node.id, node]));
  const values: EvaluationDraft['values'] = {};
  const seen = new Set<string>();

  for (const row of inputRows) {
    const nodeId = text(row['节点ID']);
    if (!nodeId) continue;
    if (seen.has(nodeId)) {
      warnings.push(`节点ID重复，已使用最后一条：${nodeId}`);
    }
    seen.add(nodeId);

    const node = nodeById.get(nodeId);
    if (!node) {
      errors.push(`未知节点ID：${nodeId}`);
      continue;
    }

    const rawValue = text(row['值']);
    const note = text(row['备注']);
    if (!rawValue) continue;

    if (node.inputType === 'objective') {
      if (rawValue.toLowerCase() === 'inf' || rawValue === '∞' || parseObjectiveNumber(rawValue) !== null) {
        values[nodeId] = { objectiveRaw: rawValue, note };
      } else {
        errors.push(`客观项值无效：${node.label}（${rawValue}）`);
      }
      continue;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
      errors.push(`主观项值无效：${node.label}（${rawValue}），应在 0~10 内`);
      continue;
    }
    values[nodeId] = { subjectiveScore: Math.round(parsed * 10), note };
  }

  if (!Object.keys(values).length && !errors.length) {
    warnings.push('未读取到任何测试值，请检查各分组工作表的“值”列。');
  }

  const sizeText = productInfo.get('尺寸（英寸）') ?? '';
  const size = Number(sizeText);
  const screenTypeText = (productInfo.get('屏幕类型') ?? '').toLowerCase();
  const backlightTypeText = (productInfo.get('背光类型') ?? '').toLowerCase();
  const draft: EvaluationDraft = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `import-${Date.now()}`,
    brand: productInfo.get('品牌') ?? '',
    model: productInfo.get('型号') ?? '',
    testDate: productInfo.get('测试日期') ?? '',
    engineer: productInfo.get('测试工程师') ?? '',
    size: Number.isFinite(size) && size > 0 ? size : null,
    screenType: screenTypeText.includes('oled') ? 'oled' : screenTypeText.includes('lcd') ? 'lcd' : 'unknown',
    backlightType: backlightTypeText.includes('mini') ? 'mini-led' : backlightTypeText.includes('自发光') ? 'emissive' : backlightTypeText.includes('led') ? 'led' : 'unknown',
    remark: productInfo.get('备注') ?? '',
    ruleVersion: rtingsRule.version,
    values,
    updatedAt: new Date().toISOString()
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    valueCount: Object.keys(values).length,
    draft
  };
}
