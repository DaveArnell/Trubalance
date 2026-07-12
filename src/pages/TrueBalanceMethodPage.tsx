import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { MethodEquation } from '../components/marketing/MethodEquation'
import {
  METHOD_FOR_ACCOUNTANTS,
  METHOD_FOUR_PRINCIPLES,
  METHOD_STEPS,
  METHOD_WORKED_EXAMPLE,
} from '../content/trueBalanceMethod'
import { METHOD_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function TrueBalanceMethodPage() {
  usePageMeta(METHOD_SEO)

  return (
    <MarketingShell>
      <MarketingHeader />

      <main className="marketing-main marketing-method-page">
        <div className="marketing-method-page-inner">
          <header className="marketing-method-page-header">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">The True Balance Method</p>
            <h1>The True Balance Method</h1>
            <p className="marketing-method-page-lead">
              Your bank balance tells you what is in the account. It does not tell you how much is
              genuinely available.
            </p>
          </header>

          <div className="legal-prose marketing-method-prose">
            <p>
              The True Balance Method is a simple way for business owners to manage money using the
              financial position that is genuinely available to them — rather than relying on the bank
              balance alone. It is the approach True Balance software is built to maintain.
            </p>

            <h2>Why the bank balance can mislead</h2>
            <p>
              Money in the account is not all yours to spend. Payroll builds up through the month.
              VAT and corporation tax accrue. Irregular bills sit in the background until they are due.
              A healthy-looking balance can hide obligations that are already spoken for.
            </p>

            <h2>Money that is already spoken for</h2>
            <p>
              The method treats commitments as they build — not only when payment leaves the bank.
              That includes regular costs accruing toward payday, tax building toward its deadline,
              and planned items you know are coming. Seeing this clearly is what turns a bank balance
              into a useful decision.
            </p>

            <h2>Monthly accruals</h2>
            <p>
              Many costs do not arrive as a single surprise. They accumulate day by day. The method
              accounts for that build-up so your position reflects what the business has already
              committed — whether or not the cash has moved yet.
            </p>

            <h2>Virtual reserves for irregular bills</h2>
            <p>
              VAT, corporation tax, insurance renewals and other lumpy costs are easier when money is
              set aside steadily. The method uses <strong>virtual reserves</strong> — targets tracked
              inside True Balance — so you know how much should be held back for each obligation.
            </p>
            <p>
              A virtual reserve is a planning figure. It does not move money by itself. You may choose
              to transfer cash into a separate savings account to match the reserve — that is a physical
              transfer you make. The reserve in True Balance shows what ought to be set aside; it is not
              the same as money already sitting in another account unless you have moved it there.
            </p>

            <h2>Realistic expected receipts</h2>
            <p>
              Where you have money genuinely owed to the business — and a realistic expectation of
              when it will arrive — the method can include it in the position. This is used carefully:
              only receipts you are confident about, not wishful income.
            </p>

            <h2>The calculation</h2>
            <MethodEquation variant="page" />
            <p>
              Worked example: bank balance {METHOD_WORKED_EXAMPLE.availableCash}, committed and
              accrued {METHOD_WORKED_EXAMPLE.committed}, expected receipts{' '}
              {METHOD_WORKED_EXAMPLE.expectedReceipts} → True Balance{' '}
              {METHOD_WORKED_EXAMPLE.trueBalance}.
            </p>
            <p>
              The result is one current snapshot: a single number you can use when deciding whether
              the business can afford a purchase, a hire, or a quiet month.
            </p>

            <h2>How the method works</h2>
            <ol className="marketing-method-steps-list">
              {METHOD_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <h2>The four principles</h2>
            <ul>
              {METHOD_FOUR_PRINCIPLES.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>

            <h2>The small ongoing routine</h2>
            <p>
              After initial setup, keeping the method current is a light habit — not a full re-entry
              of your accounts each week.
            </p>
            <ul>
              <li>Update bank balances when they change.</li>
              <li>Mark items as paid when money leaves the account.</li>
              <li>Add or adjust commitments when something in the business changes.</li>
              <li>Review the reserve planner and suggested transfers — often monthly.</li>
            </ul>
            <p>
              True Balance performs the ongoing accrual calculations automatically. You are mainly
              keeping the inputs honest; the method stays current in the background.
            </p>

            <h2>How True Balance automates the method</h2>
            <p>
              The app applies the calculation continuously: committed money, virtual reserves, and
              expected receipts roll into one True Balance figure on your dashboard. You do not need
              to maintain the spreadsheet logic yourself.
            </p>
            <p className="marketing-method-disclaimer muted">
              True Balance is a financial management tool. It does not provide regulated financial,
              tax or accounting advice. Always take professional advice for tax and statutory
              obligations.
            </p>

            <h2>For accountants</h2>
            <p>
              Accountants may recommend the True Balance Method when clients need clearer day-to-day
              visibility between formal reports:
            </p>
            <ul>
              {METHOD_FOR_ACCOUNTANTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <aside className="marketing-method-page-cta">
              <h2>Follow the method in software</h2>
              <p>
                True Balance automates the True Balance Method for your workspace — with committed
                funds, reserve planning and a live position you can trust for everyday decisions.
              </p>
              <div className="marketing-cta-row">
                <Link to="/signup" className="btn-primary">
                  Start free trial
                </Link>
                <Link to="/see-how-it-works" className="btn-secondary">
                  Try demo
                </Link>
                <Link to="/blog" className="btn-ghost">
                  Method articles
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  )
}
