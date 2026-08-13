import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CompactKpiStrip } from '../CompactKpiStrip'
import { TRY_IT_PAGE } from '../../content/tryItPage'
import { trackMetaCashPositionCheck } from '../../services/metaConversions'
import { formatCurrency, getCurrencySymbol } from '../../utils/format'
import { toAmount } from '../../utils/amounts'
import { newId } from '../../utils/id'
import {
  computeFreeCashPosition,
  formatDueInDays,
  type FreeOtherCostInput,
  type FreeRegularCostInput,
} from '../../utils/freeCashPositionCheck'

const ACCRUE_ACCENT = '#0d8f5b'
const DUE_ACCENT = '#c2410c'

type RegularDraft = {
  id: string
  name: string
  amount: string
  dueDay: string
}

type OtherDraft = {
  id: string
  name: string
  amount: string
}

function emptyRegular(): RegularDraft {
  return { id: newId(), name: '', amount: '', dueDay: '28' }
}

function emptyOther(): OtherDraft {
  return { id: newId(), name: '', amount: '' }
}

function regularDraftsToInputs(drafts: RegularDraft[]): FreeRegularCostInput[] {
  return drafts
    .map((d) => ({
      id: d.id,
      name: d.name.trim() || 'Monthly bill',
      amount: toAmount(d.amount),
      dueDayOfMonth: Number(d.dueDay) || 28,
    }))
    .filter((d) => d.amount > 0)
}

function otherDraftsToInputs(drafts: OtherDraft[]): FreeOtherCostInput[] {
  return drafts
    .map((d) => ({
      id: d.id,
      name: d.name.trim() || 'Other bill',
      amount: toAmount(d.amount),
    }))
    .filter((d) => d.amount > 0)
}

export function FreeCashPositionCheck() {
  const formId = useId()
  const [bankBalance, setBankBalance] = useState('')
  const [regularCosts, setRegularCosts] = useState<RegularDraft[]>([emptyRegular()])
  const [otherCosts, setOtherCosts] = useState<OtherDraft[]>([emptyOther()])
  const trackedRef = useRef(false)

  const result = useMemo(
    () =>
      computeFreeCashPosition({
        bankBalance: toAmount(bankBalance),
        regularCosts: regularDraftsToInputs(regularCosts),
        otherCosts: otherDraftsToInputs(otherCosts),
      }),
    [bankBalance, regularCosts, otherCosts],
  )

  const hasBank = toAmount(bankBalance) > 0
  const hasMeaningfulInput =
    hasBank && (result.regularCosts.length > 0 || result.otherCosts.length > 0)

  useEffect(() => {
    if (!hasMeaningfulInput || trackedRef.current) return
    trackedRef.current = true
    trackMetaCashPositionCheck({
      bankBalance: result.bankBalance,
      regularCostCount: result.regularCosts.length,
      regularAccruedTotal: result.regularAccruedTotal,
      otherCostCount: result.otherCosts.length,
      otherOwedTotal: result.otherOwedTotal,
      availableToday: result.availableToday,
    })
  }, [hasMeaningfulInput, result])

  const updateRegular = (id: string, patch: Partial<RegularDraft>) => {
    setRegularCosts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeRegular = (id: string) => {
    setRegularCosts((prev) =>
      prev.length <= 1 ? [emptyRegular()] : prev.filter((row) => row.id !== id),
    )
  }

  const updateOther = (id: string, patch: Partial<OtherDraft>) => {
    setOtherCosts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeOther = (id: string) => {
    setOtherCosts((prev) => (prev.length <= 1 ? [emptyOther()] : prev.filter((row) => row.id !== id)))
  }

  const symbol = getCurrencySymbol()

  const sortedRegularCosts = useMemo(() => {
    return [...regularCosts].sort((a, b) => {
      const ca = result.regularCosts.find((row) => row.id === a.id)
      const cb = result.regularCosts.find((row) => row.id === b.id)
      if (!ca && !cb) return 0
      if (!ca) return 1
      if (!cb) return -1
      if (ca.daysUntilDue !== cb.daysUntilDue) return ca.daysUntilDue - cb.daysUntilDue
      return ca.name.localeCompare(cb.name)
    })
  }, [regularCosts, result.regularCosts])

  return (
    <div className="try-it-tool">
      <div className="try-it-tool-inputs">
        <section className="try-it-bank" aria-labelledby={`${formId}-bank`}>
          <h2 id={`${formId}-bank`}>{TRY_IT_PAGE.bank.heading}</h2>
          <p className="try-it-section-lead">{TRY_IT_PAGE.bank.hint}</p>
          <label className="try-it-field try-it-field--hero">
            <span className="try-it-currency">{symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="25000"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              aria-label="Business bank balance today"
            />
          </label>
        </section>

        <section
          className="home-snap home-snap--wide try-it-app-panel"
          aria-labelledby={`${formId}-regular`}
        >
          <div className="home-dash home-dash--cards home-dash--accruing">
            <div className="home-dash-hero home-dash-hero--accruing">
              <p id={`${formId}-regular`} className="home-snap-label home-snap-label--teal">
                {TRY_IT_PAGE.regular.heading}
              </p>
              <div className="home-dash-kpis">
                <CompactKpiStrip
                  items={[
                    {
                      label: TRY_IT_PAGE.regular.kpiMonthly,
                      value: formatCurrency(result.regularMonthlyTotal),
                    },
                    {
                      label: TRY_IT_PAGE.regular.kpiAccrued,
                      value: formatCurrency(result.regularAccruedTotal),
                      emphasis: true,
                    },
                    {
                      label: 'Per day',
                      value: formatCurrency(result.regularDailyTotal),
                    },
                  ]}
                />
              </div>
            </div>

            <p className="try-it-panel-lead">{TRY_IT_PAGE.regular.lead}</p>
            <p className="try-it-examples muted">{TRY_IT_PAGE.regular.examplesHint}</p>

            <ul className="home-dash-cards home-dash-cards--bars try-it-bill-list">
              {sortedRegularCosts.map((cost) => {
                const computed = result.regularCosts.find((r) => r.id === cost.id)
                const progress = computed?.progress ?? 0
                return (
                  <li key={cost.id} className="home-accrue-row try-it-bill-row try-it-bill-row--accrue">
                    <div
                      className="home-accrue-row-fill"
                      style={{
                        width: `${Math.round(progress * 100)}%`,
                        background: ACCRUE_ACCENT,
                      }}
                      aria-hidden
                    />
                    <div className="try-it-bill-fields">
                      <label className="try-it-mini-field">
                        <span className="sr-only">{TRY_IT_PAGE.regular.nameLabel}</span>
                        <input
                          type="text"
                          value={cost.name}
                          placeholder={TRY_IT_PAGE.regular.namePlaceholder}
                          onChange={(e) => updateRegular(cost.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="try-it-mini-field try-it-mini-field--amount">
                        <span className="sr-only">{TRY_IT_PAGE.regular.amountLabel}</span>
                        <span className="try-it-mini-currency" aria-hidden>
                          {symbol}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cost.amount}
                          placeholder="3000"
                          onChange={(e) => updateRegular(cost.id, { amount: e.target.value })}
                        />
                      </label>
                      <label className="try-it-mini-field try-it-mini-field--day">
                        <span className="sr-only">{TRY_IT_PAGE.regular.dueDayLabel}</span>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={cost.dueDay}
                          aria-label="Due day of month"
                          onChange={(e) => updateRegular(cost.id, { dueDay: e.target.value })}
                        />
                      </label>
                      {regularCosts.length > 1 ? (
                        <button
                          type="button"
                          className="btn-ghost btn-tiny try-it-remove"
                          onClick={() => removeRegular(cost.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {computed ? (
                      <div className="try-it-bill-summary" aria-live="polite">
                        <span className="home-accrue-row-due">
                          {formatDueInDays(computed.daysUntilDue)}
                        </span>
                        <span className="home-accrue-row-amount">
                          <strong>{formatCurrency(computed.accrued)}</strong>
                          <span> / {formatCurrency(computed.fullAmount)}</span>
                        </span>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              className="btn-secondary try-it-add"
              onClick={() => setRegularCosts((prev) => [...prev, emptyRegular()])}
            >
              {TRY_IT_PAGE.regular.addLabel}
            </button>
          </div>
        </section>

        <section
          className="home-snap home-snap--wide try-it-app-panel"
          aria-labelledby={`${formId}-other`}
        >
          <div className="home-dash home-dash--cards try-it-dash--due">
            <div className="home-dash-hero try-it-dash-hero--due">
              <p id={`${formId}-other`} className="home-snap-label try-it-label--due">
                {TRY_IT_PAGE.other.heading}
              </p>
              <div className="home-dash-kpis">
                <CompactKpiStrip
                  items={[
                    {
                      label: TRY_IT_PAGE.other.kpiTotal,
                      value: formatCurrency(result.otherOwedTotal),
                      emphasis: true,
                    },
                  ]}
                />
              </div>
            </div>

            <p className="try-it-panel-lead">{TRY_IT_PAGE.other.lead}</p>
            <p className="try-it-examples muted">{TRY_IT_PAGE.other.examplesHint}</p>

            <ul className="home-dash-cards home-dash-cards--bars try-it-bill-list">
              {otherCosts.map((cost) => {
                const computed = result.otherCosts.find((r) => r.id === cost.id)
                return (
                  <li key={cost.id} className="home-accrue-row try-it-bill-row try-it-bill-row--due">
                    <div
                      className="home-accrue-row-fill"
                      style={{
                        width: computed ? '100%' : '0%',
                        background: DUE_ACCENT,
                      }}
                      aria-hidden
                    />
                    <div className="try-it-bill-fields">
                      <label className="try-it-mini-field">
                        <span className="sr-only">{TRY_IT_PAGE.other.nameLabel}</span>
                        <input
                          type="text"
                          value={cost.name}
                          placeholder={TRY_IT_PAGE.other.namePlaceholder}
                          onChange={(e) => updateOther(cost.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="try-it-mini-field try-it-mini-field--amount">
                        <span className="sr-only">{TRY_IT_PAGE.other.amountLabel}</span>
                        <span className="try-it-mini-currency" aria-hidden>
                          {symbol}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cost.amount}
                          placeholder="1500"
                          onChange={(e) => updateOther(cost.id, { amount: e.target.value })}
                        />
                      </label>
                      {otherCosts.length > 1 ? (
                        <button
                          type="button"
                          className="btn-ghost btn-tiny try-it-remove"
                          onClick={() => removeOther(cost.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {computed ? (
                      <div className="try-it-bill-summary" aria-live="polite">
                        <span className="home-accrue-row-due">Deduct in full</span>
                        <span className="home-accrue-row-amount try-it-amount--owed">
                          <strong>− {formatCurrency(computed.owed)}</strong>
                        </span>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              className="btn-secondary try-it-add"
              onClick={() => setOtherCosts((prev) => [...prev, emptyOther()])}
            >
              {TRY_IT_PAGE.other.addLabel}
            </button>
          </div>
        </section>
      </div>

      {(hasBank || hasMeaningfulInput) && (
      <section
        className={`try-it-result${hasMeaningfulInput ? '' : ' try-it-result--guide'}`}
        aria-labelledby={`${formId}-result`}
        aria-live="polite"
      >
        <h2 id={`${formId}-result`} className="sr-only">
          What is actually yours today
        </h2>
        {!hasMeaningfulInput ? (
          <div className="try-it-result-guide">
            <p className="try-it-result-guide-title">Your bank balance</p>
            <p className="try-it-figure try-it-figure--guide">{formatCurrency(result.bankBalance)}</p>
            <p className="try-it-result-hint">{TRY_IT_PAGE.regular.empty}</p>
          </div>
        ) : (
          <div className="try-it-result-stack">
            <div className="try-it-result-row">
              <span>{TRY_IT_PAGE.result.bankLabel}</span>
              <strong className="try-it-figure">{formatCurrency(result.bankBalance)}</strong>
            </div>
            <div className="try-it-result-row try-it-result-row--spoken">
              <span>{TRY_IT_PAGE.result.accruedLabel}</span>
              <strong className="try-it-figure">
                {result.regularAccruedTotal > 0
                  ? `− ${formatCurrency(result.regularAccruedTotal)}`
                  : formatCurrency(0)}
              </strong>
            </div>
            <div className="try-it-result-row try-it-result-row--spoken">
              <span>{TRY_IT_PAGE.result.otherLabel}</span>
              <strong className="try-it-figure">
                {result.otherOwedTotal > 0
                  ? `− ${formatCurrency(result.otherOwedTotal)}`
                  : formatCurrency(0)}
              </strong>
            </div>
            <div className="try-it-result-row try-it-result-row--available">
              <span>{TRY_IT_PAGE.result.availableLabel}</span>
              <strong className="try-it-figure">{formatCurrency(result.availableToday)}</strong>
            </div>
          </div>
        )}
      </section>
      )}
    </div>
  )
}
