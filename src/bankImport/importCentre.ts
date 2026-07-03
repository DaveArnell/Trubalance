import type { BankImportSession, BankImportSuggestion } from './types'
import type { ImportTrendInsight } from './trendInsights'
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
  /** Rule-based or AI insights — informational only. */
  insights?: ImportTrendInsight[]
  skipped?: boolean
}

export interface ImportCentreRun {
  id: string
  source: ImportCentreSource
  startedAt: string
  accountImports: AccountImportResult[]
}

/** Future Import Centre: diff types when re-importing after onboarding. */
export type ImportCentreChangeKind =
  | 'new_recurring'
  | 'removed_recurring'
  | 'amount_changed'
  | 'update_commitment'
  | 'update_reserve_bill'

export interface ImportCentreSuggestedChange {
  kind: ImportCentreChangeKind
  suggestion: BankImportSuggestion
  /** Existing commitment or reserve bill id when updating. */
  existingItemId?: string
  message: string
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

export function mergeAccountImportInsights(imports: AccountImportResult[]): ImportTrendInsight[] {
  const seen = new Set<string>()
  return imports
    .flatMap((item) => item.insights ?? [])
    .filter((insight) => {
      if (seen.has(insight.message)) return false
      seen.add(insight.message)
      return true
    })
}
