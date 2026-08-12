import { COMPANY_INFO } from './companyInfo'

export type InquiryTopic = 'general' | 'onboarding'

export const CONTACT_PAGE = {
  title: 'Enquire or book free onboarding',
  lead:
    'Questions about Cash Prophet, or want a personal walkthrough so you start with a Cash Prophet Balance you trust? Send a short note — we arrange a time by email. No booking calendar.',
  emailLabel: 'Or email us directly',
  email: COMPANY_INFO.contactEmail,
  onboardingHighlight: {
    heading: 'Free personal onboarding',
    body: 'At this stage every new customer can book a free 30–60 minute setup session. We help you get balances, commitments and reserves in place, and you have a real person to ask when something is unclear.',
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
    messagePlaceholder:
      'Tell us a little about your business, or when you are generally free for a call.',
    submit: 'Send enquiry',
    submitting: 'Sending…',
    successTitle: 'Thanks — we have your enquiry',
    successBody:
      'We will reply by email to arrange next steps. If you asked for onboarding, we will suggest a few times that work.',
    errorFallback: `Something went wrong sending the form. Email us at ${COMPANY_INFO.contactEmail} and we will help.`,
  },
} as const

export const CONTACT_FAQS = [
  {
    q: 'Is personal onboarding really free?',
    a: 'Yes. While we are growing Cash Prophet, personal onboarding is free. A short session to get you set up properly is worth it for both of us.',
  },
  {
    q: 'Do I need to pick a time on a calendar?',
    a: 'No. Tell us you want onboarding (and roughly when suits you). We will arrange a time by email — no self-serve booking grid.',
  },
  {
    q: 'Can I start the free trial without onboarding?',
    a: 'Absolutely. Use Start free anytime. Onboarding is optional when you want a guided setup and a person to ask.',
  },
] as const
