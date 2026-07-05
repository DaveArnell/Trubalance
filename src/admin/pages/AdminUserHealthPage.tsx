import { useCallback, useEffect, useState } from 'react'
import { adminFetchUserHealth } from '../adminApi'
import {
  AdminBadge,
  AdminPageHeader,
  AdminPagination,
  AdminSortableTh,
  AdminUserCell,
  HealthStatusBadge,
  RiskBadge,
} from '../components/AdminUi'
import { useTableSort } from '../hooks/useTableSort'
import type { AdminUserHealthRow, HealthStatus, RiskStatus } from '../types'

const PAGE_SIZE = 25

type HealthSortKey =
  | 'fullName'
  | 'plan'
  | 'lastLoginAt'
  | 'lastBalanceUpdateAt'
  | 'businessCount'
  | 'accountCount'
  | 'commitmentCount'
  | 'reservePlannerCount'
  | 'onboardingPct'
  | 'healthStatus'
  | 'riskStatus'

const HEALTH_FILTERS: Array<{ id: HealthStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All health' },
  { id: 'green', label: 'Healthy' },
  { id: 'yellow', label: 'Watch' },
  { id: 'orange', label: 'At risk' },
  { id: 'red', label: 'Critical' },
]

const RISK_FILTERS: Array<{ id: RiskStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All risk' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
]

function formatRelative(iso: string | null) {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function setupLabel(row: AdminUserHealthRow): string {
  if (row.commitmentCount > 0 && row.reservePlannerCount > 0) return 'Full'
  if (row.commitmentCount > 0) return 'Costs only'
  if (row.businessCount > 0) return 'Structure'
  return 'New'
}

export function AdminUserHealthPage() {
  const { sortKey, sortDirection, toggleSort } = useTableSort<HealthSortKey>('lastBalanceUpdateAt', 'desc')
  const [rows, setRows] = useState<AdminUserHealthRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [health, setHealth] = useState<HealthStatus | 'all'>('all')
  const [risk, setRisk] = useState<RiskStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchUserHealth({
      page,
      pageSize: PAGE_SIZE,
      search,
      health,
      risk,
      sortKey,
      sortDir: sortDirection,
    })
    setRows(result.items)
    setTotal(result.total)
    setLoading(false)
  }, [page, search, health, risk, sortKey, sortDirection])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onModeChange = () => {
      setPage(1)
      load()
    }
    window.addEventListener('admin-data-mode-change', onModeChange)
    return () => window.removeEventListener('admin-data-mode-change', onModeChange)
  }, [load])

  const sortProps = (key: HealthSortKey) => ({
    active: sortKey === key,
    direction: sortDirection,
    onSort: () => {
      toggleSort(key)
      setPage(1)
    },
  })

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="User Health"
        description="Who is getting value from True Balance, who is drifting, and who may need a nudge or support call."
      />

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Search name, email, workspace…"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
        <div className="admin-filter-chips">
          {HEALTH_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`admin-filter-chip${health === f.id ? ' admin-filter-chip--active' : ''}`}
              onClick={() => {
                setPage(1)
                setHealth(f.id)
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="admin-filter-chips">
          {RISK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`admin-filter-chip${risk === f.id ? ' admin-filter-chip--active' : ''}`}
              onClick={() => {
                setPage(1)
                setRisk(f.id)
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap admin-table-wrap--wide">
        <table className="admin-data-table admin-data-table--compact">
          <thead>
            <tr>
              <AdminSortableTh label="User" {...sortProps('fullName')} />
              <AdminSortableTh label="Plan" {...sortProps('plan')} />
              <AdminSortableTh label="Last login" {...sortProps('lastLoginAt')} />
              <AdminSortableTh label="Last balance update" {...sortProps('lastBalanceUpdateAt')} />
              <AdminSortableTh label="Businesses" {...sortProps('businessCount')} />
              <AdminSortableTh label="Accounts" {...sortProps('accountCount')} />
              <AdminSortableTh label="Monthly costs" {...sortProps('commitmentCount')} />
              <AdminSortableTh label="Reserves" {...sortProps('reservePlannerCount')} />
              <AdminSortableTh label="Setup" {...sortProps('onboardingPct')} />
              <AdminSortableTh label="Health" {...sortProps('healthStatus')} />
              <AdminSortableTh label="Risk" {...sortProps('riskStatus')} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="muted">
                  No users match your filters. Switch to demo data if you are previewing the admin panel locally.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId}>
                  <td>
                    <AdminUserCell userId={row.userId} name={row.fullName} email={row.email} />
                  </td>
                  <td>
                    <AdminBadge tone="purple">{row.plan ?? '—'}</AdminBadge>
                    <span className="admin-cell-sub">{row.subscriptionStatus}</span>
                  </td>
                  <td>{formatRelative(row.lastLoginAt)}</td>
                  <td>{formatRelative(row.lastBalanceUpdateAt)}</td>
                  <td>{row.businessCount}</td>
                  <td>{row.accountCount}</td>
                  <td>{row.commitmentCount}</td>
                  <td>{row.reservePlannerCount}</td>
                  <td>{setupLabel(row)}</td>
                  <td>
                    <HealthStatusBadge status={row.healthStatus} />
                  </td>
                  <td>
                    <RiskBadge risk={row.riskStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  )
}
