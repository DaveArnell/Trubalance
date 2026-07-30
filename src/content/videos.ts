/**
 * Central video library.
 * For now, only the homepage marketing clip is wired in the product UI.
 * Onboarding / guided-tour clips are deferred until the homepage video is live
 * and we see where people actually struggle — keep entries here as a backlog.
 *
 * Paste Vimeo (or YouTube) watch URLs into `url` as clips go live.
 * Empty / omitted url → homepage shows the intentional “coming soon” placeholder.
 *
 * Scripts and shot lists: docs/videos/
 */

export type VideoKey =
  | 'homepage'
  | 'onboarding-welcome'
  | 'onboarding-structure'
  | 'onboarding-monthly-costs'
  | 'onboarding-month-view'
  | 'onboarding-due'
  | 'onboarding-receipts'
  | 'onboarding-reserve'
  | 'onboarding-trends'
  | 'onboarding-statement'

export type VideoEntry = {
  key: VideoKey
  /** Customer-facing label on placeholders and iframe titles */
  label: string
  /** Target length for production */
  durationTarget: string
  /**
   * Vimeo or YouTube URL. Leave empty until the clip is published.
   * Example: 'https://vimeo.com/123456789'
   */
  url: string
}

export const VIDEO_LIBRARY: Record<VideoKey, VideoEntry> = {
  homepage: {
    key: 'homepage',
    label: 'See Cash Prophet in 90 seconds',
    durationTarget: '60–90s',
    url: '',
  },
  'onboarding-welcome': {
    key: 'onboarding-welcome',
    label: 'Welcome to Cash Prophet',
    durationTarget: '45–75s',
    url: '',
  },
  'onboarding-structure': {
    key: 'onboarding-structure',
    label: 'Businesses, sites and accounts',
    durationTarget: '45–90s',
    url: '',
  },
  'onboarding-monthly-costs': {
    key: 'onboarding-monthly-costs',
    label: 'How monthly costs build',
    durationTarget: '45–90s',
    url: '',
  },
  'onboarding-month-view': {
    key: 'onboarding-month-view',
    label: 'Reading the month chart',
    durationTarget: '45–75s',
    url: '',
  },
  'onboarding-due': {
    key: 'onboarding-due',
    label: 'Paying what is due',
    durationTarget: '45–75s',
    url: '',
  },
  'onboarding-receipts': {
    key: 'onboarding-receipts',
    label: 'Expected receipts',
    durationTarget: '45–75s',
    url: '',
  },
  'onboarding-reserve': {
    key: 'onboarding-reserve',
    label: 'Funding VAT and big bills',
    durationTarget: '60–90s',
    url: '',
  },
  'onboarding-trends': {
    key: 'onboarding-trends',
    label: 'Your balance over time',
    durationTarget: '45–75s',
    url: '',
  },
  'onboarding-statement': {
    key: 'onboarding-statement',
    label: 'Using a bank export with ChatGPT',
    durationTarget: '60–90s',
    url: '',
  },
}

/** Core onboarding set — produce before pushing signups hard. */
export const CORE_ONBOARDING_VIDEO_KEYS: VideoKey[] = [
  'onboarding-welcome',
  'onboarding-structure',
  'onboarding-monthly-costs',
  'onboarding-due',
  'onboarding-receipts',
  'onboarding-trends',
]

/** Follow-up clips after the core set. */
export const FOLLOWUP_ONBOARDING_VIDEO_KEYS: VideoKey[] = [
  'onboarding-month-view',
  'onboarding-reserve',
  'onboarding-statement',
]

/**
 * Map setup-onboarding step ids → library keys.
 * Steps without a mapping hide nothing; they simply have no dedicated clip.
 */
export const SETUP_STEP_VIDEO_KEY: Record<string, VideoKey> = {
  why: 'onboarding-welcome',
  business: 'onboarding-structure',
  'committed-explain': 'onboarding-monthly-costs',
  'month-view': 'onboarding-month-view',
  'due-explain': 'onboarding-due',
  'receipts-explain': 'onboarding-receipts',
  reserve: 'onboarding-reserve',
  'trends-explain': 'onboarding-trends',
  'statement-helper': 'onboarding-statement',
}

/**
 * Reuse onboarding footage on matching guided-tour steps
 * (same URL, tighter context in the tour card copy).
 */
export const TOUR_STEP_VIDEO_KEY: Record<string, VideoKey> = {
  // First-run setup tour
  'setup-balances': 'onboarding-structure',
  'setup-committed': 'onboarding-monthly-costs',
  'setup-due': 'onboarding-due',
  'setup-receipts': 'onboarding-receipts',
  'setup-true-balance': 'onboarding-welcome',

  // Committed Funds page tour
  'cf-hero': 'onboarding-structure',
  'cf-commitments': 'onboarding-monthly-costs',
  'cf-due': 'onboarding-due',
  'cf-receipts': 'onboarding-receipts',

  // Trends
  'tr-chart': 'onboarding-trends',
  'tr-log': 'onboarding-trends',

  // Reserve planner (in use)
  'rp-status': 'onboarding-reserve',
  'rp-buffer': 'onboarding-reserve',
  'rp-month': 'onboarding-reserve',
  'rp-bills': 'onboarding-reserve',
  'rp-chart': 'onboarding-reserve',

  // Reserve intro (empty state)
  'rpi-welcome': 'onboarding-reserve',
  'rpi-how': 'onboarding-reserve',
  'rpi-create': 'onboarding-reserve',

  // Settings
  'st-structure': 'onboarding-structure',
}

export function getVideoEntry(key: VideoKey): VideoEntry {
  return VIDEO_LIBRARY[key]
}

/** Returns a watch URL only when one has been published. */
export function getVideoUrl(key: VideoKey): string | undefined {
  const url = VIDEO_LIBRARY[key].url.trim()
  return url || undefined
}

export function getVideoLabel(key: VideoKey): string {
  return VIDEO_LIBRARY[key].label
}

export function getSetupStepVideo(stepId: string): { url?: string; label: string } | null {
  const key = SETUP_STEP_VIDEO_KEY[stepId]
  if (!key) return null
  return { url: getVideoUrl(key), label: getVideoLabel(key) }
}

export function getTourStepVideo(stepId: string): { url?: string; label: string } | null {
  const key = TOUR_STEP_VIDEO_KEY[stepId]
  if (!key) return null
  return { url: getVideoUrl(key), label: getVideoLabel(key) }
}
