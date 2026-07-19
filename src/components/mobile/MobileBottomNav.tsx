import { APP_PAGES, MOBILE_PRIMARY_PAGES, type PageId } from '../../navigation'

interface MobileBottomNavProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  dueBadgeCount?: number
}

const BOTTOM_PAGES = APP_PAGES.filter((page) => MOBILE_PRIMARY_PAGES.includes(page.id))

export function MobileBottomNav({
  activePage,
  onNavigate,
  dueBadgeCount = 0,
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="App pages">
      {BOTTOM_PAGES.map((page) => {
        const isActive = page.id === activePage
        const showDueBadge = page.id === 'due' && dueBadgeCount > 0
        const label =
          page.id === 'committed-funds' ? 'Home' : page.id === 'receipts' ? 'Receipts' : page.label
        return (
          <button
            key={page.id}
            type="button"
            className={`mobile-bottom-nav-btn${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={
              showDueBadge
                ? `${label}, ${dueBadgeCount} needing attention`
                : label
            }
            onClick={() => onNavigate(page.id)}
          >
            <span className="mobile-bottom-nav-icon-wrap">
              <span className="mobile-bottom-nav-icon" aria-hidden>
                {page.icon}
              </span>
              {showDueBadge ? (
                <span className="mobile-bottom-nav-badge" aria-hidden>
                  {dueBadgeCount > 9 ? '9+' : dueBadgeCount}
                </span>
              ) : null}
            </span>
            <span className="mobile-bottom-nav-label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
