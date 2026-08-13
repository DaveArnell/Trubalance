import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { TRY_IT_PAGE } from '../../content/tryItPage'
import { trackMetaCashPositionCheck } from '../../services/metaConversions'
import { formatCurrency, getCurrencySymbol } from '../../utils/format'
import { toAmount } from '../../utils/amounts'
import { newId } from '../../utils/id'
import {
  computeFreeCashPosition,
  formatDueInDays,
  type FreeRegularCostInput,
} from '../../utils/freeCashPositionCheck'

type CostDraft = {
  id: string
  name: string
  amount: string
  dueDay: string
}

function emptyCost(): CostDraft {
  return { id: newId(), name: '', amount: '', dueDay: '28' }
}

function draftsToInputs(drafts: CostDraft[]): FreeRegularCostInput[] {
  return drafts
    .map((d) => ({
      id: d.id,
      name: d.name.trim() || 'Regular cost',
      amount: toAmount(d.amount),
      dueDayOfMonth: Number(d.dueDay) || 28,
    }))
    .filter((d) => d.amount > 0)
}

export function FreeCashPositionCheck() {
  const formId = useId()
  const [bankBalance, setBankBalance] = useState('')
  const [costs, setCosts] = useState<CostDraft[]>([emptyCost()])
  const [annualIrregular, setAnnualIrregular] = useState('')
  const trackedRef = useRef(false)

  const result = useMemo(
    () =>
      computeFreeCashPosition({
        bankBalance: toAmount(bankBalance),
        regularCosts: draftsToInputs(costs),
        annualIrregular: toAmount(annualIrregular),
      }),
    [bankBalance, costs, annualIrregular],
  )

  const hasBank = toAmount(bankBalance) > 0
  const hasMeaningfulInput =
    hasBank && (result.regularCosts.length > 0 || result.annualIrregular > 0)

  useEffect(() => {
    if (!hasMeaningfulInput || trackedRef.current) return
    trackedRef.current = true
    trackMetaCashPositionCheck({
      bankBalance: result.bankBalance,
      regularCostCount: result.regularCosts.length,
      regularAccruedTotal: result.regularAccruedTotal,
      annualIrregular: result.annualIrregular,
      availableToday: result.availableToday,
    })
  }, [hasMeaningfulInput, result])

  const updateCost = (id: string, patch: Partial<CostDraft>) => {
    setCosts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeCost = (id: string) => {
    setCosts((prev) => (prev.length <= 1 ? [emptyCost()] : prev.filter((row) => row.id !== id)))
  }

  const symbol = getCurrencySymbol()
  const provisionText = TRY_IT_PAGE.result.provisionBody
    .replace('{monthly}', formatCurrency(result.monthlyProvision))
    .replace('{daily}', formatCurrency(result.dailyProvision))

  return (
    <div className="try-it-tool">
      <div className="try-it-tool-inputs">
      <section className="try-it-section try-it-section--bank" aria-labelledby={`${formId}-bank`}>
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

      <section className="try-it-section" aria-labelledby={`${formId}-regular`}>
        <h2 id={`${formId}-regular`}>{TRY_IT_PAGE.regular.heading}</h2>
        <p className="try-it-section-lead">{TRY_IT_PAGE.regular.lead}</p>
        <p className="try-it-examples muted">{TRY_IT_PAGE.regular.examplesHint}</p>

        <ul className="try-it-cost-list">
          {costs.map((cost, index) => {
            const computed = result.regularCosts.find((r) => r.id === cost.id)
            return (
              <li key={cost.id} className="try-it-cost-card">
                <div className="try-it-cost-card-head">
                  <span className="try-it-cost-index">Cost {index + 1}</span>
                  {costs.length > 1 ? (
                    <button
                      type="button"
                      className="btn-ghost btn-tiny"
                      onClick={() => removeCost(cost.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="try-it-cost-fields">
                  <label className="try-it-field">
                    <span>{TRY_IT_PAGE.regular.nameLabel}</span>
                    <input
                      type="text"
                      value={cost.name}
                      placeholder={TRY_IT_PAGE.regular.namePlaceholder}
                      onChange={(e) => updateCost(cost.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="try-it-field">
                    <span>{TRY_IT_PAGE.regular.amountLabel}</span>
                    <span className="try-it-field-inline">
                      <span className="try-it-currency" aria-hidden>
                        {symbol}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cost.amount}
                        placeholder="3000"
                        onChange={(e) => updateCost(cost.id, { amount: e.target.value })}
                      />
                    </span>
                  </label>
                  <label className="try-it-field">
                    <span>{TRY_IT_PAGE.regular.dueDayLabel}</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={cost.dueDay}
                      onChange={(e) => updateCost(cost.id, { dueDay: e.target.value })}
                    />
                  </label>
                </div>
                {computed ? (
                  <div className="try-it-cost-accrual" aria-live="polite">
                    <strong>{computed.name}</strong>
                    <span>{formatCurrency(computed.fullAmount)} full bill</span>
                    <span>{formatDueInDays(computed.daysUntilDue)}</span>
                    <span className="try-it-cost-accrued">
                      {formatCurrency(computed.accrued)} accrued so far
                    </span>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setCosts((prev) => [...prev, emptyCost()])}
        >
          {TRY_IT_PAGE.regular.addLabel}
        </button>
      </section>

      <section className="try-it-section" aria-labelledby={`${formId}-irregular`}>
        <h2 id={`${formId}-irregular`}>{TRY_IT_PAGE.irregular.heading}</h2>
        <p className="try-it-section-lead">{TRY_IT_PAGE.irregular.lead}</p>
        <label className="try-it-field">
          <span>{TRY_IT_PAGE.irregular.question}</span>
          <span className="try-it-field-inline try-it-field-inline--wide">
            <span className="try-it-currency" aria-hidden>
              {symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="12000"
              value={annualIrregular}
              onChange={(e) => setAnnualIrregular(e.target.value)}
            />
          </span>
        </label>
        <p className="try-it-examples muted">{TRY_IT_PAGE.irregular.examplesHint}</p>
        <p className="muted try-it-section-note">{TRY_IT_PAGE.irregular.hint}</p>
      </section>
      </div>

      <section className="try-it-result" aria-labelledby={`${formId}-result`} aria-live="polite">
        <h2 id={`${formId}-result`} className="sr-only">
          Your available position
        </h2>
        {!hasBank ? (
          <p className="try-it-result-empty">{TRY_IT_PAGE.result.emptyBank}</p>
        ) : (
          <>
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
              <div className="try-it-result-row try-it-result-row--available">
                <span>{TRY_IT_PAGE.result.availableLabel}</span>
                <strong className="try-it-figure">{formatCurrency(result.availableToday)}</strong>
              </div>
            </div>

            {result.annualIrregular > 0 ? (
              <div className="try-it-provision">
                <h3>{TRY_IT_PAGE.result.provisionHeading}</h3>
                <p>{provisionText}</p>
              </div>
            ) : null}

            {result.regularCosts.length === 0 && result.annualIrregular <= 0 ? (
              <p className="muted try-it-result-hint">{TRY_IT_PAGE.regular.empty}</p>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
