/**
 * Early Access gateway copy — personal setup first, self-service second.
 */

export const EARLY_ACCESS_PAGE = {
  heading: 'Join Cash Prophet Early Access',
  intro:
    "Cash Prophet is now open to independent hospitality and leisure businesses.\n\nThe easiest way to get started is with a personal setup. We'll show you how it works with your business and help you get everything organised properly.",
  recommended: {
    label: 'Recommended',
    heading: 'Get personally set up',
    body:
      "We'll take you through Cash Prophet, help you set up your financial picture and answer any questions as we go.",
    cta: 'Book my personal setup',
    support: 'Free during Early Access',
  },
  selfServe: {
    heading: 'Prefer to get started yourself?',
    body:
      'Create your account and explore Cash Prophet in your own time. You can still arrange a personal setup with us whenever you would like some help.',
    cta: 'Set up myself',
  },
} as const

/** Contact enquiry topic used for personal setup bookings. */
export const PERSONAL_SETUP_CONTACT_PATH = '/contact?topic=onboarding' as const
