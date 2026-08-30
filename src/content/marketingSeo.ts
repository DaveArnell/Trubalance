/** SEO copy for public marketing routes — Brand & Product Foundation. */

export const SITE_OG_IMAGE = '/og-image.webp' as const
export const SITE_OG_IMAGE_ALT =
  'Cash Prophet on a monitor: Cash Prophet Balance, monthly accruing bills with progress fills, due bills, receipts, balance trend and reserve planner sawtooth.' as const
export const SITE_OG_IMAGE_WIDTH = 1200
export const SITE_OG_IMAGE_HEIGHT = 630

/** Monitor product shot for the homepage snapshot band (no share-card branding panel). */
export const PRODUCT_MONITOR_IMAGE = '/product-monitor.webp' as const
export const PRODUCT_MONITOR_IMAGE_ALT =
  'Cash Prophet dashboard on a computer monitor: Cash Prophet Balance, accruing bills with progress fills, due bills, receipts, balance trend and Reserve Planner' as const
export const PRODUCT_MONITOR_IMAGE_WIDTH = 1536
export const PRODUCT_MONITOR_IMAGE_HEIGHT = 1024

/** Monitor cutout with transparent background for the homepage hero stack. */
export const PRODUCT_MONITOR_CUTOUT_IMAGE = '/product-monitor-cutout.png' as const
export const PRODUCT_MONITOR_CUTOUT_IMAGE_ALT = PRODUCT_MONITOR_IMAGE_ALT
export const PRODUCT_MONITOR_CUTOUT_IMAGE_WIDTH = 1050
export const PRODUCT_MONITOR_CUTOUT_IMAGE_HEIGHT = 911

/** Screen-only crop of the product monitor, used in the homepage hero. */
export const PRODUCT_DASHBOARD_IMAGE = '/product-dashboard.png' as const
export const PRODUCT_DASHBOARD_IMAGE_ALT =
  'Cash Prophet dashboard: Cash Prophet Balance, accruing costs, due bills, balance trend and Reserve Planner' as const
export const PRODUCT_DASHBOARD_IMAGE_WIDTH = 860
export const PRODUCT_DASHBOARD_IMAGE_HEIGHT = 500

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
  title: 'Cash Prophet | Financial organiser for hospitality & leisure',
  description:
    'Cash Prophet is a financial organiser for independent hospitality and leisure businesses. Keep track of what is coming up, what to put aside, where you stand and where you are heading.',
  path: '/',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const EARLY_ACCESS_SEO = {
  title: 'Join Early Access | Cash Prophet',
  description:
    'Join Cash Prophet Early Access. Get personally set up with your financial picture, or create an account in your own time.',
  path: '/early-access',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const PRICING_SEO = {
  title: 'Cash Prophet Pricing | Solo, Multi-site & Group Plans',
  description:
    'Cash Prophet plans from £24/month + VAT: Solo, Multi-site, and Multi-business / Group. Rolling monthly or annual (2 months free). Start with a free trial.',
  path: '/pricing',
  imageAlt: 'Cash Prophet pricing — plans for solo, multi-site and group businesses',
} as const satisfies RouteSeo

export const HOW_IT_WORKS_SEO = {
  title: 'How Cash Prophet Works | Cash Prophet',
  description:
    'How Cash Prophet keeps your financial picture current: regular costs that build before payday, the Reserve Planner for larger costs, and your Cash Prophet Balance.',
  path: '/how-it-works',
  imageAlt: 'How Cash Prophet keeps a financial picture current for UK business owners',
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
  title: 'Who Cash Prophet Is For | Cash Prophet',
  description:
    'Cash Prophet is for business owners who check the bank and still cannot tell what is safe to spend. One trusted daily number, without replacing your accountant.',
  path: '/who-its-for',
  imageAlt: 'Who Cash Prophet is for',
} as const satisfies RouteSeo

export const CAFES_SEO = {
  title: 'Automated Budgeting for Cafes and Coffee Shops | Cash Prophet',
  description:
    'Cafe and coffee shop budgeting that accounts for wages, rent and regular costs as they build up. See a trusted cash position, keep bills in view, and follow the direction over time with the Cash Prophet Balance.',
  path: '/cafes',
  imageAlt: 'Automated budgeting for cafes and coffee shops with Cash Prophet Balance',
} as const satisfies RouteSeo

export const SEE_HOW_SEO = {
  title: 'Cash Prophet Live Demo | Try Cash Prophet Balance',
  description:
    'Open leisure, café or sample demos and see meaningful commitments accounted for — and one Cash Prophet Balance you can trust.',
  path: '/see-how-it-works',
  imageAlt: 'Try Cash Prophet with live demo businesses',
} as const satisfies RouteSeo

export const CONTACT_SEO = {
  title: 'Enquire or Book Free Onboarding | Cash Prophet',
  description:
    'Enquire about Cash Prophet or book a free 30 to 60 minute personal onboarding session. hello@cashprophet.co.uk',
  path: '/contact',
  imageAlt: 'Contact Cash Prophet for enquiries and free personal onboarding',
} as const satisfies RouteSeo

export const TRY_IT_SEO = {
  title: 'Free Cash Position Check | How Much Is Actually Yours | Cash Prophet',
  description:
    'Free interactive check: enter your bank balance and bills to see how much is already spoken for, and what is actually yours today. No account needed.',
  path: '/try-it',
  imageAlt: 'Free Cash Prophet cash position check for UK small businesses',
} as const satisfies RouteSeo

export const PARTNERS_SEO = {
  title: 'Partner with Cash Prophet | Accountants, Advisers & Member Organisations',
  description:
    'Offer your clients or members Cash Prophet at 50% off. A day-to-day financial clarity tool that sits alongside accounting and bookkeeping. We handle onboarding and support.',
  path: '/partners',
  imageAlt: 'Partner with Cash Prophet for UK small business clients and members',
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
  title: 'Set up Cash Prophet yourself | Cash Prophet',
  description:
    'Create your Cash Prophet account and get your financial picture organised. 30 days free, no card required. Personal setup is free during Early Access.',
  path: '/signup',
  imageAlt: 'Set up a Cash Prophet account for your UK business',
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
  EARLY_ACCESS_SEO,
  PRICING_SEO,
  HOW_IT_WORKS_SEO,
  WHO_FOR_SEO,
  CAFES_SEO,
  SEE_HOW_SEO,
  CONTACT_SEO,
  TRY_IT_SEO,
  PARTNERS_SEO,
  BLOG_INDEX_SEO,
  PRIVACY_SEO,
  TERMS_SEO,
  SIGNUP_SEO,
]
