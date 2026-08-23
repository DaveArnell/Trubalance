import { normalizeDestination } from '../../bankImport/categorize'
import { SUGGESTION_DESTINATION_OPTIONS } from '../../content/guidedSetup'
import type { ImportTrendInsight } from '../../bankImport/trendInsights'
import type {
  BankImportSuggestion,
  BankImportReviewSection,
  ImportSuggestionStatus,
  SuggestionDestination,
} from '../../bankImport/types'

const SECTION_LABELS: Record<BankImportReviewSection, string> = {
  monthly_accruing: 'Monthly commitments',
  reserve_planner: 'Reserve Planner',
  expected_receipt: 'Possible expected receipts',
  manual_review: 'Needs your confirmation',
  excluded: 'Not imported',
}

const SECTION_ORDER: BankImportReviewSection[] = [
  'monthly_accruing',
  'reserve_planner',
  'expected_receipt',
  'manual_review',
  'excluded',
]

function statusMark(suggestion: BankImportSuggestion): { symbol: string; title: string } {
  if (suggestion.confidence >= 80) return { symbol: '🟢', title: 'Consistent — enter' }
  if (suggestion.confidence >= 55) return { symbol: '🟠', title: 'Estimated — enter then check' }
  return { symbol: '🔴', title: 'Draft — decide before trusting' }
}

function effectiveDueDay(suggestion: BankImportSuggestion): number | '' {
  const value = suggestion.editedDueDay ?? suggestion.likelyDueDay
  return value && value >= 1 && value <= 31 ? value : ''
}

interface BankImportSuggestionReviewProps {
  suggestions: BankImportSuggestion[]
  onUpdate: (id: string, patch: Partial<BankImportSuggestion>) => void
  onSetStatus: (id: string, status: ImportSuggestionStatus) => void
  insights?: ImportTrendInsight[]
  /** DIY “Confirm these first” advisory bullets — not editable rows. */
  confirmNotes?: string[]
  compact?: boolean
}

export function BankImportInsightsPanel({ insights }: { insights: ImportTrendInsight[] }) {
  if (insights.length === 0) return null

  return (
    <aside className="bank-import-insights" aria-label="Trend insights">
      <h4 className="bank-import-insights-title">Trend insights</h4>
      <p className="muted bank-import-insights-lead">
        These are for your awareness only — they do not change your Available number unless you
        accept a suggestion.
      </p>
      <ul className="bank-import-insights-list">
        {insights.map((insight) => (
          <li key={insight.id}>{insight.message}</li>
        ))}
      </ul>
    </aside>
  )
}

export function BankImportSuggestionReview({
  suggestions,
  onUpdate,
  onSetStatus,
  insights = [],
  confirmNotes = [],
}: BankImportSuggestionReviewProps) {
  if (suggestions.length === 0 && confirmNotes.length === 0) {
    return (
      <p className="muted">
        No suggestions yet. Try a longer statement or check AI is connected in Settings.
      </p>
    )
  }

  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: suggestions.filter((s) => (s.reviewSection ?? 'monthly_accruing') === section),
  })).filter((g) => {
    if (g.section === 'manual_review') {
      // Hide the old blank Confirm / £0 rows — notes render separately.
      return g.items.some((item) => {
        const name = (item.editedName ?? item.suggestedName).trim()
        return name.length > 0 && !/^confirm$/i.test(name) && (item.averageAmount > 0 || item.amount > 0)
      })
    }
    return g.items.length > 0
  })

  return (
    <>
      <BankImportInsightsPanel insights={insights} />
      <p className="muted bank-import-status-legend">
        🟢 enter · 🟠 enter then check · 🔴 decide before trusting
      </p>
      {confirmNotes.length > 0 ? (
        <aside className="bank-import-confirm-notes" aria-label="Confirm these first">
          <h4 className="bank-import-review-section-title">Confirm these first</h4>
          <ul>
            {confirmNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </aside>
      ) : null}
      {grouped.map(({ section, items }) => {
        const isMonthly = section === 'monthly_accruing'
        const isReserve = section === 'reserve_planner'
        const isExcluded = section === 'excluded'
        const showDay = isMonthly || isReserve || section === 'expected_receipt'

        return (
          <section key={section} className="bank-import-review-section">
            <h4 className="bank-import-review-section-title">{SECTION_LABELS[section]}</h4>
            <div className="bank-import-table-wrap">
              <table className={`bank-import-table${isExcluded ? ' bank-import-table--excluded' : ''}`}>
                <thead>
                  <tr>
                    {!isExcluded && <th scope="col">Status</th>}
                    <th scope="col">{isExcluded ? 'Bank payee' : 'Name'}</th>
                    {!isExcluded && <th scope="col">Bank payee</th>}
                    {showDay && (
                      <th scope="col">{isReserve ? 'Due day' : 'Day of month'}</th>
                    )}
                    {isReserve && <th scope="col">Due months</th>}
                    {!isExcluded && <th scope="col">Amount (£)</th>}
                    {!isExcluded && <th scope="col">Add as</th>}
                    <th scope="col">{isExcluded ? 'Why excluded' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((suggestion) => {
                    const destination = normalizeDestination(
                      suggestion.editedDestination ?? suggestion.destination,
                    )
                    const mark = statusMark(suggestion)
                    const bankPayee =
                      suggestion.bankPayee ||
                      suggestion.sampleDescriptions[0] ||
                      ''

                    if (isExcluded) {
                      return (
                        <tr key={suggestion.id} className="bank-import-table-row--excluded">
                          <td>{suggestion.suggestedName}</td>
                          <td className="muted">{suggestion.reason}</td>
                        </tr>
                      )
                    }

                    return (
                      <tr
                        key={suggestion.id}
                        className={`bank-import-table-row bank-import-table-row--${suggestion.status}`}
                      >
                        <td className="bank-import-table-status" title={mark.title}>
                          <span aria-label={mark.title}>{mark.symbol}</span>
                        </td>
                        <td>
                          <input
                            className="bank-import-table-input bank-import-table-input--name"
                            value={suggestion.editedName ?? suggestion.suggestedName}
                            onChange={(event) =>
                              onUpdate(suggestion.id, {
                                editedName: event.target.value,
                                status: 'edited',
                              })
                            }
                          />
                        </td>
                        <td>
                          <span className="bank-import-table-payee" title={bankPayee}>
                            {bankPayee || '—'}
                          </span>
                        </td>
                        {showDay && (
                          <td>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              className="bank-import-table-input bank-import-table-input--day"
                              value={effectiveDueDay(suggestion)}
                              onChange={(event) => {
                                const parsed = Number(event.target.value)
                                onUpdate(suggestion.id, {
                                  editedDueDay:
                                    Number.isFinite(parsed) && parsed >= 1 && parsed <= 31
                                      ? Math.round(parsed)
                                      : undefined,
                                  status: 'edited',
                                })
                              }}
                            />
                          </td>
                        )}
                        {isReserve && (
                          <td>
                            <span className="bank-import-table-months">
                              {suggestion.dueMonthsLabel || '—'}
                            </span>
                          </td>
                        )}
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="bank-import-table-input bank-import-table-input--amount"
                            value={suggestion.editedAmount ?? suggestion.averageAmount}
                            onChange={(event) =>
                              onUpdate(suggestion.id, {
                                editedAmount: Number(event.target.value),
                                status: 'edited',
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="bank-import-table-select"
                            value={destination}
                            onChange={(event) =>
                              onUpdate(suggestion.id, {
                                editedDestination: event.target.value as SuggestionDestination,
                                status: 'edited',
                              })
                            }
                          >
                            {SUGGESTION_DESTINATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="bank-import-table-actions">
                          <button
                            type="button"
                            className={`btn-tiny${suggestion.status === 'accepted' || suggestion.status === 'edited' ? ' btn-primary' : ' btn-secondary'}`}
                            onClick={() =>
                              onSetStatus(
                                suggestion.id,
                                suggestion.status === 'edited' ? 'edited' : 'accepted',
                              )
                            }
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            className="btn-tiny btn-ghost"
                            onClick={() => onSetStatus(suggestion.id, 'ignored')}
                          >
                            Ignore
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!isExcluded && items.some((s) => s.status === 'ignored') ? (
              <p className="muted bank-import-ignored-hint">
                Ignored rows stay listed until you add — they will not be imported.
              </p>
            ) : null}
          </section>
        )
      })}
    </>
  )
}

export function countAcceptedSuggestions(suggestions: BankImportSuggestion[]): number {
  return suggestions.filter((item) => {
    if (item.reviewSection === 'excluded') return false
    if (item.status !== 'accepted' && item.status !== 'edited') return false
    return normalizeDestination(item.editedDestination ?? item.destination) !== 'ignore'
  }).length
}
