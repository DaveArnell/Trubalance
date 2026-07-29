/** SEO copy for public marketing routes — Brand & Product Foundation. */

export const SITE_OG_IMAGE = '/og-image.webp' as const
export const SITE_OG_IMAGE_ALT =
  'Cash Prophet on a monitor — Cash Prophet Balance, monthly accruing bills with progress fills, due bills, receipts, balance trend and reserve planner sawtooth.' as const
export const SITE_OG_IMAGE_WIDTH = 1200
export const SITE_OG_IMAGE_HEIGHT = 630

export type RouteSeo = {
  title: string
  description: string
  path: string
  noindex?: boolean
  type?: 'website' | 'article'
  image?: string
  imageAlt?: string
}

/** Primary keyword near the front; brand at the end when not already in the title. */
export const HOME_SEO = {
  title: 'Cash Prophet | A daily financial position you can trust',
  description:
    'Cash Prophet is financial management software that helps business owners understand where their business really stands by continuously accounting for meaningful financial commitments.',
  path: '/',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const PRICING_SEO = {
  title: 'Cash Prophet Pricing | Solo, Multi-site & Group Plans',
  description:
    'Cash Prophet plans from £10/month + VAT: Solo, Multi-site, and Multi-business / Group. Rolling monthly or annual (2 months free). Start with a free trial.',
  path: '/pricing',
  imageAlt: 'Cash Prophet pricing — plans for solo, multi-site and group businesses',
} as const satisfies RouteSeo

export const HOW_IT_WORKS_SEO = {
  title: 'How Cash Prophet Balance Works | Cash Prophet',
  description:
    'How Cash Prophet continuously accounts for meaningful financial commitments to calculate your Cash Prophet Balance. Accruing costs, Reserve Planner, and a calm daily rhythm.',
  path: '/how-it-works',
  imageAlt: 'How Cash Prophet Balance works for UK business owners',
} as const satisfies RouteSeo

/** /habits redirects here — keep unique copy for any lingering links/sitemap. */
export const HABITS_SEO = {
  title: 'Daily Cash Habits for Business Owners | Cash Prophet',
  description:
    'A light daily balance update and a short monthly reserve review keep your Cash Prophet Balance honest. Now part of How it works on Cash Prophet.',
  path: '/habits',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const WHO_FOR_SEO = {
  title: 'Who Cash Prophet Is For | Consistent-Income UK Businesses',
  description:
    'Cash Prophet is for leisure, hospitality, gyms, childcare, subscriptions and other businesses with relatively consistent income — so you can trust one financial number every day.',
  path: '/who-its-for',
  imageAlt: 'Who Cash Prophet is for — UK businesses with consistent income',
} as const satisfies RouteSeo

export const SEE_HOW_SEO = {
  title: 'Cash Prophet Live Demo | Try Cash Prophet Balance',
  description:
    'Open leisure, café or sample demos and see meaningful commitments accounted for — and one Cash Prophet Balance you can trust.',
  path: '/see-how-it-works',
  imageAlt: 'Try Cash Prophet with live demo businesses',
} as const satisfies RouteSeo

export const BLOG_INDEX_SEO = {
  title: 'Business Financial Clarity Blog | Cash Prophet Balance | Cash Prophet',
  description:
    'Guides on bank balance vs financial position, VAT reserves, committed funds, and why every business deserves one financial number it can trust.',
  path: '/blog',
  imageAlt: 'Cash Prophet blog — Cash Prophet Balance for UK businesses',
} as const satisfies RouteSeo

export const PRIVACY_SEO = {
  title: 'Privacy Policy | Cash Prophet (Vocatio Ltd)',
  description:
    'How Cash Prophet, operated by Vocatio Ltd, collects, stores and protects account and workspace data. UK GDPR-aligned privacy policy.',
  path: '/privacy',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const TERMS_SEO = {
  title: 'Terms of Service | Cash Prophet (Vocatio Ltd)',
  description:
    'Terms of use for Cash Prophet, operated by Vocatio Ltd. Accounts, trials, acceptable use and UK jurisdiction.',
  path: '/terms',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const LOGIN_SEO = {
  title: 'Log In to Cash Prophet',
  description:
    'Log in to your Cash Prophet workspace and pick up your Cash Prophet Balance where you left off.',
  path: '/login',
  noindex: true,
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const SIGNUP_SEO = {
  title: 'Start Free Trial | Cash Prophet',
  description:
    'Create your Cash Prophet account. Three months free, guided onboarding, and a Cash Prophet Balance that shows where your business really stands.',
  path: '/signup',
  imageAlt: 'Start a free Cash Prophet trial for your UK business',
} as const satisfies RouteSeo

export const FORGOT_PASSWORD_SEO = {
  title: 'Forgot Password | Cash Prophet',
  description: 'Reset your Cash Prophet password and get back to your workspace.',
  path: '/forgot-password',
  noindex: true,
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const RESET_PASSWORD_SEO = {
  title: 'Set a New Password | Cash Prophet',
  description: 'Choose a new password for your Cash Prophet account.',
  path: '/reset-password',
  noindex: true,
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const DEMO_SEO = {
  title: 'Interactive Cash Prophet Demo',
  description:
    'Explore Cash Prophet in a sample business: organised commitments, reserves and one Cash Prophet Balance.',
  path: '/demo',
  noindex: true,
  imageAlt: 'Interactive Cash Prophet demo workspace',
} as const satisfies RouteSeo

export const APP_SEO = {
  title: 'Cash Prophet Dashboard',
  description:
    'Your Cash Prophet workspace — Cash Prophet Balance, commitments, reserves and cash outlook.',
  path: '/app',
  noindex: true,
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

/** Public indexable marketing routes used by the build-time HTML shell generator. */
export const PUBLIC_ROUTE_SEO: readonly RouteSeo[] = [
  HOME_SEO,
  PRICING_SEO,
  HOW_IT_WORKS_SEO,
  WHO_FOR_SEO,
  SEE_HOW_SEO,
  BLOG_INDEX_SEO,
  PRIVACY_SEO,
  TERMS_SEO,
  SIGNUP_SEO,
]
