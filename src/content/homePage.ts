/**
 * Homepage marketing copy — product first, then recognition, how, outcome.
 */

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  headline: 'Know exactly what your business can afford today.',
  headlineStart: 'Know exactly what your business',
  headlineHighlight: 'can afford today.',
  subheading: [
    'Your accountant tells you what happened. Your bank tells you what’s in the account. Cash Prophet tells you what you’ve actually got available after allowing for the commitments your business has already made.',
    'Instead of mentally subtracting payroll, VAT, rent, insurance and everything else before making a decision, you see one number you can actually trust.',
  ],
  primaryCta: 'Start free',
  secondaryCta: 'See how it works',
} as const

/** Recognition — why the bank balance isn’t enough */
export const HOME_NEED = {
  heading: "Why business owners don't trust their bank balance",
  body: [
    'Opening your banking app should answer a simple question: can I afford this? Instead, you start thinking through payroll next week, VAT due soon, rent coming out, insurance renewing next month, and the supplier you’ve already promised to pay.',
    'The bank balance doesn’t know any of that. So every decision starts with the same mental calculation — you work it out yourself before you trust the number on the screen.',
    'That isn’t a bookkeeping problem. It’s an information problem.',
  ],
} as const

/** How Cash Prophet works */
export const HOME_DOES = {
  heading: 'What Cash Prophet does differently',
  body: [
    'Cash Prophet keeps track of those commitments for you. Regular bills build up every day instead of appearing as a surprise when they’re due. Annual costs are spread across the year using the Reserve Planner. Expected income is included when it’s realistic.',
    'The result is one figure that reflects your real financial position today, not just your bank balance. That’s the number you use when deciding whether to spend, invest, recruit or wait.',
  ],
} as const

/** Outcome */
export const HOME_OUTCOME = {
  heading: 'What changes',
  body: [
    'Before Cash Prophet, checking the bank starts another round of calculations. After Cash Prophet, the thinking has already been done.',
    'You know your bills are being accounted for. You know your future costs are building in. You know what is genuinely available. You spend less time worrying about money and more time running the business.',
  ],
} as const

/** Positioning beside existing tools */
export const HOME_WHY_IT_WORKS = {
  heading: 'Why it works',
  body: [
    'Cash Prophet doesn’t replace your accountant. It doesn’t replace your bookkeeping software. It doesn’t replace your bank. Each of those tools answers a different question.',
  ],
  items: [
    {
      title: 'Your accountant',
      body: 'Tells you how the business has performed.',
    },
    {
      title: 'Your bookkeeping',
      body: 'Records what has happened.',
    },
    {
      title: 'Your bank',
      body: 'Shows today’s cash balance.',
    },
  ],
  close:
    'Cash Prophet answers the question none of them answer: what can I actually afford today?',
} as const

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: 'I built Cash Prophet because I had exactly this problem',
  body: [
    'Even with bookkeeping, accountants and banking apps, I still found myself checking the bank and mentally working through everything that was coming up before making even small decisions.',
    'I realised the problem wasn’t a lack of financial information. It was that none of my tools kept track of the commitments I’d already made in a way that helped me make decisions today.',
    'Cash Prophet is the tool I wish I’d had years ago.',
  ],
} as const

export const HOME_CTA = {
  heading: 'See what you’ve actually got available',
  body: 'Cash Prophet keeps track of the money your business has already committed, so you get a number you can actually trust. Start free, or see how it works first.',
} as const
