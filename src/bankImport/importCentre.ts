import type { BankImportSession, BankImportSuggestion } from './types'
import { mergeImportSuggestions } from './mergeSuggestions'

/**
 * Shared import session model for onboarding and a future Import Centre.
 * Onboarding and periodic re-import both produce AccountImportResult entries
 * that merge into a single review surface — never auto-apply.
 */
export type ImportCentreSource = 'onboarding' | 'import-centre'

export interface AccountImportResult {
  accountId: string
  fileName: string
  session: Pick<
    BankImportSession,
    'transactions' | 'suggestions' | 'scopeLevel' | 'scopeId'
  >
  skipped?: boolean
}

export interface ImportCentreRun {
  id: string
  source: ImportCentreSource
  startedAt: string
  accountImports: AccountImportResult[]
}

export function createImportCentreRun(source: ImportCentreSource): ImportCentreRun {
  return {
    id: `import-${Date.now()}`,
    source,
    startedAt: new Date().toISOString(),
    accountImports: [],
  }
}

export function mergeAccountImportSuggestions(imports: AccountImportResult[]): BankImportSuggestion[] {
  const all = imports.flatMap((item) => item.session.suggestions)
  return mergeImportSuggestions(all)
}
