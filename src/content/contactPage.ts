import { COMPANY_INFO } from './companyInfo'

export type InquiryTopic = 'general' | 'onboarding'

export const CONTACT_PAGE = {
  title: 'Enquire or book free onboarding',
  /** Kept empty — heading is enough; avoid over-explaining in the hero. */
  lead: '',
  emailLabel: 'Or email us directly',
  email: COMPANY_INFO.contactEmail,
  onboardingHighlight: {
    heading: 'Free personal onboarding',
    body: 'If you would like to book in for a free 30 to 60 minute personal onboarding session, please get in touch. We help you get balances, commitments and reserves in place, and you have a real person to ask when something is unclear.',
  },
  topics: [
    { id: 'general' as const, label: 'General enquiry' },
    { id: 'onboarding' as const, label: 'Free personal onboarding' },
  ],
  form: {
    nameLabel: 'Your name',
    emailLabel: 'Email',
    businessLabel: 'Business name (optional)',
    phoneLabel: 'Phone (optional)',
    topicLabel: 'What can we help with?',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us a little about your business, or what you need help with.',
    submit: 'Send enquiry',
    submitting: 'Sending…',
    successTitle: 'Thanks — we have your enquiry',
    successBody: 'We will reply by email to arrange next steps.',
    errorFallback: `Something went wrong sending the form. Email us at ${COMPANY_INFO.contactEmail} and we will help.`,
  },
} as const

export const CONTACT_FAQS = [
  {
    q: 'Is personal onboarding really free?',
    a: 'Yes. A short session to get you set up properly is included — get in touch when you are ready.',
  },
  {
    q: 'Can I start the free trial without onboarding?',
    a: 'Absolutely. Use Start free anytime. Onboarding is there when you want a guided setup and a person to ask.',
  },
] as const
