import { useMemo, useRef, useState } from 'react'
import type { AppState, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { calculateDailyTradingEstimate } from '../bankImport/dailyIncome'
import {
  guessColumnMapping,
  mapRowsToTransactions,
} from '../bankImport/parseCsv'
import { BANK_STATEMENT_ACCEPT, parseBankStatementFile } from '../bankImport/parseBankStatement'
import type { BankImportColumnMapping } from '../bankImport/types'
import { formatCurrency } from '../utils/format'
import { getSteadyBusinessesForScope, getForecastDailyIncomeForScope } from '../utils/forwardCashFlow'
import { formatProjectionDateLabel } from '../utils/trendProjection'

interface ForecastDailyIncomeCardProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<AppActions, 'setBusinessForecastDailyIncome'>
  compact?: boolean
}

export function ForecastDailyIncomeCard({
  state,
  viewScope,
  actions,
  compact = false,
}: ForecastDailyIncomeCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const targetBusinessRef = useRef<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  const steadyBusinesses = useMemo(
    () => getSteadyBusinessesForScope(state, viewScope),
    [state.businesses, viewScope],
  )
  const totalDailyNet = useMemo(
    () => getForecastDailyIncomeForScope(state, viewScope),
    [state.businesses, viewScope],
  )

  if (steadyBusinesses.length === 0) {
    if (compact) {
      return (
        <p className="forecast-daily-income-inline-muted muted">
          Set income pattern to steady / daily in Settings → Structure to model day-to-day trading.
        </p>
      )
    }
    return (
      <div className="forecast-daily-income-card forecast-daily-income-card--muted">
        <h3 className="forecast-daily-income-title">Day-to-day trading</h3>
        <p className="muted">
          Set income pattern to steady / daily in Settings → Structure to model day-to-day trading on this outlook.
        </p>
      </div>
    )
  }

  const applyCalculatedTrading = (
    businessId: string,
    mapping: BankImportColumnMapping,
    rows: string[][],
  ) => {
    const transactions = mapRowsToTransactions(rows, mapping)
    const estimate = calculateDailyTradingEstimate(transactions)
    if (estimate.averageDailyNetTrading === 0 && estimate.totalInflow === 0) {
      setUploadError('No transactions found in that file.')
      return
    }
    actions.setBusinessForecastDailyIncome(businessId, estimate.averageDailyNetTrading)
    const spanLabel =
      estimate.startDate && estimate.endDate
        ? `${formatProjectionDateLabel(estimate.startDate)} to ${formatProjectionDateLabel(estimate.endDate)} (${estimate.daySpan} days)`
        : `${estimate.daySpan} days`
    setUploadSummary(
      compact
        ? `Net ${formatCurrency(estimate.averageDailyNetTrading)}/day from ${spanLabel}.`
        : `From ${spanLabel}: in ${formatCurrency(estimate.averageDailyIncome)}/day, other out ${formatCurrency(estimate.averageDailyOtherOutgoings)}/day → net ${formatCurrency(estimate.averageDailyNetTrading)}/day on the cash line. Big regular bills are separate.`,
    )
    setUploadError(null)
  }

  const handleFile = async (file: File | undefined, businessId: string) => {
    if (!file) return
    setReading(true)
    setUploadSummary(null)
    try {
      const parsed = await parseBankStatementFile(file)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setUploadError('That file looks empty.')
        return
      }
      const mapping = guessColumnMapping(parsed.headers)
      applyCalculatedTrading(businessId, mapping, parsed.rows)
    } catch {
      setUploadError('Could not read that file.')
    } finally {
      setReading(false)
    }
  }

  if (compact) {
    return (
      <div className="forecast-daily-income-inline">
        <input
          ref={fileInputRef}
          type="file"
          accept={BANK_STATEMENT_ACCEPT}
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            const businessId = targetBusinessRef.current
            if (!businessId) return
            await handleFile(file, businessId)
          }}
        />
        <p className="forecast-daily-income-inline-label">
          Net day-to-day margin
          {steadyBusinesses.length > 1 ? (
            <span className="forecast-daily-income-inline-total muted">
              {' '}
              · combined {formatCurrency(totalDailyNet)}/day
            </span>
          ) : null}
        </p>
        <div className="forecast-daily-income-inline-controls">
          {steadyBusinesses.map((business) => (
            <div key={business.id} className="forecast-daily-income-inline-row">
              {steadyBusinesses.length > 1 ? (
                <span className="forecast-daily-income-inline-business">{business.name}</span>
              ) : null}
              <div className="forecast-daily-income-input-row forecast-daily-income-input-row--compact">
                <span className="forecast-daily-income-prefix">£</span>
                <input
                  type="number"
                  step={0.01}
                  inputMode="decimal"
                  value={business.forecastDailyIncome ?? ''}
                  placeholder="0"
                  aria-label={
                    steadyBusinesses.length > 1
                      ? `${business.name} net day-to-day margin`
                      : 'Net day-to-day margin per day'
                  }
                  onChange={(event) => {
                    const raw = event.target.value
                    if (raw === '') {
                      actions.setBusinessForecastDailyIncome(business.id, null)
                      return
                    }
                    const parsed = Number(raw)
                    if (Number.isFinite(parsed)) {
                      actions.setBusinessForecastDailyIncome(business.id, parsed)
                    }
                  }}
                />
                <span className="forecast-daily-income-suffix">/day</span>
              </div>
              <button
                type="button"
                className="btn-ghost btn-tiny"
                disabled={reading}
                title="Calculate from bank CSV"
                onClick={() => {
                  targetBusinessRef.current = business.id
                  setUploadError(null)
                  setUploadSummary(null)
                  fileInputRef.current?.click()
                }}
              >
                {reading && targetBusinessRef.current === business.id ? '…' : 'CSV'}
              </button>
            </div>
          ))}
        </div>
        <p className="forecast-daily-income-inline-hint muted">
          Baked into the cash outlook line — not shown as daily movements. Big bills stay separate.
        </p>
        {uploadError ? (
          <p className="bank-import-error" role="alert">
            {uploadError}
          </p>
        ) : null}
        {uploadSummary ? <p className="bank-import-success">{uploadSummary}</p> : null}
      </div>
    )
  }

  return (
    <div className="forecast-daily-income-card">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          const businessId = targetBusinessRef.current
          if (!businessId) return
          await handleFile(file, businessId)
        }}
      />
      <div className="forecast-daily-income-head">
        <h3 className="forecast-daily-income-title">Day-to-day trading</h3>
        {steadyBusinesses.length > 1 ? (
          <p className="forecast-daily-income-total muted">
            Combined: <strong>{formatCurrency(totalDailyNet)}</strong> / day
          </p>
        ) : null}
      </div>
      <p className="forecast-daily-income-lead muted">
        Average daily takings minus smaller day-to-day costs. Big regular bills are separate.
      </p>

      <div className="forecast-daily-income-list">
        {steadyBusinesses.map((business) => (
          <div key={business.id} className="forecast-daily-income-row">
            <label className="forecast-daily-income-field">
              <span>
                {steadyBusinesses.length > 1 ? `${business.name} · net / day` : 'Net day-to-day margin'}
              </span>
              <div className="forecast-daily-income-input-row">
                <span className="forecast-daily-income-prefix">£</span>
                <input
                  type="number"
                  step={0.01}
                  inputMode="decimal"
                  value={business.forecastDailyIncome ?? ''}
                  placeholder="0.00"
                  onChange={(event) => {
                    const raw = event.target.value
                    if (raw === '') {
                      actions.setBusinessForecastDailyIncome(business.id, null)
                      return
                    }
                    const parsed = Number(raw)
                    if (Number.isFinite(parsed)) {
                      actions.setBusinessForecastDailyIncome(business.id, parsed)
                    }
                  }}
                />
                <span className="forecast-daily-income-suffix">/ day</span>
              </div>
            </label>
            <div className="forecast-daily-income-upload">
              <button
                type="button"
                className="btn-secondary btn-tiny"
                disabled={reading}
                onClick={() => {
                  targetBusinessRef.current = business.id
                  setUploadError(null)
                  setUploadSummary(null)
                  fileInputRef.current?.click()
                }}
              >
                {reading && targetBusinessRef.current === business.id ? 'Reading…' : 'CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {uploadError ? (
        <p className="bank-import-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      {uploadSummary ? <p className="bank-import-success">{uploadSummary}</p> : null}
    </div>
  )
}
