import { useEffect, useState } from 'react'
import { adminFetchQrCodes } from '../adminApi'
import { AdminBadge, AdminPageHeader } from '../components/AdminUi'
import type { QrCodeRow } from '../types'

export function AdminQrCodesPage() {
  const [rows, setRows] = useState<QrCodeRow[]>([])

  useEffect(() => {
    adminFetchQrCodes().then(setRows)
  }, [])

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="QR Codes"
        description="Ready for invite links, marketing campaigns, and printed guides. Scan tracking is placeholder."
        actions={
          <button type="button" className="btn-primary btn-tiny" disabled>
            + Create QR code
          </button>
        }
      />

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Destination</th>
              <th>Scans</th>
              <th>Created</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td className="admin-mono">{row.destination}</td>
                <td>{row.scans}</td>
                <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                <td>
                  <AdminBadge tone={row.status === 'active' ? 'green' : 'neutral'}>{row.status}</AdminBadge>
                </td>
                <td>
                  <button type="button" className="btn-ghost btn-tiny" disabled>
                    Download
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
