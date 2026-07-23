/**
 * Homepage marketing copy — recognition and invitation.
 * Methodology lives on /how-it-works. Persuasion depth on /cash-prophet.
 */

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  headline: 'Stop carrying your business finances around in your head.',
  headlineStart: 'Stop carrying your business finances',
  headlineHighlight: 'around in your head.',
  subheading: [
    "You already know what's coming. Payroll. VAT. Rent. Insurance.",
    "Cash Prophet keeps track of those commitments for you, so you always know what's genuinely available to spend.",
  ],
  note: 'Less stress. More confidence. One number you can trust.',
  compare: {
    bank: {
      label: 'Bank balance',
      showsLabel: 'Shows',
      shows: 'Money in the account today.',
      gapLabel: "Doesn't know",
      gap: ['Payroll.', 'VAT.', 'Rent.', 'Insurance.'],
    },
    prophet: {
      label: 'Cash Prophet',
      body: "Keeps track of everything you've already committed to.",
      outcome: 'Shows one number you can actually make decisions from.',
    },
  },
} as const

/** Shared recognition — normalise the bank-check loop before introducing Cash Prophet */
export const HOME_WHO_FOR = {
  heading: "You're not unusual for doing it",
  lead: [
    'This is how most owner-managed businesses work.',
    "You don't have a finance team watching every commitment.",
    'So your bank balance becomes the quick check, and your head fills in the rest.',
  ],
  points: [
    "You rely on your bank balance because it's the fastest thing to check",
    'You already know the big bills that are coming',
    'You subtract them in your head every time you look',
    "You'd rather spend time running the business than bookkeeping",
    "You're not bad with money. You're carrying too much information in your head",
  ],
} as const

/** Why that loop creates stress */
export const HOME_STRESS = {
  eyebrow: 'What that does to you',
  heading: 'Which is why opening the bank never feels settled',
  lead: "You're not reading a number. You're arguing with yourself.",
  points: [
    {
      title: 'The balance looks fine',
      body: [
        "There's money in the account.",
        "But that isn't the same as money that's free to spend.",
      ],
    },
    {
      title: "But you already know what's coming",
      body: [
        'Payroll.',
        'Rent.',
        'VAT.',
        'Insurance.',
        "Your brain starts subtracting before you've even closed the banking app.",
      ],
    },
    {
      title: 'So you never quite relax',
      body: [
        "That's why checking the bank never feels finished.",
        "You're still trying to work out what's really available.",
      ],
    },
  ],
} as const

/** Relief: introduce Cash Prophet as the answer */
export const HOME_RELIEF = {
  eyebrow: 'What changes',
  heading: 'Cash Prophet takes that loop off you',
  lead: '',
  points: [
    {
      title: 'The checklist leaves your head',
      body: ["Cash Prophet remembers the commitments, so you don't have to."],
    },
    {
      title: 'You stop doing the mental maths',
      body: [
        "Instead of decoding the bank balance, you see what's genuinely available.",
      ],
    },
    {
      title: 'Everything feels calmer',
      body: [
        'Nothing magical has happened.',
        'You simply know where you stand.',
      ],
    },
  ],
} as const

/** Why it works beside existing tools */
export const HOME_WHY_IT_WORKS = {
  heading: "It doesn't replace what you already trust",
  lead: [
    "Cash Prophet isn't trying to replace your accountant or your bank.",
    'It answers the question neither of them was designed to answer.',
  ],
  items: [
    {
      title: 'Bookkeeping',
      body: 'Looks after the past. What happened. What was owed. What got paid.',
    },
    {
      title: 'Your bank balance',
      body: "Shows where money sits today. It can't tell you how much of it is already spoken for.",
    },
    {
      title: 'Cash Prophet',
      body: 'Holds the commitments you know about, and shows what’s left to work with.',
    },
  ],
} as const

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: 'I’ve lived with that bank-check worry for years',
  body: [
    'I built Cash Prophet because I was tired of second-guessing my own bank balance.',
    'The accounts were up to date.',
    'The business was healthy.',
    'But I was still asking myself the same questions every time I opened the banking app.',
    'Can I afford this?',
    "What's already spoken for?",
    'Have I forgotten something?',
    "I realised I wasn't looking for another bookkeeping system.",
    'I just wanted one number I could trust.',
  ],
} as const

export const HOME_CTA = {
  heading: 'Ready to stop carrying it around in your head?',
  body: 'Start free today, or see Cash Prophet with a real business before you decide.',
} as const

/** @deprecated aliases */
export const HOME_WHAT_IT_DOES = HOME_RELIEF
export const HOME_BANK_GAP = HOME_STRESS
