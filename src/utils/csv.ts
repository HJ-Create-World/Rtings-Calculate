export interface ParsedCsv {
  columns: string[];
  rows: Array<Record<string, string>>;
}

/**
 * 解析 Rtings 导出的 CSV。支持双引号包裹字段、字段内逗号、换行和转义引号。
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    if (row.some(value => value.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      pushField();
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      pushRow();
      continue;
    }

    field += char;
  }

  if (field !== '' || row.length) pushRow();
  return rows;
}

export function csvToRecords(text: string): ParsedCsv {
  const matrix = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!matrix.length) return { columns: [], rows: [] };
  const columns = matrix[0].map((column, index) => column || `column-${index + 1}`);
  const rows = matrix.slice(1).map(line => {
    const record: Record<string, string> = {};
    columns.forEach((column, index) => {
      record[column] = line[index] ?? '';
    });
    return record;
  });
  return { columns, rows };
}
