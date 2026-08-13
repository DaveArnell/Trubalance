import { COMPANY_INFO } from './companyInfo'

export type InquiryTopic = 'general' | 'onboarding' | 'partnership'

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
  partnershipHighlight: {
    heading: 'Partner with Cash Prophet',
    body: 'Accountants, advisers and member organisations can offer clients or members Cash Prophet at 50% off. We handle onboarding and product support.',
    cta: 'Read about partnering',
  },
  topics: [
    { id: 'general' as const, label: 'General enquiry' },
    { id: 'onboarding' as const, label: 'Free personal onboarding' },
    { id: 'partnership' as const, label: 'Partner with Cash Prophet' },
  ],
  form: {
    nameLabel: 'Your name',
    emailLabel: 'Email',
    businessLabel: 'Business name (optional)',
    organisationLabel: 'Organisation name (optional)',
    websiteLabel: 'Website (optional)',
    phoneLabel: 'Phone (optional)',
    topicLabel: 'What can we help with?',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us a little about your business, or what you need help with.',
    partnershipMessagePlaceholder:
      'Tell us who you support (clients or members), and how you would like to offer Cash Prophet.',
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
  {
    q: 'Can my practice or organisation partner with Cash Prophet?',
    a: 'Yes. We offer an exclusive 50% discount for clients or members of suitable partners. See Partner with Cash Prophet, then enquire with that topic selected.',
  },
] as const
