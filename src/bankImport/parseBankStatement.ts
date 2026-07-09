import { parseCsvText } from './parseCsv'
import { parsePdfBankStatement } from './parsePdf'

export const BANK_STATEMENT_ACCEPT = '.csv,text/csv,application/pdf,.pdf'

export function isPdfBankStatement(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.pdf') || file.type === 'application/pdf'
}

export async function parseBankStatementFile(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ headers: string[]; rows: string[][] }> {
  if (isPdfBankStatement(file)) {
    return parsePdfBankStatement(file, onProgress)
  }
  const text = await file.text()
  return parseCsvText(text)
}
