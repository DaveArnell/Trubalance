import { formatCurrency } from '../../utils/format'
import {
  categoryDisplayName,
  destinationDisplayName,
  frequencyDisplayName,
} from '../../bankImport/categorize'
import { LOW_CONFIDENCE_CATEGORY_OPTIONS } from '../../content/guidedSetup'
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

interface BankImportSuggestionReviewProps {
  suggestions: BankImportSuggestion[]
  onUpdate: (id: string, patch: Partial<BankImportSuggestion>) => void
  onSetStatus: (id: string, status: ImportSuggestionStatus) => void
  compact?: boolean
}

export function BankImportSuggestionReview({
  suggestions,
  onUpdate,
  onSetStatus,
  compact = false,
}: BankImportSuggestionReviewProps) {
  if (suggestions.length === 0) {
    return <p className="muted">No patterns detected yet. Try uploading a longer statement.</p>
  }

  return (
    <div className={`bank-import-suggestion-list${compact ? ' bank-import-suggestion-list--compact' : ''}`}>
      {suggestions.map((suggestion) => {
        const lowConfidence = suggestion.confidence < LOW_CONFIDENCE_THRESHOLD
        const category = suggestion.category

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
                </p>
                {(suggestion.editedDestination ?? suggestion.destination) === 'reserve_bill' && (
                  <p className="bank-import-suggestion-tag">Suggested reserve planner item</p>
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
                  value={suggestion.editedDestination ?? suggestion.destination}
                  onChange={(event) =>
                    onUpdate(suggestion.id, {
                      editedDestination: event.target.value as SuggestionDestination,
                      status: 'edited',
                    })
                  }
                >
                  {(
                    ['commitment', 'reserve_bill', 'expected_receipt', 'ignore'] as SuggestionDestination[]
                  ).map((destination) => (
                    <option key={destination} value={destination}>
                      {destinationDisplayName(destination)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="bank-import-amount-hint muted">
                Typical {formatCurrency(suggestion.averageAmount)}
                {suggestion.amount !== suggestion.averageAmount
                  ? ` · max ${formatCurrency(suggestion.amount)}`
                  : ''}
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
  )
}

export function countAcceptedSuggestions(suggestions: BankImportSuggestion[]): number {
  return suggestions.filter((item) => {
    if (item.status !== 'accepted' && item.status !== 'edited') return false
    return (item.editedDestination ?? item.destination) !== 'ignore'
  }).length
}
