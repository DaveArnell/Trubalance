/** Primary marketing nav — shared by header UI and SiteNavigationElement JSON-LD. */
export const PRIMARY_NAV = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/who-its-for', label: "Who it's for" },
  { to: '/see-how-it-works', label: 'See it' },
  { to: '/try-it', label: 'Try It' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Enquire' },
] as const

/** Extra destinations included in SiteNavigationElement (footer / journey links). */
export const SECONDARY_NAV = [
  { to: '/blog', label: 'Blog' },
  { to: '/signup', label: 'Get started' },
  { to: '/try-it', label: 'Free cash check' },
  { to: '/see-how-it-works', label: 'Live demos' },
  { to: '/contact', label: 'Enquire / onboarding' },
] as const
