import { useEffect, useState } from 'react'
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import {
  fetchAcquisitionFunnelSnapshot,
  type AcquisitionFunnelSnapshot,
  type FunnelDatePreset,
} from '../../services/acquisitionFunnel'

export function AdminAcquisitionFunnelPage() {
  const [preset, setPreset] = useState<FunnelDatePreset>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<AcquisitionFunnelSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdContent, setShowAdContent] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAcquisitionFunnelSnapshot(
      preset,
      preset === 'custom' ? customStart : undefined,
      preset === 'custom' ? customEnd : undefined,
    ).then((snapshot) => {
      if (!cancelled) {
        setData(snapshot)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [preset, customStart, customEnd])

  if (loading || !data) {
    return <p className="admin-loading muted">Loading acquisition funnel…</p>
  }

  const maxCount = Math.max(...data.stages.map((s) => s.count), 1)
  const worstDrop = [...data.stages]
    .filter((s) => s.droppedFromPreviousPct != null)
    .sort((a, b) => (b.droppedFromPreviousPct ?? 0) - (a.droppedFromPreviousPct ?? 0))[0]

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Acquisition Funnel"
        description="How people move from a website visit to a paying Cash Prophet customer. Cash Prophet’s own data is the source of truth — Meta Ads is for advertising only."
        actions={
          <div className="admin-funnel-filters">
            {(
              [
                ['today', 'Today'],
                ['7d', 'Last 7 days'],
                ['30d', 'Last 30 days'],
                ['custom', 'Custom'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn-tiny ${preset === id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPreset(id)}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {preset === 'custom' && (
        <div className="admin-funnel-custom-range">
          <label>
            From
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </label>
          <label>
            To
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </label>
        </div>
      )}

      <p className="muted admin-section-lead">
        Showing acquisition cohort {data.rangeStart} → {data.rangeEnd}. People who entered in this
        window; later stages include what happened to them afterwards (including after trial).
      </p>

      <AdminStatGrid>
        <AdminStatCard label="Visitors" value={data.headlines.visitors} />
        <AdminStatCard
          label="New accounts"
          value={data.headlines.accounts}
          hint={`${data.headlines.visitorToAccountPct}% of visitors`}
        />
        <AdminStatCard label="Onboarding completed" value={data.headlines.onboardingCompleted} />
        <AdminStatCard label="Checkout started" value={data.headlines.checkoutStarted} />
        <AdminStatCard
          label="Paid from this cohort"
          value={data.headlines.paidFromCohort}
          hint={`${data.headlines.accountToPaidPct}% of accounts · trials often pay ~30 days later`}
        />
        <AdminStatCard
          label="Became paid in period"
          value={data.headlines.becamePaidInPeriod}
          hint="Anyone who paid in these dates (any acquisition time)"
        />
      </AdminStatGrid>

      {worstDrop && (worstDrop.droppedFromPreviousPct ?? 0) >= 20 && (
        <p className="admin-funnel-callout">
          Biggest drop-off: before <strong>{worstDrop.label}</strong> — lost{' '}
          {worstDrop.droppedFromPrevious} people ({worstDrop.droppedFromPreviousPct}% of the previous
          stage).
        </p>
      )}

      <AdminSection title="Funnel">
        <div className="admin-funnel-stack">
          {data.stages.map((stage, index) => (
            <div key={stage.id} className="admin-funnel-row">
              <div className="admin-funnel-row-meta">
                <span className="admin-funnel-step">{index + 1}</span>
                <div>
                  <p className="admin-funnel-label">{stage.label}</p>
                  <p className="muted admin-funnel-sub">
                    {stage.count.toLocaleString()} people
                    {stage.fromPreviousPct != null && (
                      <> · {stage.fromPreviousPct}% of previous stage</>
                    )}
                    {stage.fromTopPct != null && <> · {stage.fromTopPct}% of visitors</>}
                    {stage.droppedFromPrevious > 0 && (
                      <>
                        {' '}
                        · lost {stage.droppedFromPrevious} ({stage.droppedFromPreviousPct}%)
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="admin-funnel-bar-track" aria-hidden>
                <div
                  className="admin-funnel-bar-fill"
                  style={{ width: `${Math.max(4, (stage.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="By source & campaign">
        <p className="muted admin-section-lead">
          First-touch attribution from UTM tags / Meta click ids. Rows with no tags show as Direct /
          unknown.
        </p>
        <label className="admin-funnel-toggle">
          <input
            type="checkbox"
            checked={showAdContent}
            onChange={(e) => setShowAdContent(e.target.checked)}
          />
          Show ad / creative (utm_content)
        </label>
        <div className="admin-table-wrap admin-table-wrap--wide">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Campaign</th>
                {showAdContent && <th>Ad / content</th>}
                <th>Visitors</th>
                <th>Accounts</th>
                <th>Visitor → account</th>
                <th>Onboarded</th>
                <th>Checkout</th>
                <th>Paid</th>
                <th>Account → paid</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.length === 0 ? (
                <tr>
                  <td colSpan={showAdContent ? 10 : 9} className="muted">
                    No acquisition rows in this range yet.
                  </td>
                </tr>
              ) : (
                data.sources.map((row) => (
                  <tr key={row.key}>
                    <td>{row.sourceLabel}</td>
                    <td>{row.campaign}</td>
                    {showAdContent && <td>{row.content || '—'}</td>}
                    <td>{row.visitors}</td>
                    <td>{row.accounts}</td>
                    <td>{row.visitorToAccountPct}%</td>
                    <td>{row.onboardingCompleted}</td>
                    <td>{row.checkoutStarted}</td>
                    <td>{row.paid}</td>
                    <td>{row.accountToPaidPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="Notes">
        <ul className="admin-guide-list">
          {data.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </AdminSection>
    </div>
  )
}
