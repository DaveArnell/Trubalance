import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchUsers } from '../adminApi'
import {
  AdminBadge,
  AdminPageHeader,
  AdminPagination,
  AdminSortableTh,
  AdminUserCell,
} from '../components/AdminUi'
import { useTableSort } from '../hooks/useTableSort'
import type { AdminUserFilter, AdminUserListItem } from '../types'

const PAGE_SIZE = 25

type UserSortKey = 'fullName' | 'email' | 'subscriptionTier' | 'lastLoginAt' | 'createdAt' | 'businessCount'

const FILTERS: { id: AdminUserFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trial', label: 'Trial' },
  { id: 'paid', label: 'Paid' },
  { id: 'lifetime', label: 'Lifetime' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

function statusTone(status: AdminUserListItem['subscriptionStatus']) {
  if (status === 'active' || status === 'lifetime') return 'green'
  if (status === 'trialing') return 'blue'
  if (status === 'past_due') return 'orange'
  if (status === 'canceled' || status === 'expired') return 'red'
  return 'neutral'
}

export function AdminUsersPage() {
  const { sortKey, sortDirection, toggleSort } = useTableSort<UserSortKey>('fullName')
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AdminUserFilter>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchUsers({ page, pageSize: PAGE_SIZE, search, filter })
    const sorted = [...result.items].sort((a, b) => {
      const av = a[sortKey as keyof AdminUserListItem]
      const bv = b[sortKey as keyof AdminUserListItem]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv))
      return sortDirection === 'asc' ? cmp : -cmp
    })
    setUsers(sorted)
    setTotal(result.total)
    setLoading(false)
  }, [page, search, filter, sortKey, sortDirection])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Users"
        description="Search and filter every platform user. Paginated for scale."
      />

      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search name, email, or business…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="admin-filter-chips" role="group" aria-label="Filter users">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`admin-filter-chip${filter === f.id ? ' admin-filter-chip--active' : ''}`}
              onClick={() => {
                setFilter(f.id)
                setPage(1)
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <AdminSortableTh label="User" active={sortKey === 'fullName'} direction={sortDirection} onSort={() => toggleSort('fullName')} />
              <AdminSortableTh label="Subscription" active={sortKey === 'subscriptionTier'} direction={sortDirection} onSort={() => toggleSort('subscriptionTier')} />
              <th>Trial</th>
              <AdminSortableTh label="Businesses" active={sortKey === 'businessCount'} direction={sortDirection} onSort={() => toggleSort('businessCount')} />
              <AdminSortableTh label="Last login" active={sortKey === 'lastLoginAt'} direction={sortDirection} onSort={() => toggleSort('lastLoginAt')} />
              <AdminSortableTh label="Created" active={sortKey === 'createdAt'} direction={sortDirection} onSort={() => toggleSort('createdAt')} />
              <th>Status</th>
              <th>Lifetime</th>
              <th>Admin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="muted">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted">
                  No users match your search.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <AdminUserCell userId={user.id} name={user.fullName} email={user.email} />
                  </td>
                  <td>
                    <AdminBadge tone="purple">{user.subscriptionTier}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone={statusTone(user.subscriptionStatus)}>{user.subscriptionStatus}</AdminBadge>
                  </td>
                  <td>{user.businessCount}</td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <AdminBadge tone={user.isActive ? 'green' : 'neutral'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </td>
                  <td>{user.lifetimeAccess ? 'Yes' : '—'}</td>
                  <td>{user.isPlatformAdmin ? 'Yes' : '—'}</td>
                  <td>
                    <Link to={`/platform-admin/users/${user.id}`} className="btn-secondary btn-tiny">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  )
}
