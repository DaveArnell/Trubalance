/** Primary marketing nav — shared by header UI and SiteNavigationElement JSON-LD. */
export const PRIMARY_NAV = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/who-its-for', label: "Who it's for" },
  { to: '/see-how-it-works', label: 'See it' },
  { to: '/pricing', label: 'Pricing' },
] as const

/** Extra destinations included in SiteNavigationElement (footer / journey links). */
export const SECONDARY_NAV = [
  { to: '/blog', label: 'Blog' },
  { to: '/signup', label: 'Get started' },
  { to: '/see-how-it-works', label: 'Live demos' },
] as const
