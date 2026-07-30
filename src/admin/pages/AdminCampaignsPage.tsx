import { useEffect, useState } from 'react'
import { adminFetchCampaignPerformance } from '../adminApi'
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import type { CampaignPerformanceSnapshot } from '../types'

const EXAMPLE_LINK =
  'https://www.cashprophet.co.uk/?utm_source=meta&utm_medium=paid&utm_campaign=spring_offer&utm_content=video_a'

export function AdminCampaignsPage() {
  const [data, setData] = useState<CampaignPerformanceSnapshot | null>(null)

  useEffect(() => {
    adminFetchCampaignPerformance().then(setData)
  }, [])

  if (!data) return <p className="admin-loading muted">Loading campaign results…</p>

  const { rows, totals } = data
  const taggedRate =
    totals.signedUp > 0 ? Math.round((totals.taggedSignups / totals.signedUp) * 100) : 0

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Ads & campaigns"
        description="Which ads and campaigns turn into signups, finished setup, trial use, and paying customers — so you know where to put your money."
      />

      <AdminStatGrid>
        <AdminStatCard label="Signups tracked" value={totals.signedUp} />
        <AdminStatCard label="From tagged ads" value={totals.taggedSignups} />
        <AdminStatCard label="Finished onboarding" value={totals.finishedOnboarding} />
        <AdminStatCard label="Paying customers" value={totals.paid} />
      </AdminStatGrid>

      <AdminSection title="Results by campaign">
        <p className="muted admin-section-lead">
          Each row is one ad link you tagged. Sort by paid customers and paid rate to see what is
          worth spending more on. {taggedRate}% of signups arrived with a tagged link
          ({totals.untaggedSignups} came in untagged — Direct / unknown).
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
                    No campaign data yet. Once you run ads with tagged links (see the guide below)
                    and people sign up, rows appear here.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
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
            <h3>How to tag an ad link</h3>
            <p>
              Before you put a Cash Prophet URL into Meta, Google, LinkedIn, email, or a QR code,
              add a few labels to the end of the link. Those labels travel with the visitor. When
              they sign up, we save them on their account (first visit wins for 90 days).
            </p>
            <p>Example link:</p>
            <pre className="admin-guide-code">{EXAMPLE_LINK}</pre>
            <ul className="admin-guide-list">
              <li>
                <strong>utm_source</strong> — where the person came from. Use short names like{' '}
                <code>meta</code>, <code>google</code>, <code>newsletter</code>,{' '}
                <code>linkedin</code>.
              </li>
              <li>
                <strong>utm_medium</strong> — the type of channel. Common values:{' '}
                <code>paid</code> (paid ads), <code>email</code>, <code>social</code>,{' '}
                <code>organic</code>.
              </li>
              <li>
                <strong>utm_campaign</strong> — the name of this promotion or ad set. Pick something
                you will recognise later, e.g. <code>spring_offer</code> or{' '}
                <code>brand_search</code>. This is the main grouping for spend decisions.
              </li>
              <li>
                <strong>utm_content</strong> — optional. Use when you test two creatives in the same
                campaign, e.g. <code>video_a</code> vs <code>image_b</code>.
              </li>
              <li>
                <strong>utm_term</strong> — optional. Search keyword when you use Google Ads.
              </li>
            </ul>
            <p>
              You do not need to memorise the word “UTM”. Think of them as sticky labels on the
              link so Cash Prophet can tell campaigns apart.
            </p>
          </article>

          <article className="admin-guide-block">
            <h3>What each column means</h3>
            <ul className="admin-guide-list">
              <li>
                <strong>Where from</strong> — platform or channel (Meta, Google Ads, email, etc.).
              </li>
              <li>
                <strong>Campaign</strong> — the campaign name you put in the link.
              </li>
              <li>
                <strong>Ad variant</strong> — which creative / version, if you used{' '}
                <code>utm_content</code>.
              </li>
              <li>
                <strong>Signed up</strong> — people who created an account after arriving on a
                tagged link (or Direct / unknown if no tags).
              </li>
              <li>
                <strong>Finished setup</strong> — completed onboarding in the app.
              </li>
              <li>
                <strong>Active in trial</strong> — still on trial and have used the product (signed
                in or updated balances).
              </li>
              <li>
                <strong>Paid</strong> — paying customers (active subscription or lifetime access).
              </li>
              <li>
                <strong>Setup rate / Paid rate</strong> — % of that campaign’s signups who finished
                setup / who pay. Higher paid rate usually means a better place to spend.
              </li>
            </ul>
          </article>

          <article className="admin-guide-block">
            <h3>What “Direct / unknown” means</h3>
            <p>
              Someone signed up without a tagged link — they typed the website address, used an
              untagged bookmark, clicked an old link, or the tags were stripped. You cannot assign
              that signup to a specific ad. Aim to tag every paid link so this bucket stays small.
            </p>
          </article>

          <article className="admin-guide-block">
            <h3>How to use this to decide spend</h3>
            <ol className="admin-guide-list">
              <li>Create one tagged link per ad (or per creative you want to compare).</li>
              <li>Paste that full link into the ad destination URL.</li>
              <li>Let traffic run for a while — look at paid customers and paid rate, not just
                signups.</li>
              <li>
                Put more budget on campaigns with strong paid rates; pause or rewrite ones that
                only get signups who never finish setup or never pay.
              </li>
            </ol>
          </article>

          <article className="admin-guide-block">
            <h3>What this does <em>not</em> do (yet)</h3>
            <p>
              Meta and Google still show their own click and cost numbers inside their dashboards.
              We do not pull ad spend into this page yet, and we do not install tracking pixels on
              Cash Prophet. This report is first-party: it only sees people who land on your site
              with a tagged link and then sign up. That is intentional for privacy, and it is the
              number that matters for “which ads produce paying customers.”
            </p>
            <p>
              Optional click IDs (like Google’s or Meta’s click codes) are saved when present so we
              can match spend later if you want that.
            </p>
          </article>

          <article className="admin-guide-block">
            <h3>Checklist before you spend</h3>
            <ul className="admin-guide-list">
              <li>Every paid ad destination URL includes at least source + campaign tags.</li>
              <li>Campaign names are consistent (same spelling every time).</li>
              <li>Different creatives use different <code>utm_content</code> values.</li>
              <li>
                After signup traffic arrives, refresh this page and compare paid rate across rows.
              </li>
            </ul>
          </article>
        </div>
      </AdminSection>
    </div>
  )
}
