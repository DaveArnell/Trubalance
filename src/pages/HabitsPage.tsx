import { Navigate, useLocation } from 'react-router-dom'
import { normalizeAppPath } from '../lib/canonicalUrl'

/**
 * Habits now live on How it works — keep /habits for old links.
 */
export function HabitsPage() {
  const { hash } = useLocation()
  const target = !hash || hash === '#' ? '#habits' : hash
  return <Navigate to={normalizeAppPath(`/how-it-works${target}`)} replace />
}
