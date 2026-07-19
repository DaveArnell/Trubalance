export type MobileHomeSection = 'committed-funds' | 'due' | 'expected-receipts'

interface MobileHomeSectionTabsProps {
  active: MobileHomeSection
  onChange: (section: MobileHomeSection) => void
  dueBadgeCount?: number
}

const TABS: { id: MobileHomeSection; label: string }[] = [
  { id: 'committed-funds', label: 'Accruing' },
  { id: 'due', label: 'Due' },
  { id: 'expected-receipts', label: 'Receipts' },
]

export function MobileHomeSectionTabs({
  active,
  onChange,
  dueBadgeCount = 0,
}: MobileHomeSectionTabsProps) {
  return (
    <nav className="mobile-home-section-tabs" aria-label="Home sections">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        const showBadge = tab.id === 'due' && dueBadgeCount > 0
        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-home-section-tab${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={
              showBadge ? `${tab.label}, ${dueBadgeCount} needing attention` : tab.label
            }
            onClick={() => onChange(tab.id)}
          >
            <span className="mobile-home-section-tab-label">{tab.label}</span>
            {showBadge ? (
              <span className="mobile-home-section-tab-badge" aria-hidden>
                {dueBadgeCount > 9 ? '9+' : dueBadgeCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
