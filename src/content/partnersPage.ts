/**
 * Partner with Cash Prophet — B2B landing for accountants, advisers and organisations.
 */

export const PARTNERS_PAGE = {
  path: '/partners',
  navLabel: 'Partners',
  hero: {
    title: 'Give your clients greater financial clarity',
    lead:
      'Partner with Cash Prophet and give your clients or members access to a simple day-to-day financial clarity tool at an exclusive 50% discount.',
    primaryCta: 'Talk to us about partnering',
    secondaryCta: 'See how Cash Prophet works',
  },
  who: {
    heading: 'Who this is for',
    lead: 'One partnership proposition for organisations that support small businesses.',
    audiences: [
      {
        title: 'Accountants & bookkeepers',
        body: 'Practices that want clients to stay clearer between reporting cycles.',
      },
      {
        title: 'Finance professionals',
        body: 'Fractional FDs and finance leads supporting owner-managed businesses.',
      },
      {
        title: 'Business advisers & coaches',
        body: 'Advisers helping owners make better day-to-day decisions.',
      },
      {
        title: 'Membership & trade organisations',
        body: 'Groups offering members practical tools alongside advice and community.',
      },
    ],
  },
  alongside: {
    heading: 'Financial clarity between the accounts',
    lead:
      'Cash Prophet is not accounting or bookkeeping software. It does not replace the professional reporting, compliance and advice you provide.',
    body: [
      'Accountants and bookkeepers give businesses essential structure: records, reports, compliance and professional judgement.',
      'Cash Prophet sits alongside that work. It gives the owner a lightweight way to stay aware of their financial position day to day, without asking them to run a second finance system.',
    ],
    accounting: {
      label: 'Accounting & bookkeeping',
      points: ['Reporting', 'Compliance', 'Professional advice'],
    },
    cashProphet: {
      label: 'Cash Prophet',
      points: ['Day-to-day financial awareness', 'Clearer available position', 'Quiet ongoing habit'],
    },
  },
  clientBenefit: {
    heading: 'Why clients find it useful',
    lead:
      'A business bank balance can look reassuring while a large share of that money is already spoken for.',
    points: [
      'See how much of the bank balance is already committed',
      'Account for recurring costs as they build between payment dates',
      'Stay aware of upcoming regular bills',
      'Provision for larger future costs',
      'Get a clearer day-to-day financial position',
      'Track the Cash Prophet Balance over time without the noise of payment timing',
    ],
  },
  partnerBenefit: {
    heading: 'An additional benefit you can offer your clients',
    lead: 'A practical exclusive offer, with Cash Prophet carrying the product work.',
    points: [
      'Your clients or members receive 50% off Cash Prophet',
      'Cash Prophet provides personal onboarding',
      'Cash Prophet handles ongoing product questions and support',
      'You are not expected to support the product yourself',
      'You can offer a clear, useful benefit without adding operational load',
    ],
  },
  snapshot: {
    heading: 'See the principle in two minutes',
    lead:
      'The free Cash Prophet Snapshot lets you enter a sample bank balance and regular bills, then see how amounts already accrued against those bills change the apparent financial position.',
    cta: 'Try the free snapshot',
  },
  how: {
    heading: 'How a partnership works',
    steps: [
      {
        title: 'Talk to us',
        body: 'We discuss your clients or members and whether Cash Prophet is a good fit.',
      },
      {
        title: 'We arrange your offer',
        body: 'Your clients or members receive an exclusive 50% Cash Prophet discount.',
      },
      {
        title: 'You share the benefit',
        body: 'We provide the link, code or materials you need.',
      },
      {
        title: 'We take it from there',
        body: 'Cash Prophet handles onboarding and ongoing product support.',
      },
    ],
  },
  cta: {
    heading: 'Interested in offering Cash Prophet to your clients or members?',
    body: 'We are happy to discuss how a partnership could work for your organisation.',
    button: 'Enquire about partnering',
  },
} as const

export const PARTNERS_FAQS = [
  {
    q: 'Does Cash Prophet replace accounting or bookkeeping software?',
    a: 'No. It is a financial clarity tool for the business owner, used alongside existing accounting and bookkeeping arrangements.',
  },
  {
    q: 'Will we need to support the product for clients?',
    a: 'No. Cash Prophet handles personal onboarding and ongoing product support directly with the client.',
  },
  {
    q: 'What do clients or members receive?',
    a: 'Access to Cash Prophet at an exclusive 50% discount through your partnership offer.',
  },
] as const
