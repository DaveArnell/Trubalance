import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

/**
 * Static Expected Receipts example — section labels teach the types; cards stay clean.
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
          <MobileSectionLabel>Due in — waiting to be marked received</MobileSectionLabel>
          <MobileRecordCard
            title="Client invoice"
            amount={formatCurrency(3200)}
            amountPositive
            progress={1}
            progressColor="#059669"
            accentColor="#059669"
          />
          <MobileSectionLabel>Future date — counted in full from today</MobileSectionLabel>
          <MobileRecordCard
            title="Venue hire deposit"
            amount={formatCurrency(1800)}
            amountPositive
            progress={1}
            progressColor="#059669"
            accentColor="#059669"
          />
          <MobileSectionLabel>Future date — building up toward arrival</MobileSectionLabel>
          <MobileRecordCard
            title="Grant payment"
            amount={formatCurrency(840)}
            amountSecondary={`/ ${formatCurrency(4200)}`}
            amountPositive
            progress={840 / 4200}
            progressColor="#059669"
            accentColor="#059669"
          />
        </MobileRecordList>
      </div>
    </div>
  )
}
