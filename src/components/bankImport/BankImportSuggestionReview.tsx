import { normalizeDestination } from '../../bankImport/categorize'
import {
  isStatementImportGreen,
  type BankImportReviewSection,
  type BankImportSuggestion,
  type SuggestionDestination,
} from '../../bankImport/types'
import { SUGGESTION_DESTINATION_OPTIONS } from '../../content/guidedSetup'
import type { ImportTrendInsight } from '../../bankImport/trendInsights'

const SECTION_LABELS: Record<BankImportReviewSection, string> = {
  monthly_accruing: 'Monthly commitments',
  reserve_planner: 'Reserve Planner',
  expected_receipt: 'Possible expected receipts',
  manual_review: 'Needs your confirmation',
  excluded: 'Not imported',
}

const VISIBLE_SECTIONS: BankImportReviewSection[] = ['monthly_accruing', 'reserve_planner']

function lightTitle(green: boolean): string {
  return green
    ? 'High confidence — will be added. Click to hold for a check.'
    : 'To check — will not be added. Click to turn green and include it.'
}

function effectiveDueDay(suggestion: BankImportSuggestion): number | '' {
  const value = suggestion.editedDueDay ?? suggestion.likelyDueDay
  return value && value >= 1 && value <= 31 ? value : ''
}

function amountOf(suggestion: BankImportSuggestion): number {
  return suggestion.editedAmount ?? suggestion.averageAmount
}

function sortSectionItems(
  section: BankImportReviewSection,
  items: BankImportSuggestion[],
): BankImportSuggestion[] {
  const copy = [...items]
  if (section === 'monthly_accruing') {
    return copy.sort((a, b) => {
      const day = (effectiveDueDay(a) || 99) - (effectiveDueDay(b) || 99)
      if (day !== 0) return day
      return amountOf(b) - amountOf(a)
    })
  }
  if (section === 'reserve_planner') {
    return copy.sort((a, b) => {
      const light = Number(isStatementImportGreen(b)) - Number(isStatementImportGreen(a))
      if (light !== 0) return light
      return amountOf(b) - amountOf(a)
    })
  }
  return copy
}

interface BankImportSuggestionReviewProps {
  suggestions: BankImportSuggestion[]
  onUpdate: (id: string, patch: Partial<BankImportSuggestion>) => void
  insights?: ImportTrendInsight[]
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
  insights = [],
}: BankImportSuggestionReviewProps) {
  const grouped = VISIBLE_SECTIONS.map((section) => ({
    section,
    items: sortSectionItems(
      section,
      suggestions.filter((s) => (s.reviewSection ?? 'monthly_accruing') === section),
    ),
  })).filter((g) => g.items.length > 0)

  if (grouped.length === 0) {
    return (
      <p className="muted">
        No suggestions yet. Try a longer statement or check AI is connected in Settings.
      </p>
    )
  }

  return (
    <>
      <BankImportInsightsPanel insights={insights} />
      <div className="bank-import-status-legend">
        <p>
          <strong>🟢 High confidence</strong> — will be added.{' '}
          <strong>🟠 To check</strong> — will not be added. Click the light to switch. Only green
          is added.
        </p>
        <p className="muted">
          This is not every transaction. Only meaningful bills for this business — use the minimum
          amount to control how much is suggested. Best done once per business.
        </p>
      </div>
      {grouped.map(({ section, items }) => {
        const isReserve = section === 'reserve_planner'

        return (
          <section key={section} className="bank-import-review-section">
            <h4 className="bank-import-review-section-title">{SECTION_LABELS[section]}</h4>
            <div className="bank-import-table-wrap">
              <table className="bank-import-table">
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Name</th>
                    <th scope="col">Bank payee</th>
                    <th scope="col">{isReserve ? 'Due day' : 'Day of month'}</th>
                    {isReserve && <th scope="col">Due months</th>}
                    <th scope="col">Amount (£)</th>
                    <th scope="col">Add as</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((suggestion) => {
                    const destination = normalizeDestination(
                      suggestion.editedDestination ?? suggestion.destination,
                    )
                    const green = isStatementImportGreen(suggestion)
                    const bankPayee =
                      suggestion.bankPayee || suggestion.sampleDescriptions[0] || ''

                    return (
                      <tr
                        key={suggestion.id}
                        className={`bank-import-table-row bank-import-table-row--${green ? 'green' : 'orange'}`}
                      >
                        <td className="bank-import-table-status">
                          <button
                            type="button"
                            className="bank-import-light"
                            title={lightTitle(green)}
                            aria-label={lightTitle(green)}
                            onClick={() =>
                              onUpdate(suggestion.id, {
                                confidence: green ? 50 : 85,
                              })
                            }
                          >
                            {green ? '🟢' : '🟠'}
                          </button>
                        </td>
                        <td>
                          <input
                            className="bank-import-table-input bank-import-table-input--name"
                            value={suggestion.editedName ?? suggestion.suggestedName}
                            onChange={(event) =>
                              onUpdate(suggestion.id, {
                                editedName: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <span className="bank-import-table-payee" title={bankPayee}>
                            {bankPayee || '—'}
                          </span>
                        </td>
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
                              })
                            }}
                          />
                        </td>
                        {isReserve && (
                          <td>
                            <input
                              className="bank-import-table-input bank-import-table-input--months"
                              value={suggestion.dueMonthsLabel || ''}
                              placeholder="e.g. Mar, Jun, Sep, Dec"
                              onChange={(event) =>
                                onUpdate(suggestion.id, {
                                  dueMonthsLabel: event.target.value,
                                })
                              }
                            />
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
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="bank-import-table-select"
                            value={
                              destination === 'reserve_bill'
                                ? 'reserve_bill'
                                : 'building_commitment'
                            }
                            onChange={(event) => {
                              const next = event.target.value as SuggestionDestination
                              onUpdate(suggestion.id, {
                                editedDestination: next,
                                destination: next,
                                reviewSection:
                                  next === 'reserve_bill'
                                    ? 'reserve_planner'
                                    : 'monthly_accruing',
                                dueMonthsLabel:
                                  next === 'building_commitment'
                                    ? undefined
                                    : suggestion.dueMonthsLabel,
                              })
                            }}
                          >
                            {SUGGESTION_DESTINATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </>
  )
}

export function countAcceptedSuggestions(suggestions: BankImportSuggestion[]): number {
  return suggestions.filter((item) => {
    if (item.reviewSection !== 'monthly_accruing' && item.reviewSection !== 'reserve_planner') {
      return false
    }
    if (!isStatementImportGreen(item)) return false
    const destination = normalizeDestination(item.editedDestination ?? item.destination)
    return destination === 'building_commitment' || destination === 'reserve_bill'
  }).length
}
