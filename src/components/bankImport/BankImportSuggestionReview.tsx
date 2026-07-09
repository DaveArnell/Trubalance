import { formatCurrency } from '../../utils/format'
import { MONTHS } from '../../utils/format'
import {
  categoryDisplayName,
  destinationDisplayName,
  frequencyDisplayName,
  normalizeDestination,
} from '../../bankImport/categorize'
import {
  LOW_CONFIDENCE_CATEGORY_OPTIONS,
  SUGGESTION_DESTINATION_OPTIONS,
} from '../../content/guidedSetup'
import type { ImportTrendInsight } from '../../bankImport/trendInsights'
import type {
  BankImportSuggestion,
  ImportSuggestionStatus,
  SuggestionCategory,
  SuggestionDestination,
} from '../../bankImport/types'

const LOW_CONFIDENCE_THRESHOLD = 60

function confidenceLabel(score: number): string {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Medium'
  return 'Low'
}

function dueMonthLabel(month?: number): string {
  if (!month || month < 1 || month > 12) return ''
  return MONTHS[month - 1]!
}

interface BankImportSuggestionReviewProps {
  suggestions: BankImportSuggestion[]
  onUpdate: (id: string, patch: Partial<BankImportSuggestion>) => void
  onSetStatus: (id: string, status: ImportSuggestionStatus) => void
  insights?: ImportTrendInsight[]
  compact?: boolean
}

export function BankImportInsightsPanel({ insights }: { insights: ImportTrendInsight[] }) {
  if (insights.length === 0) return null

  return (
    <aside className="bank-import-insights" aria-label="Trend insights">
      <h4 className="bank-import-insights-title">Trend insights</h4>
      <p className="muted bank-import-insights-lead">
        These are for your awareness only — they do not change your True Balance unless you
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
  compact = false,
}: BankImportSuggestionReviewProps) {
  if (suggestions.length === 0) {
    return <p className="muted">No patterns detected yet. Try uploading a longer statement.</p>
  }

  return (
    <>
      <BankImportInsightsPanel insights={insights} />
      <div className={`bank-import-suggestion-list${compact ? ' bank-import-suggestion-list--compact' : ''}`}>
        {suggestions.map((suggestion) => {
          const lowConfidence = suggestion.confidence < LOW_CONFIDENCE_THRESHOLD
          const category = suggestion.category
          const destination = normalizeDestination(
            suggestion.editedDestination ?? suggestion.destination,
          )
          const dueMonth = dueMonthLabel(suggestion.likelyDueMonth)

          return (
            <article
              key={suggestion.id}
              className={`bank-import-suggestion bank-import-suggestion--${suggestion.status}`}
            >
              <div className="bank-import-suggestion-head">
                <div>
                  <input
                    className="bank-import-name-input"
                    value={suggestion.editedName ?? suggestion.suggestedName}
                    onChange={(event) =>
                      onUpdate(suggestion.id, {
                        editedName: event.target.value,
                        status: 'edited',
                      })
                    }
                  />
                  <p className="bank-import-suggestion-meta muted">
                    {categoryDisplayName(category)} · {frequencyDisplayName(suggestion.frequency)}
                    {suggestion.likelyDueDay ? ` · around day ${suggestion.likelyDueDay}` : ''}
                    {dueMonth ? ` · likely ${dueMonth}` : ''}
                  </p>
                  {destination === 'building_commitment' && (
                    <p className="bank-import-suggestion-tag">Regular monthly outgoing</p>
                  )}
                </div>
                <div className="bank-import-confidence">
                  <span
                    className={`bank-import-confidence-pill bank-import-confidence-pill--${confidenceLabel(suggestion.confidence).toLowerCase()}`}
                  >
                    {confidenceLabel(suggestion.confidence)} · {suggestion.confidence}%
                  </span>
                </div>
              </div>

              <p className="bank-import-reason">{suggestion.reason}</p>
              {suggestion.sampleDescriptions.length > 0 && (
                <p className="muted bank-import-samples">
                  e.g. {suggestion.sampleDescriptions.join(' · ')}
                </p>
              )}

              {lowConfidence && (
                <label className="bank-import-field bank-import-field--category-pick">
                  <span>What is this?</span>
                  <select
                    className="bank-import-select"
                    value={category}
                    onChange={(event) =>
                      onUpdate(suggestion.id, {
                        category: event.target.value as SuggestionCategory,
                        status: 'edited',
                      })
                    }
                  >
                    {LOW_CONFIDENCE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="bank-import-suggestion-fields">
                <label className="bank-import-field bank-import-field--inline">
                  <span>Amount</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="bank-import-input"
                    value={suggestion.editedAmount ?? suggestion.averageAmount}
                    onChange={(event) =>
                      onUpdate(suggestion.id, {
                        editedAmount: Number(event.target.value),
                        status: 'edited',
                      })
                    }
                  />
                </label>
                <label className="bank-import-field bank-import-field--inline">
                  <span>Add as</span>
                  <select
                    className="bank-import-select"
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
                </label>
                <p className="bank-import-amount-hint muted">
                  Typical {formatCurrency(suggestion.averageAmount)}
                  {suggestion.amount !== suggestion.averageAmount
                    ? ` · max ${formatCurrency(suggestion.amount)}`
                    : ''}
                  {' · '}
                  {destinationDisplayName(destination)}
                </p>
              </div>

              <div className="bank-import-suggestion-actions">
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
                  Accept
                </button>
                <button
                  type="button"
                  className="btn-tiny btn-ghost"
                  onClick={() => onSetStatus(suggestion.id, 'ignored')}
                >
                  Ignore
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

export function countAcceptedSuggestions(suggestions: BankImportSuggestion[]): number {
  return suggestions.filter((item) => {
    if (item.status !== 'accepted' && item.status !== 'edited') return false
    return normalizeDestination(item.editedDestination ?? item.destination) !== 'ignore'
  }).length
}
