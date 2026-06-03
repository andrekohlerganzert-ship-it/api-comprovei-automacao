import AdmZip from 'adm-zip';

export function extractFirstCsvFromZip(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const csvEntry = entries.find(e => !e.isDirectory && e.entryName.toLowerCase().endsWith('.csv')) || entries.find(e => !e.isDirectory);
  if (!csvEntry) throw new Error('ZIP retornado pela Comprovei nao possui arquivo CSV');
  return csvEntry.getData();
}
