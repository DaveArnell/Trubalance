import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

/**
 * Static Due example in card style — teaches what Due looks like without
 * duplicating a second annotated strip or falling back to the sheet.
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
          <MobileSectionLabel>Due now</MobileSectionLabel>
          <MobileRecordCard
            title="Wages"
            scopeLabel="Northgate Venues Ltd"
            amount={formatCurrency(8400)}
            amountNegative
            progress={1}
            progressColor="#0f766e"
            accentColor="#0f766e"
            meta="Due today · Stays until Paid"
          />
          <MobileSectionLabel>Coming up</MobileSectionLabel>
          <MobileRecordCard
            title="Seasonal marketing"
            scopeLabel="Coastal Attractions Ltd"
            amount={formatCurrency(4500)}
            amountNegative
            progress={1}
            progressColor="#c2410c"
            accentColor="#c2410c"
            meta="23 Aug · One-off"
          />
          <MobileRecordCard
            title="Activity equipment"
            scopeLabel="Northgate Venues Ltd"
            amount={formatCurrency(279)}
            amountSecondary={`/ ${formatCurrency(12000)}`}
            amountNegative
            progress={279 / 12000}
            progressColor="#c2410c"
            accentColor="#c2410c"
            meta="30 Aug · One-off · building up"
          />
        </MobileRecordList>
      </div>
    </div>
  )
}
