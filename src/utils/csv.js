import { parse } from 'csv-parse/sync';

export function parseCsv(bufferOrString) {
  const content = Buffer.isBuffer(bufferOrString) ? bufferOrString.toString('utf8') : String(bufferOrString || '');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    delimiter: detectDelimiter(content)
  });
}

function detectDelimiter(content) {
  const firstLine = content.split(/\r?\n/).find(Boolean) || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}
