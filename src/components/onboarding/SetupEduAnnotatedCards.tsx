import { MobileRecordCard } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

export function SetupDueAnnotatedCards() {
  return (
    <div className="setup-edu-card-demo">
      <p className="setup-edu-card-demo-label">How Due cards look</p>
      <div className="setup-edu-annotated-row">
        <div className="setup-edu-annotated-item">
          <MobileRecordCard
            title="Seasonal marketing"
            scopeLabel="Coastal Attractions Ltd"
            amount={formatCurrency(4500)}
            amountNegative
            progress={1}
            progressColor="#c2410c"
            accentColor="#c2410c"
          />
          <p className="setup-edu-annotation">
            Full balance earmarked — deducted from True Balance from day one.
          </p>
        </div>
        <div className="setup-edu-annotated-item">
          <MobileRecordCard
            title="Activity equipment"
            scopeLabel="Northgate Venues Ltd"
            amount={formatCurrency(279)}
            amountSecondary={`/ ${formatCurrency(12000)}`}
            amountNegative
            progress={279 / 12000}
            progressColor="#c2410c"
            accentColor="#c2410c"
          />
          <p className="setup-edu-annotation">
            Building towards the total a little every day until the due date.
          </p>
        </div>
      </div>
    </div>
  )
}

export function SetupReceiptAnnotatedCards() {
  return (
    <div className="setup-edu-card-demo">
      <p className="setup-edu-card-demo-label">How Expected Receipt cards look</p>
      <div className="setup-edu-annotated-row">
        <div className="setup-edu-annotated-item">
          <MobileRecordCard
            title="Client invoice"
            amount={formatCurrency(3200)}
            amountPositive
            progress={1}
            progressColor="#059669"
            accentColor="#059669"
            meta="Lump sum"
          />
          <p className="setup-edu-annotation">
            You’re confident it’s coming — full amount counted straight away.
          </p>
        </div>
        <div className="setup-edu-annotated-item">
          <MobileRecordCard
            title="Grant payment"
            amount={formatCurrency(840)}
            amountSecondary={`/ ${formatCurrency(4200)}`}
            amountPositive
            progress={840 / 4200}
            progressColor="#059669"
            accentColor="#059669"
            meta="Building up"
          />
          <p className="setup-edu-annotation">
            Builds a little every day toward the expected date.
          </p>
        </div>
      </div>
    </div>
  )
}
