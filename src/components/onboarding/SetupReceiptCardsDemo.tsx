import { MobileRecordCard, MobileRecordList } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

/**
 * Static Expected Receipts example in card style — mirrors the Due onboarding demo.
 */
export function SetupReceiptCardsDemo() {
  return (
    <div className="setup-edu-visual setup-edu-visual--cards">
      <div className="setup-edu-card-demo setup-edu-due-demo">
        <div className="setup-edu-due-demo-head">
          <p className="setup-edu-card-demo-label">Expected Receipts</p>
          <p className="setup-edu-due-demo-total">TOTAL {formatCurrency(7400)}</p>
        </div>
        <MobileRecordList>
          <MobileRecordCard
            title="Client invoice"
            scopeLabel="Coastal Attractions Ltd"
            amount={formatCurrency(3200)}
            amountPositive
            progress={1}
            progressColor="#059669"
            accentColor="#059669"
            meta="Expected today · Stays until Received"
          />
          <MobileRecordCard
            title="Venue hire deposit"
            scopeLabel="Northgate Venues Ltd"
            amount={formatCurrency(1800)}
            amountPositive
            progress={1}
            progressColor="#059669"
            accentColor="#059669"
            meta="28 Aug · Lump sum"
          />
          <MobileRecordCard
            title="Grant payment"
            scopeLabel="Summit Leisure Group"
            amount={formatCurrency(840)}
            amountSecondary={`/ ${formatCurrency(4200)}`}
            amountPositive
            progress={840 / 4200}
            progressColor="#059669"
            accentColor="#059669"
            meta="15 Sep · Building up"
          />
        </MobileRecordList>
      </div>
    </div>
  )
}
