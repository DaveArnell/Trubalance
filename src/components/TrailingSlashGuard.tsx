import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeAppPath } from '../lib/canonicalUrl'

/**
 * Redirects `/path/` → `/path` (and collapses duplicate trailing slashes)
 * so routing never serves slash and non-slash variants as separate pages.
 */
export function TrailingSlashGuard() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const current = `${location.pathname}${location.search}${location.hash}`
    const normalized = normalizeAppPath(current)
    if (normalized !== current) {
      navigate(normalized, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  return null
}
