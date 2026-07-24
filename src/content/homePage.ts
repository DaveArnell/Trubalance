/**
 * Homepage marketing copy — Available Balance you can rely on.
 * Benefit first; mechanics support the promise.
 */

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  tagline: "Your business's financial co-pilot.",
  headline: 'Finally, a balance you can trust.',
  headlineStart: 'Finally, a balance',
  headlineHighlight: 'you can trust.',
  subheading: [
    "Your bank balance only shows the money in your account. It doesn't tell you how much has already been committed.",
    'Cash Prophet continuously accounts for those commitments, giving you a balance that reflects where your business really stands. So instead of mentally working everything out yourself, you simply know what your business can safely rely on.',
  ],
  sizzle: 'Less stress. More clarity.',
  primaryCta: 'Start Free',
  secondaryCta: 'See How It Works',
  graphs: {
    bank: {
      tag: 'Bank balance',
      title: 'Looks fine until the payments hit.',
      caption: 'Your bank balance only changes when money moves.',
    },
    prophet: {
      tag: 'Available Balance',
      title: 'Your commitments are already accounted for.',
      caption:
        'Future costs build into your Available Balance, so you see what the business can actually rely on.',
    },
  },
} as const

/** Recognition: bank balance vs what's already committed */
export const HOME_NEED = {
  heading: "Your bank balance tells you what's in the account",
  lead: "It doesn't tell you what's already committed.",
  body: [
    "Every business has money that's already spoken for: payroll, VAT, tax, rent, insurance, supplier payments, annual renewals and equipment replacements. The bank doesn't recognise any of those until the money actually leaves your account.",
    "That's why so many business owners never quite trust the balance they're looking at. Before making almost any decision, they mentally work through everything that's coming before deciding what they can really afford.",
  ],
} as const

/** How Cash Prophet delivers the Available Balance */
export const HOME_DOES = {
  heading: 'Cash Prophet does that work for you',
  body: [
    "Instead of expecting you to remember every future commitment yourself, Cash Prophet continuously accounts for them in the background. Regular costs build into today's financial position. Larger future costs are steadily reserved for instead of arriving all at once. Expected income is reflected where appropriate.",
    "Every day your Available Balance is recalculated to reflect where your business really stands. You no longer have to interpret your bank balance. You have a financial position that's already been interpreted for you.",
  ],
} as const

/** Outcome: confidence from a balance you can trust */
export const HOME_OUTCOME = {
  heading: 'The result is confidence',
  beats: [
    'You know your commitments are already being accounted for.',
    "You know future costs are already building into today's position.",
    "You know the balance you're looking at reflects what your business can realistically afford.",
  ],
  closing:
    'Less second-guessing, fewer financial surprises, and better decisions. Less time worrying about cash, and more time running your business.',
} as const

/** Positioning beside accounting and banking */
export const HOME_WHY_IT_WORKS = {
  heading: 'Why Cash Prophet is different',
  close:
    'By continuously accounting for your financial commitments, it gives you a clearer picture of what your business can safely afford right now. That’s why the Available Balance becomes the number you rely on instead of your bank balance.',
} as const

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: "I built Cash Prophet because I realised I wasn't short of financial information",
  body: [
    'I was short of financial clarity.',
    'Like many business owners, I found myself checking the bank balance and then mentally accounting for payroll, VAT, tax, supplier payments and everything else I knew was coming before I could make even simple decisions.',
    "The information already existed. It just wasn't brought together in a way that helped me decide what the business could actually afford today.",
    'Cash Prophet solves that problem. It quietly keeps track of those commitments for me, so I can stop carrying them in my head and get on with running the business.',
  ],
} as const

export const HOME_CTA = {
  heading: 'Get an Available Balance you can rely on',
  body: "Cash Prophet continuously accounts for your business's financial commitments, so you can make everyday decisions with confidence. Start free, or see how it works first.",
} as const
