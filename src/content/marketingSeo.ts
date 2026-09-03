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
    'Cash Prophet is for owner-managed hospitality and leisure businesses where the financial picture still lives in your head. Keep bills, reserves and your underlying position organised.',
  path: '/who-its-for',
  imageAlt: 'Who Cash Prophet is for — owner-managed hospitality and leisure businesses',
} as const satisfies RouteSeo

export const SEE_HOW_SEO = {
  title: 'See Cash Prophet in a Real Business | Cash Prophet',
  description:
    'Explore Cash Prophet through fixed example businesses. See how regular bills, costs building up, bigger expenses and the underlying financial position come together. No signup needed.',
  path: '/see-how-it-works',
  imageAlt: 'Explore Cash Prophet through example hospitality and leisure businesses',
} as const satisfies RouteSeo

export const CONTACT_SEO = {
  title: 'Enquire or Book Free Onboarding | Cash Prophet',
  description:
    'Enquire about Cash Prophet or book a free 30 to 60 minute personal onboarding session. hello@cashprophet.co.uk',
  path: '/contact',
  imageAlt: 'Contact Cash Prophet for enquiries and free personal onboarding',
} as const satisfies RouteSeo

export const TRY_IT_SEO = {
  title: 'Free Check | How Much of Today\'s Bank Balance Is Already Spoken For | Cash Prophet',
  description:
    'Free interactive check: enter your business bank balance and bills to see how much is already spoken for today. One part of the Cash Prophet approach. No account needed.',
  path: '/try-it',
  imageAlt: 'Free Cash Prophet check showing how much of a business bank balance is already spoken for',
} as const satisfies RouteSeo

export const PARTNERS_SEO = {
  title: 'Partner with Cash Prophet | Accountants, Advisers & Member Organisations',
  description:
    'Offer clients or members Cash Prophet at 50% off. A financial organiser for owner-managed businesses that sits alongside accounting and bookkeeping. We handle onboarding and support.',
  path: '/partners',
  imageAlt: 'Partner with Cash Prophet for UK owner-managed business clients and members',
} as const satisfies RouteSeo

export const CAFE_SECTOR_SEO = {
  title: 'Financial Management Software for UK Cafés | Cash Prophet',
  description:
    'Financial management software for independent UK cafés. Organise wages, rent, suppliers and VAT, and see your Cash Prophet Balance — clearer than the bank alone.',
  path: '/cafe-financial-management-software',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const PUB_SECTOR_SEO = {
  title: 'Financial Management Software for UK Pubs & Bars | Cash Prophet',
  description:
    'Financial management software for independent UK pubs and bars. Organise wages, stock, rent and VAT, and see your Cash Prophet Balance — clearer than the bank alone.',
  path: '/pub-financial-management-software',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const RESTAURANT_SECTOR_SEO = {
  title: 'Financial Management Software for UK Restaurants | Cash Prophet',
  description:
    'Financial management software for independent UK restaurants. Organise kitchen payroll, rent, suppliers and VAT, and see your Cash Prophet Balance — clearer than the bank alone.',
  path: '/restaurant-financial-management-software',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const SOFT_PLAY_SECTOR_SEO = {
  title: 'Financial Management Software for Soft Play Centres | Cash Prophet',
  description:
    'Financial management software for UK soft play and leisure venues. Organise staffing, rent, insurance and VAT, and see your Cash Prophet Balance — clearer than the bank alone.',
  path: '/soft-play-financial-management-software',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const BLOG_INDEX_SEO = {
  title: 'Business Finance Guides | Cash Prophet',
  description:
    'Practical guides for owner-managed businesses: bills coming up, money to put aside, the Cash Prophet Balance, and keeping day-to-day finances organised.',
  path: '/blog',
  imageAlt: 'Cash Prophet blog for UK owner-managed businesses',
} as const satisfies RouteSeo

export const PRIVACY_SEO = {
  title: 'Privacy Policy | Cash Prophet (Vocatio Ltd)',
  description:
    'How Cash Prophet collects and uses account, workspace and cookie data. Operated by Vocatio Ltd. UK GDPR privacy policy.',
  path: '/privacy',
  imageAlt: SITE_OG_IMAGE_ALT,
} as const satisfies RouteSeo

export const TERMS_SEO = {
  title: 'Terms of Service | Cash Prophet (Vocatio Ltd)',
  description:
    'Terms for Cash Prophet, a financial organiser for owner-managed businesses. Accounts, subscriptions, acceptable use and UK jurisdiction.',
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
  SEE_HOW_SEO,
  CONTACT_SEO,
  TRY_IT_SEO,
  PARTNERS_SEO,
  CAFE_SECTOR_SEO,
  PUB_SECTOR_SEO,
  RESTAURANT_SECTOR_SEO,
  SOFT_PLAY_SECTOR_SEO,
  BLOG_INDEX_SEO,
  PRIVACY_SEO,
  TERMS_SEO,
  SIGNUP_SEO,
]
