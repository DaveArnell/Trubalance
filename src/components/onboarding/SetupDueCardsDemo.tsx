import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

/**
 * Static Due example — section labels teach the types; cards stay clean.
 */
export function SetupDueCardsDemo() {
  return (
    <div className="setup-edu-visual setup-edu-visual--cards">
      <div className="setup-edu-card-demo setup-edu-due-demo">
        <div className="setup-edu-due-demo-head">
          <p className="setup-edu-card-demo-label">Due</p>
          <p className="setup-edu-due-demo-total">TOTAL {formatCurrency(20900)}</p>
        </div>
        <MobileRecordList>
          <MobileSectionLabel>Monthly bill — due now</MobileSectionLabel>
          <MobileRecordCard
            title="Wages"
            amount={formatCurrency(8400)}
            amountNegative
            progress={1}
            progressColor="#0f766e"
            accentColor="#0f766e"
          />
          <MobileSectionLabel>One-off — earmarked in full from today</MobileSectionLabel>
          <MobileRecordCard
            title="Seasonal marketing"
            amount={formatCurrency(4500)}
            amountNegative
            progress={1}
            progressColor="#c2410c"
            accentColor="#c2410c"
          />
          <MobileSectionLabel>One-off — building up a little each day</MobileSectionLabel>
          <MobileRecordCard
            title="Activity equipment"
            amount={formatCurrency(279)}
            amountSecondary={`/ ${formatCurrency(12000)}`}
            amountNegative
            progress={279 / 12000}
            progressColor="#c2410c"
            accentColor="#c2410c"
          />
        </MobileRecordList>
      </div>
    </div>
  )
}
