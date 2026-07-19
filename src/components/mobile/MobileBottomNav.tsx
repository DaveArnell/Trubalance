import { APP_PAGES, type PageId } from '../../navigation'

interface MobileBottomNavProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

const BOTTOM_PAGES = APP_PAGES.filter((page) => page.id !== 'reserve-planner')

export function MobileBottomNav({ activePage, onNavigate }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="App pages">
      {BOTTOM_PAGES.map((page) => {
        const isActive =
          page.id === activePage ||
          (page.id === 'committed-funds' && activePage === 'committed-funds')
        return (
          <button
            key={page.id}
            type="button"
            className={`mobile-bottom-nav-btn${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(page.id)}
          >
            <span className="mobile-bottom-nav-icon" aria-hidden>
              {page.icon}
            </span>
            <span className="mobile-bottom-nav-label">
              {page.id === 'committed-funds' ? 'Home' : page.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
