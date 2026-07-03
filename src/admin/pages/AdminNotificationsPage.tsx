import { useEffect, useState } from 'react'
import { adminFetchNotifications } from '../adminApi'
import { AdminBadge, AdminPageHeader } from '../components/AdminUi'
import type { NotificationTemplateRow } from '../types'

export function AdminNotificationsPage() {
  const [rows, setRows] = useState<NotificationTemplateRow[]>([])

  useEffect(() => {
    adminFetchNotifications().then(setRows)
  }, [])

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Notifications"
        description="Central control for email, in-app, and future push notifications."
      />

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Description</th>
              <th>Enabled</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <AdminBadge tone="blue">{row.channel}</AdminBadge>
                </td>
                <td className="muted">{row.description}</td>
                <td>
                  <AdminBadge tone={row.enabled ? 'green' : 'neutral'}>
                    {row.enabled ? 'On' : 'Off'}
                  </AdminBadge>
                </td>
                <td>
                  <button type="button" className="btn-ghost btn-tiny" disabled>
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
