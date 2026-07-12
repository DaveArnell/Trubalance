import type { AccountImportResult } from './importCentre'
import { countParsedOutflows } from './inferAmounts'

export interface ImportAnalysisSummary {
  statementsAnalysed: number
  statementsSkipped: number
  transactionCount: number
  outflowCount: number
  suggestionCount: number
  pendingReviewCount: number
  skippedIgnored: number
}

export function summarizeImportAnalysis(results: AccountImportResult[]): ImportAnalysisSummary {
  const summary: ImportAnalysisSummary = {
    statementsAnalysed: 0,
    statementsSkipped: 0,
    transactionCount: 0,
    outflowCount: 0,
    suggestionCount: 0,
    pendingReviewCount: 0,
    skippedIgnored: 0,
  }

  for (const result of results) {
    if (result.skipped) {
      summary.statementsSkipped++
      continue
    }
    if (result.session.transactions.length === 0) continue

    summary.statementsAnalysed++
    summary.transactionCount += result.session.transactions.length
    summary.outflowCount += countParsedOutflows(result.session.transactions)

    for (const suggestion of result.session.suggestions) {
      summary.suggestionCount++
      if (suggestion.destination === 'ignore') {
        summary.skippedIgnored++
        continue
      }
      summary.pendingReviewCount++
    }
  }

  return summary
}

export function describeImportAnalysis(summary: ImportAnalysisSummary): string {
  if (summary.statementsAnalysed === 0 && summary.statementsSkipped === 0) {
    return 'No bank statements uploaded yet.'
  }

  if (summary.statementsAnalysed === 0) {
    return 'No statements were analysed. Upload a PDF or CSV export, or try demo data to see how it works.'
  }

  const parts = [
    `${summary.transactionCount} transaction${summary.transactionCount === 1 ? '' : 's'} read`,
    `${summary.suggestionCount} recurring pattern${summary.suggestionCount === 1 ? '' : 's'} found`,
  ]

  if (summary.pendingReviewCount > 0) {
    parts.push('review suggestions before adding anything')
  }

  return parts.join(' · ')
}
