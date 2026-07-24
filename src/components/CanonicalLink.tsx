import { type LinkProps, Link, useNavigate } from 'react-router-dom'
import { SITE_ORIGIN, canonicalUrl, normalizeAppPath } from '../lib/canonicalUrl'

type ToInput = LinkProps['to']

function resolveToString(to: ToInput): string | null {
  if (typeof to === 'string') return to
  if (typeof to === 'number') return null
  if (to && typeof to === 'object') {
    const pathname = to.pathname ?? '/'
    const search = to.search
      ? to.search.startsWith('?')
        ? to.search
        : `?${to.search}`
      : ''
    const hash = to.hash ? (to.hash.startsWith('#') ? to.hash : `#${to.hash}`) : ''
    return `${pathname}${search}${hash}`
  }
  return null
}

function isSameOriginAbsolute(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const site = new URL(SITE_ORIGIN)
    const host = url.hostname.replace(/^www\./i, '')
    const siteHost = site.hostname.replace(/^www\./i, '')
    return host === siteHost
  } catch {
    return false
  }
}

/**
 * Internal link that exposes a complete absolute canonical href in the DOM
 * (no trailing slash) while keeping client-side SPA navigation.
 */
export function CanonicalLink({
  to,
  onClick,
  replace: _replace,
  state: _state,
  relative: _relative,
  preventScrollReset: _preventScrollReset,
  viewTransition: _viewTransition,
  ...rest
}: LinkProps) {
  const navigate = useNavigate()
  const asString = resolveToString(to)

  if (asString == null) {
    return <Link to={to} onClick={onClick} {...rest} />
  }

  if (/^https?:\/\//i.test(asString) && !isSameOriginAbsolute(asString)) {
    return <a href={asString} onClick={onClick} {...rest} />
  }

  const normalized = normalizeAppPath(asString)
  const href = canonicalUrl(normalized)

  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (event.button !== 0) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        navigate(normalized)
      }}
    />
  )
}
