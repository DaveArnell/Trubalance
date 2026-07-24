/** SEO copy for public marketing routes (used with usePageMeta + build-time HTML shells). */

export const SITE_OG_IMAGE = '/og-image.webp' as const
export const SITE_OG_IMAGE_ALT =
  'Cash Prophet — Available Balance you can trust for UK business owners' as const
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
  title: 'Available Balance for UK Businesses | Cash Prophet',
  description:
    'See what cash is genuinely available after known commitments — not just your bank balance. Cash Prophet keeps an Available Balance you can trust every day.',
  path: '/',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const PRICING_SEO = {
  title: 'Cash Prophet Pricing | Solo, Multi-site & Group Plans',
  description:
    'Cash Prophet plans from £10/month: Solo, Multi-site, and Multi-business / Group. Rolling monthly or annual (2 months free). Start with a free trial.',
  path: '/pricing',
  imageAlt: 'Cash Prophet pricing — plans for solo, multi-site and group businesses',
} as const satisfies RouteSeo

export const HOW_IT_WORKS_SEO = {
  title: 'How Available Balance Works | Cash Prophet Method',
  description:
    'How Cash Prophet turns known costs, reserves and light habits into one Available Balance. Accruing commitments, Reserve Planner, and a calm daily rhythm explained.',
  path: '/how-it-works',
  imageAlt: 'How Cash Prophet Available Balance works for UK business owners',
} as const satisfies RouteSeo

/** /habits redirects here — keep unique copy for any lingering links/sitemap. */
export const HABITS_SEO = {
  title: 'Daily Cash Habits for Business Owners | Cash Prophet',
  description:
    'A light daily balance update and a short monthly reserve review keep your Available Balance honest. Now part of How it works on Cash Prophet.',
  path: '/habits',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const WHO_FOR_SEO = {
  title: 'Cash Clarity for UK Business Owners | Who Cash Prophet Is For',
  description:
    'Cash Prophet suits owners who manage from the bank app and mentally subtract what is coming. Confidence without complex forecasting spreadsheets.',
  path: '/who-its-for',
  imageAlt: 'Who Cash Prophet is for — UK business owners managing cash day to day',
} as const satisfies RouteSeo

export const SEE_HOW_SEO = {
  title: 'Cash Prophet Live Demo | Try Available Balance with Sample Businesses',
  description:
    'Open café, trades or leisure demos and see known commitments organised, reserves building, and one Available Balance you can trust.',
  path: '/see-how-it-works',
  imageAlt: 'Try Cash Prophet with live demo businesses',
} as const satisfies RouteSeo

export const BLOG_INDEX_SEO = {
  title: 'Business Cash Flow Blog | Available Balance Guides | Cash Prophet',
  description:
    'Guides on bank balance vs available cash, VAT reserves, committed funds, and cash clarity for UK small business owners — from the Cash Prophet team.',
  path: '/blog',
  imageAlt: 'Cash Prophet blog — cash clarity and Available Balance for UK businesses',
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
  title: 'Log In to Cash Prophet | Access Your Available Balance',
  description: 'Log in to your Cash Prophet workspace and pick up your Available Balance where you left off.',
  path: '/login',
  noindex: true,
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const SIGNUP_SEO = {
  title: 'Start Free Trial | Cash Prophet Available Balance for UK Businesses',
  description:
    'Create your Cash Prophet account. Three months free, guided onboarding, and an Available Balance you can rely on for everyday decisions.',
  path: '/signup',
  imageAlt: 'Start a free Cash Prophet trial for your UK business',
} as const satisfies RouteSeo

export const FORGOT_PASSWORD_SEO = {
  title: 'Forgot Password | Cash Prophet',
  description: 'Reset your Cash Prophet password and get back to your Available Balance workspace.',
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
  title: 'Interactive Cash Prophet Demo | Sample Business Available Balance',
  description:
    'Explore Cash Prophet in a sample business: organised commitments, reserves and one Available Balance for spending decisions.',
  path: '/demo',
  noindex: true,
  imageAlt: 'Interactive Cash Prophet demo workspace',
} as const satisfies RouteSeo

export const APP_SEO = {
  title: 'Cash Prophet Dashboard | Your Available Balance Workspace',
  description: 'Your Cash Prophet workspace — Available Balance, commitments, reserves and cash outlook.',
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
