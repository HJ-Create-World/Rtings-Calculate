import * as XLSX from 'xlsx';
import type { ScoreNode } from '../core/types';
import { rtingsRule } from '../data/rtingsRule';
import type { ProductBaseline } from '../data/rtingsRule';

interface ExcelSheet {
  name: string;
  rows: Record<string, string | number | null>[];
}

function downloadWorkbook(sheets: ExcelSheet[], fileName: string) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

export function exportComparisonExcel(
  products: ProductBaseline[],
  groups: ScoreNode[],
  fileName = 'Rtings-多产品对比'
) {
  const summaryRows: Record<string, string | number | null>[] = [
    Object.fromEntries([
      ['评测项', 'Mixed Usage 总分'],
      ...products.map(product => [product.label, product.expectedTotal] as const)
    ])
  ];

  groups.forEach(group => {
    summaryRows.push(
      Object.fromEntries([
        ['评测项', group.label],
        ...products.map(product => [product.label, product.expectedScores[group.id] ?? null] as const)
      ])
    );
  });

  const detailRows = products.flatMap(product =>
    rtingsRule.nodes
      .filter(node => node.inputType !== 'aggregate')
      .map(node => {
        const input = product.inputs[node.id];
        const rawValue =
          input?.objective?.text ??
          input?.objective?.value ??
          (input?.subjective ? input.subjective.scoreTenths / 10 : null);
        return {
          产品: product.label,
          节点ID: node.id,
          层级: node.kind,
          测试项: node.label,
          权重: node.weight,
          是否计入父项: node.includeInParent ? '是' : '否',
          期望分: product.expectedScores[node.id] ?? null,
          原始值: rawValue
        };
      })
  );

  downloadWorkbook(
    [
      { name: '对比汇总', rows: summaryRows },
      { name: '测试项明细', rows: detailRows }
    ],
    fileName
  );
}

export function exportDrilldownExcel(
  products: ProductBaseline[],
  testItems: ScoreNode[],
  fileName = 'Rtings-测试项对比'
) {
  const rows = testItems.map(item => ({
    ...Object.fromEntries([
      ['测试项', item.label],
      ...products.map(product => [product.label, product.expectedScores[item.id] ?? null] as const)
    ]),
    节点ID: item.id
  }));

  downloadWorkbook([{ name: '测试项对比', rows }], fileName);
}
