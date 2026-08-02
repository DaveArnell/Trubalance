import { useEffect, useState } from 'react'
import { adminFetchCampaignPerformance } from '../adminApi'
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import type { CampaignPerformanceSnapshot } from '../types'

/** Stable URL for the first Meta boosted-post test — paste into Facebook as the destination. */
export const FACEBOOK_BOOST_TEST_LINK =
  'https://www.cashprophet.co.uk/?utm_source=meta&utm_medium=paid&utm_campaign=fb_boost_test_aug26&utm_content=boosted_post'

const EXAMPLE_LINK = FACEBOOK_BOOST_TEST_LINK

export function AdminCampaignsPage() {
  const [data, setData] = useState<CampaignPerformanceSnapshot | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    adminFetchCampaignPerformance().then(setData)
  }, [])

  if (!data) return <p className="admin-loading muted">Loading campaign results…</p>

  const { rows, totals } = data
  const taggedRate =
    totals.signedUp > 0 ? Math.round((totals.taggedSignups / totals.signedUp) * 100) : 0

  const copyBoostLink = async () => {
    try {
      await navigator.clipboard.writeText(FACEBOOK_BOOST_TEST_LINK)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', FACEBOOK_BOOST_TEST_LINK)
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Ads & campaigns"
        description="Which ads turn into signups, finished setup, trial use, and paying customers — so you know where to put your money."
      />

      <AdminSection title="Facebook boost — use this link">
        <p className="muted admin-section-lead">
          Paste this exact URL as the destination on your boosted post. After people click and sign
          up, look for the campaign name <code className="admin-mono">fb_boost_test_aug26</code> in
          the table below. Ignore older test rows (you, friends, Direct / unknown) until this boost
          has real traffic.
        </p>
        <pre className="admin-guide-code">{FACEBOOK_BOOST_TEST_LINK}</pre>
        <p className="admin-campaign-actions">
          <button type="button" className="btn-primary btn-tiny" onClick={() => void copyBoostLink()}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </p>
        <ul className="admin-guide-list">
          <li>
            <strong>utm_source=meta</strong> — Facebook / Instagram
          </li>
          <li>
            <strong>utm_medium=paid</strong> — paid boost
          </li>
          <li>
            <strong>utm_campaign=fb_boost_test_aug26</strong> — this test (keep the spelling stable)
          </li>
          <li>
            <strong>utm_content=boosted_post</strong> — creative label
          </li>
        </ul>
        <p className="muted">
          You do not need a Meta pixel for this first test. Site-side tags are enough to see funnel
          stages here. Finish Stripe go-live before spending hard on ads — see{' '}
          <code className="admin-mono">docs/STRIPE_GO_LIVE.md</code>.
        </p>
      </AdminSection>

      <AdminStatGrid>
        <AdminStatCard label="Signups tracked" value={totals.signedUp} />
        <AdminStatCard label="From tagged ads" value={totals.taggedSignups} />
        <AdminStatCard label="Finished onboarding" value={totals.finishedOnboarding} />
        <AdminStatCard label="Paying customers" value={totals.paid} />
      </AdminStatGrid>

      <AdminSection title="Results by campaign">
        <p className="muted admin-section-lead">
          Early rows often include your own test accounts or a friend who clicked a tagged link days
          ago (first visit sticks for 90 days). That is normal — not ad spend. Once the boost runs,
          judge only the <code className="admin-mono">fb_boost_test_aug26</code> row. {taggedRate}% of
          all signups currently have a tagged link ({totals.untaggedSignups} are Direct / unknown).
        </p>
        <div className="admin-table-wrap admin-table-wrap--wide">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Where from</th>
                <th>Campaign</th>
                <th>Ad variant</th>
                <th>Signed up</th>
                <th>Finished setup</th>
                <th>Active in trial</th>
                <th>Paid</th>
                <th>Setup rate</th>
                <th>Paid rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="muted">
                    No campaign data yet. Use the Facebook boost link above, then refresh after
                    signups arrive.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.campaign === 'fb_boost_test_aug26' ? 'admin-row--highlight' : undefined
                    }
                  >
                    <td>
                      <div>{row.sourceLabel}</div>
                      <div className="muted admin-cell-sub">
                        {row.medium !== '—' && row.medium !== 'none' ? row.medium : '—'}
                      </div>
                    </td>
                    <td>
                      <code className="admin-mono">{row.campaign}</code>
                    </td>
                    <td>{row.content ? <code className="admin-mono">{row.content}</code> : '—'}</td>
                    <td>{row.signedUp}</td>
                    <td>{row.finishedOnboarding}</td>
                    <td>{row.activeInTrial}</td>
                    <td>
                      <strong>{row.paid}</strong>
                    </td>
                    <td>{row.onboardingRate}%</td>
                    <td>
                      <strong>{row.paidRate}%</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="How this works (plain English)">
        <div className="admin-guide">
          <article className="admin-guide-block">
            <h3>What this page is for</h3>
            <p>
              Ad platforms show clicks and cheap signups. That does not tell you which ads produce
              people who finish setup and pay. This page answers that: for each tagged ad link, how
              many people signed up, finished onboarding, used the product in trial, and became
              paying customers.
            </p>
          </article>

          <article className="admin-guide-block">
            <h3>How to tag any other ad link</h3>
            <p>
              Before you put a Cash Prophet URL into Meta, Google, LinkedIn, email, or a QR code,
              add labels to the end of the link. First visit wins for 90 days.
            </p>
            <p>Example (same shape as the boost link above):</p>
            <pre className="admin-guide-code">{EXAMPLE_LINK}</pre>
            <ul className="admin-guide-list">
              <li>
                <strong>utm_source</strong> — <code>meta</code>, <code>google</code>,{' '}
                <code>newsletter</code>, <code>linkedin</code>
              </li>
              <li>
                <strong>utm_medium</strong> — <code>paid</code>, <code>email</code>,{' '}
                <code>social</code>, <code>organic</code>
              </li>
              <li>
                <strong>utm_campaign</strong> — stable name for this promotion (main grouping)
              </li>
              <li>
                <strong>utm_content</strong> — optional creative A/B label
              </li>
            </ul>
          </article>

          <article className="admin-guide-block">
            <h3>What “Direct / unknown” means</h3>
            <p>
              Someone signed up without a tagged link — typed the address, used an untagged bookmark,
              or tags were stripped. You cannot assign that signup to a specific ad.
            </p>
          </article>

          <article className="admin-guide-block">
            <h3>What this does not do (yet)</h3>
            <p>
              We do not pull Meta/Google spend or install pixels. Cost stays in their dashboards;
              this page is first-party funnel results only.
            </p>
          </article>
        </div>
      </AdminSection>
    </div>
  )
}
