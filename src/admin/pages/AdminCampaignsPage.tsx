import { useEffect, useState } from 'react'
import { adminFetchCampaignPerformance } from '../adminApi'
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import type { CampaignPerformanceSnapshot } from '../types'

/** Stable tags for the Aug 2026 Meta launch ad — paste into Meta URL parameters. */
export const META_LAUNCH_URL_PARAMS =
  'utm_source=meta&utm_medium=paid&utm_campaign=cp_launch_uk_aug26&utm_content=big_balance_v1'

/** Full homepage URL with the same tags (handy for a private-window test). */
export const META_LAUNCH_TEST_LINK =
  `https://www.cashprophet.co.uk/?${META_LAUNCH_URL_PARAMS}`

/** @deprecated Prefer META_LAUNCH_TEST_LINK — kept for any older references. */
export const FACEBOOK_BOOST_TEST_LINK = META_LAUNCH_TEST_LINK

const EXAMPLE_LINK = META_LAUNCH_TEST_LINK

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
      await navigator.clipboard.writeText(META_LAUNCH_TEST_LINK)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', META_LAUNCH_TEST_LINK)
    }
  }

  const copyParams = async () => {
    try {
      await navigator.clipboard.writeText(META_LAUNCH_URL_PARAMS)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy these URL parameters:', META_LAUNCH_URL_PARAMS)
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Ads & campaigns"
        description="Which ads turn into signups, finished setup, and paying customers — so you know where to put your money."
      />

      <AdminSection title="Meta launch — URL parameters">
        <p className="muted admin-section-lead">
          Paste this exact string into Meta Ads Manager → Tracking → <strong>URL parameters</strong>.
          After people click and sign up, look for campaign{' '}
          <code className="admin-mono">cp_launch_uk_aug26</code> below and in Acquisition Funnel.
          Meta also appends <code className="admin-mono">fbclid</code> automatically — we store that too.
        </p>
        <pre className="admin-guide-code">{META_LAUNCH_URL_PARAMS}</pre>
        <p className="admin-campaign-actions">
          <button type="button" className="btn-primary btn-tiny" onClick={() => void copyParams()}>
            {copied ? 'Copied' : 'Copy URL parameters'}
          </button>
          <button type="button" className="btn-ghost btn-tiny" onClick={() => void copyBoostLink()}>
            Copy full test link
          </button>
        </p>
        <ul className="admin-guide-list">
          <li>
            <strong>utm_source=meta</strong> — Facebook / Instagram
          </li>
          <li>
            <strong>utm_medium=paid</strong> — paid ads
          </li>
          <li>
            <strong>utm_campaign=cp_launch_uk_aug26</strong> — this launch (keep spelling stable)
          </li>
          <li>
            <strong>utm_content=big_balance_v1</strong> — creative label
          </li>
        </ul>
        <p className="muted">
          Private-window test link:{' '}
          <code className="admin-mono">{EXAMPLE_LINK}</code>
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
          Early rows often include your own test accounts (first visit sticks for 90 days). Once the
          launch runs, judge the <code className="admin-mono">cp_launch_uk_aug26</code> row.{' '}
          {taggedRate}% of all signups currently have a tagged link ({totals.untaggedSignups} are
          Direct / unknown).
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
                    No campaign data yet. Use the Meta URL parameters above, then refresh after
                    signups arrive.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.campaign === 'cp_launch_uk_aug26' ? 'admin-row--highlight' : undefined
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
