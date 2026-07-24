import { METHOD_WORKED_EXAMPLE } from '../../content/trueBalanceMethod'

/** Visual calculation flow for the Method page — each adjustment on its own row. */
export function MethodWorkedExample() {
  const ex = METHOD_WORKED_EXAMPLE

  const rows = [
    {
      tone: 'bank' as const,
      op: null as string | null,
      label: 'Bank balance',
      hint: 'What is in the account today',
      value: ex.bankBalance,
    },
    {
      tone: 'out' as const,
      op: '−',
      label: 'Monthly costs accrued',
      hint: 'Payroll, rent, utilities, and planned or one-off costs you add',
      value: ex.monthlyAccrued,
    },
    {
      tone: 'out' as const,
      op: '−',
      label: 'Monthly reserve transfer',
      hint: 'What you move into the reserve savings account each month',
      value: ex.reservesBuilding,
    },
    {
      tone: 'in' as const,
      op: '+',
      label: 'Expected receipts',
      hint: 'Money you are realistically still owed',
      value: ex.expectedReceipts,
    },
    {
      tone: 'true' as const,
      op: '=',
      label: 'Available Balance',
      hint: 'What you can work with after commitments',
      value: ex.trueBalance,
    },
  ]

  return (
    <div
      className="method-worked-example"
      role="img"
      aria-label={`Cash Prophet Available Balance worked example: bank ${ex.bankBalance}, minus monthly costs accrued ${ex.monthlyAccrued}, minus monthly reserve transfer ${ex.reservesBuilding}, plus expected receipts ${ex.expectedReceipts}, equals Available Balance ${ex.trueBalance}`}
    >
      {rows.map((row) => (
        <div key={row.label} className={`method-worked-example-row method-worked-example-row--${row.tone}`}>
          {row.op ? (
            <span className="method-worked-example-op" aria-hidden>
              {row.op}
            </span>
          ) : (
            <span className="method-worked-example-op method-worked-example-op--spacer" aria-hidden />
          )}
          <div className="method-worked-example-copy">
            <p className="method-worked-example-label">{row.label}</p>
            <p className="method-worked-example-hint">{row.hint}</p>
          </div>
          <p className="method-worked-example-value">{row.value}</p>
        </div>
      ))}
    </div>
  )
}
