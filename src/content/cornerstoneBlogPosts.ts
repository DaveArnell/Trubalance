import type { BlogPost } from './blogTypes'

const CTA =
  'Cash Prophet keeps the day-to-day financial picture organised in one place: regular costs building through the month, larger future costs to prepare for, and the Cash Prophet Balance. It sits alongside your accounting software; it does not replace it.'

/**
 * Ten SEO cornerstone articles, owning "bank balance isn't available cash"
 * and related UK small business cash management searches.
 */
export const CORNERSTONE_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'your-bank-balance-is-lying-to-you',
    title: 'Your Bank Balance Is Lying To You',
    metaDescription:
      'Your business bank balance is accurate for cash in the bank, but incomplete as the whole picture. What UK owners should check instead.',
    keywords: [
      'bank balance is lying',
      'bank balance isnt available cash',
      'managing business cash',
      'UK small business cash',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'A healthy balance in the banking app can still leave you short. The number looks fine because it ignores what is already spoken for.',
    relatedSlugs: [
      'bank-balance-isnt-your-money',
      'bank-balance-vs-available-cash',
      'how-much-money-does-my-business-actually-have',
    ],
    sections: [
      {
        type: 'p',
        text: 'You open the bank app, the number looks fine, and you approve a purchase, hire or dividend. Two weeks later payroll and VAT land and the comfort vanishes. The balance was not wrong, it was incomplete.',
      },
      {
        type: 'h2',
        text: 'What the bank balance never shows',
      },
      {
        type: 'ul',
        items: [
          'Payroll and PAYE already accruing toward payday',
          'VAT building for the quarter, even before the return is due',
          'Rent, finance agreements and software still owed this month',
          'Corporation tax or insurance you know is coming',
        ],
      },
      {
        type: 'h2',
        text: 'Organise the picture instead',
      },
      {
        type: 'p',
        text: 'Cash Prophet helps you keep commitments, reserves and expected receipts in one place, then shows your Cash Prophet Balance after those are counted. Before you treat the bank total as the whole story, check what is building up, what is Due, and what you are setting aside for tax.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is my bank balance wrong?',
            a: 'No, it is accurate as a cash total. It is incomplete as a picture of where the business stands, because it ignores commitments and reserves.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'bank-balance-isnt-your-money',
    title: 'Bank Balance Isn\u2019t Your Money',
    metaDescription:
      'Bank balance isnt your money until you account for committed costs and tax set asides. The distinction that changes how UK owners read their position.',
    keywords: [
      'bank balance isnt your money',
      'committed money',
      'how much cash is available in my business',
      'Cash Prophet Balance',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Cash in the account is real. Treating it as your full financial position is not, until payroll, VAT and suppliers are covered.',
    relatedSlugs: [
      'your-bank-balance-is-lying-to-you',
      'committed-funds-explained',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: '"Bank balance isn\u2019t your money" sounds dramatic until you have been caught by VAT, payday, or a bill you knew was coming. The cash was sitting there. It just was not free.',
      },
      {
        type: 'h2',
        text: 'Committed funds vs Cash Prophet Balance',
      },
      {
        type: 'ul',
        items: [
          'Committed funds: already building or owed (payroll, VAT, rent, reserves)',
          'Cash Prophet Balance: where you stand after those obligations',
          'Bank balance: the cash total that mixes free and spoken-for money together',
        ],
      },
      {
        type: 'h2',
        text: 'Where does the business really stand?',
      },
      {
        type: 'p',
        text: 'That is the real question owners mean when they check their phone. Cash Prophet keeps the answer organised: cash now, minus committed funds, plus only receipts you can realistically expect. Use that Cash Prophet Balance for Tuesday decisions, not the raw bank total alone.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Does this mean I cannot spend?',
            a: 'No. It means deciding from an organised picture after commitments and tax set asides, not from the full bank balance alone.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'how-much-money-does-my-business-actually-have',
    title: 'How Much Money Does My Business Actually Have?',
    metaDescription:
      'How much cash is available in my business? The difference between bank balance, profit, and Cash Prophet Balance for UK SMEs.',
    keywords: [
      'how much money does my business actually have',
      'how much cash is available in my business',
      'business cash management',
      'small business cash planning',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Profit, bank balance and Cash Prophet Balance answer three different questions. Only one shows where you stand after commitments.',
    relatedSlugs: [
      'bank-balance-vs-available-cash',
      'cash-flow-vs-profit-uk-small-business',
      'cash-prophet-explained',
    ],
    sections: [
      {
        type: 'p',
        text: '"How much money does my business actually have?" usually means: where do we really stand without creating a problem later? Profit and bank balance both fail that test on their own.',
      },
      {
        type: 'h2',
        text: 'Three numbers owners confuse',
      },
      {
        type: 'ul',
        items: [
          'Profit: an accounting result for a period, not cash in the bank',
          'Bank balance: cash today, including money already spoken for',
          'Cash Prophet Balance: your position after commitments and tax reserves',
        ],
      },
      {
        type: 'h2',
        text: 'A simple habit instead of a spreadsheet',
      },
      {
        type: 'p',
        text: 'List what builds every month. List irregular bills such as VAT, insurance and corporation tax. Track money you are confident will arrive. The gap between cash and those obligations is your Cash Prophet Balance, and it is what Cash Prophet keeps current for you.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Why can we be profitable and still feel broke?',
            a: 'Profit does not equal cash timing. Tax, stock, wages and customer delays remove cash even when the accounts look healthy.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'bank-balance-vs-available-cash',
    title: 'The Difference Between Bank Balance And Cash Prophet Balance',
    metaDescription:
      'Bank balance vs Cash Prophet Balance for UK businesses: why they diverge, and how committed funds and VAT set asides change the organised picture.',
    keywords: [
      'bank balance vs available cash',
      'cash prophet balance business',
      'committed money',
      'UK business cash',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Same account, two different answers. Understanding the gap is the heart of keeping business cash organised.',
    relatedSlugs: [
      'your-bank-balance-is-lying-to-you',
      'committed-funds-explained',
      'cash-prophet-vs-accounting-software',
    ],
    sections: [
      {
        type: 'p',
        text: 'Bank balance is what is in the account. Cash Prophet Balance is where you stand after you honour what is already committed. Confusing them is normal, and expensive.',
      },
      {
        type: 'h2',
        text: 'Bank balance vs Cash Prophet Balance',
      },
      {
        type: 'ul',
        items: [
          'Bank balance: a live total from your bank, instant but silent about payroll or VAT building',
          'Cash Prophet Balance: cash minus committed funds, plus only receipts you are confident of',
          'The gap: monthly accruals, Due items, and reserve targets sitting in current',
        ],
      },
      {
        type: 'h2',
        text: 'Why the gap grows for UK limited companies',
      },
      {
        type: 'ul',
        items: [
          'Quarterly VAT and corporation tax lumpiness',
          'PAYE and pensions mid month',
          'Steady sales against costs that arrive in lumps',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is Cash Prophet Balance the same as safe to spend?',
            a: 'Related idea, different job. Freelancer tools often mean cash minus a tax percentage. Cash Prophet Balance is where you stand after commitments, reserves and realistic receipts, as part of a wider organised picture.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'why-cash-flow-forecasts-usually-end-up-forgotten',
    title: 'Why Cash Flow Forecasts Usually End Up Forgotten',
    metaDescription:
      'Why UK cash flow forecasts die in the spreadsheet, and why an organised day-to-day picture helps confidence for consistent income businesses.',
    keywords: [
      'cash flow forecast forgotten',
      'business cash management',
      'small business cash planning',
      'cash flow spreadsheet',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Most forecasts fail from neglect, not maths. Owners often need a live organised picture alongside, not instead of, longer planning.',
    relatedSlugs: [
      'uk-small-business-cash-flow-forecast',
      'business-financial-snapshot',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: 'You built the twelve month cash flow. It looked sharp in January. By March the columns are stale, the assumptions are wrong, and you are back to the bank app. You are not lazy, the tool asked for the wrong habit.',
      },
      {
        type: 'h2',
        text: 'Why forecasts get abandoned',
      },
      {
        type: 'ul',
        items: [
          'They need weekly maintenance few owner operators have time for',
          'Small input errors compound into fantasy totals',
          'They answer "what might happen" when you needed "where do we stand today"',
        ],
      },
      {
        type: 'h2',
        text: 'Position before projection',
      },
      {
        type: 'p',
        text: 'A live Cash Prophet Balance you refresh in minutes gives day-to-day calm that a stale forecast cannot. It complements detailed forecasting; it does not replace it for highly irregular or project based income. Update balances, keep commitments current, mark VAT and tax reserves. Then add Trends and a simple outlook on top.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'how-i-stop-vat-catching-me-out-every-quarter',
    title: 'How I Stop VAT Catching Me Out Every Quarter',
    metaDescription:
      'Putting money aside for VAT so the quarterly bill does not smash cash flow. A practical UK owner approach to tax reserves.',
    keywords: [
      'putting money aside for VAT',
      'money set aside for tax',
      'VAT reserve small business',
      'business reserve planner',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'VAT does not surprise you because of maths. It surprises you because the cash still looked free until payment day.',
    relatedSlugs: [
      'how-much-set-aside-vat-uk',
      'business-reserve-planner-explained',
      'how-to-put-money-aside-vat-tax-irregular-bills',
    ],
    sections: [
      {
        type: 'p',
        text: 'Every quarter, the same story: sales felt good, the balance looked fine, then the VAT bill arrived and everything tightened. The fix is not a clever HMRC trick, it is treating VAT as committed money while it builds.',
      },
      {
        type: 'h2',
        text: 'Putting money aside for VAT',
      },
      {
        type: 'ul',
        items: [
          'Estimate the quarter early and update as you go',
          'Treat that amount as spoken for, not free cash',
          'Track it in the Reserve Planner or move it to a savings pot',
          'Mark it paid when it leaves, so your Cash Prophet Balance recovers honestly',
        ],
      },
      {
        type: 'h2',
        text: 'A reserve planner removes the guesswork',
      },
      {
        type: 'p',
        text: 'Corporation tax, PAYE and VAT all compete with supplier payments in the same current account. If tax money still looks available, you will spend it. Cash Prophet Reserve Planner exists so irregular bills stop ambushing you.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How much should I set aside for VAT?',
            a: 'Use your typical VAT due each quarter as a starting target, then refine with recent returns. Setting it aside consistently matters more than getting it exact on day one.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'cash-prophet-explained',
    title: 'Cash Prophet Explained',
    metaDescription:
      'Cash Prophet explained: a financial organiser for UK owner-managed businesses, covering what is coming up, reserves, Cash Prophet Balance and direction.',
    keywords: [
      'Cash Prophet explained',
      'cash prophet balance',
      'financial organiser',
      'managing business cash',
      'business cash management',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'A simple owner framework: organise what is coming up, what to put aside, where you stand, and whether that position is improving.',
    relatedSlugs: [
      'what-is-cash-prophet',
      'bank-balance-isnt-your-money',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: 'Cash Prophet is a financial organiser for owner-managed businesses. It helps you keep day-to-day finances organised so you are not carrying the whole picture in your head, and so the banking app is not the only place you look.',
      },
      {
        type: 'h2',
        text: 'What it helps you organise',
      },
      {
        type: 'ul',
        items: [
          'What is coming up: accruing costs, Due items and planned spends',
          'What needs putting aside: VAT, tax and irregular bills in the Reserve Planner',
          'Where the business stands: Cash Prophet Balance after commitments',
          'Where it is heading: whether that position is improving over time',
        ],
      },
      {
        type: 'h2',
        text: 'How the Cash Prophet Balance is built',
      },
      {
        type: 'ul',
        items: [
          'See cash across the accounts that matter',
          'Subtract committed funds: accruing costs, Due items, planned spends',
          'Add only expected receipts you trust',
          'Hold separate space for VAT, tax and irregular bills in the Reserve Planner',
        ],
      },
      {
        type: 'h2',
        text: 'What it is not',
      },
      {
        type: 'ul',
        items: [
          'Not a replacement for Xero, FreeAgent or QuickBooks',
          'Not tax or accounting advice',
          'Not a replacement for detailed cash flow forecasting',
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    title: 'Why Accounting Software Doesn\u2019t Tell You What You Can Spend',
    metaDescription:
      'Why accounting software is not designed to organise day-to-day commitments and reserves, and how Cash Prophet complements Xero, FreeAgent and QuickBooks.',
    keywords: [
      'accounting software what can I spend',
      'Cash Prophet vs accounting software',
      'Xero cash available',
      'business financial dashboard',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Accounting software records history for compliance. Keeping the day-to-day financial picture organised is a different job.',
    relatedSlugs: [
      'cash-prophet-vs-accounting-software',
      'what-accounting-software-tells-you-and-what-it-does-not',
      'your-bank-balance-is-lying-to-you',
    ],
    sections: [
      {
        type: 'p',
        text: 'Accounting software is excellent at invoices, expenses, VAT returns and year end accounts. Ask it what is coming up after commitments this week, or whether VAT is set aside, and you will get reports that were not built for that day-to-day job.',
      },
      {
        type: 'h2',
        text: 'What owners still need on a Tuesday',
      },
      {
        type: 'ul',
        items: [
          'An organised view of costs building and bills ahead',
          'Whether VAT and tax are set aside',
          'Where the business stands before a hire, purchase or quiet stretch',
        ],
      },
      {
        type: 'h2',
        text: 'Complement, not competitor',
      },
      {
        type: 'p',
        text: 'Do not replace your accounts. Add Cash Prophet to keep commitments, Reserve Planner and expected receipts organised alongside them. Compliance tools stay. Day-to-day organisation lives next to them.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Should I cancel Xero or FreeAgent?',
            a: 'No. Keep accounting software for compliance and use Cash Prophet as a financial organiser for the operational picture.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'business-reserve-planner-explained',
    title: 'Business Reserve Planner: Putting Money Aside Without Guessing',
    metaDescription:
      'What a business reserve planner is: putting money aside for VAT, tax and irregular bills so your Cash Prophet Balance stays honest.',
    keywords: [
      'business reserve planner',
      'putting money aside for VAT',
      'money set aside for tax',
      'small business cash planning',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Irregular bills do not fit monthly accruing. A reserve planner turns "I hope I saved enough" into a visible target.',
    relatedSlugs: [
      'how-i-stop-vat-catching-me-out-every-quarter',
      'corporation-tax-reserve-small-business',
      'virtual-reserves-vs-separate-savings-accounts',
    ],
    sections: [
      {
        type: 'p',
        text: 'Rent and payroll build every month. VAT, insurance, corporation tax and renewals punch a hole once a quarter or once a year. Cash Prophet Reserve Planner exists for the second type.',
      },
      {
        type: 'h2',
        text: 'How it works',
      },
      {
        type: 'ul',
        items: [
          'Name the bill and set the due window',
          'See how much to ring fence each month',
          'Transfer to a savings account, or track it as a reserve target',
          'Mark it paid when the bill leaves',
        ],
      },
      {
        type: 'h2',
        text: 'Common reserves to plan',
      },
      {
        type: 'ul',
        items: [
          'VAT, building through the quarter',
          'Corporation tax, building toward the payment date',
          'Insurance and licences, to avoid renewal shocks',
        ],
      },
      {
        type: 'p',
        text: 'Until a bill is paid, the reserve target counts as committed. When it leaves the bank, mark it paid so your Cash Prophet Balance recovers honestly, with no double counting.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'business-financial-snapshot',
    title: 'Business Financial Snapshot: The Dashboard Owners Actually Use',
    metaDescription:
      'A business financial snapshot for UK SMEs: what is coming up, what to put aside, Cash Prophet Balance and direction, without spreadsheet drag.',
    keywords: [
      'business financial snapshot',
      'business financial dashboard',
      'managing business cash',
      'business cash management',
      'financial organiser',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-09-01',
    category: 'Cornerstone',
    readMinutes: 2,
    excerpt:
      'Forget a wall of KPIs. Owners need one organised snapshot: what is coming up, what is spoken for, what is coming in, where we stand.',
    relatedSlugs: [
      'how-much-money-does-my-business-actually-have',
      'multi-site-business-cash-dashboard',
      'cash-prophet-explained',
    ],
    sections: [
      {
        type: 'p',
        text: 'A "business financial dashboard" often means charts nobody opens. A useful snapshot is smaller and calmer: cash, costs building, expected receipts, reserves, and one Cash Prophet Balance, updated in the time it takes to sip coffee.',
      },
      {
        type: 'h2',
        text: 'What belongs on the snapshot',
      },
      {
        type: 'ul',
        items: [
          'Balances that matter: current, reserve, key venues',
          'What is coming up: committed funds building and Due',
          'Expected receipts you trust',
          'What needs putting aside: VAT and tax set asides',
          'Cash Prophet Balance: where the business stands',
        ],
      },
      {
        type: 'h2',
        text: 'Managing cash without the theatre',
      },
      {
        type: 'p',
        text: 'Small business cash planning fails when the system is heavier than the decision. Start from the idea that the bank balance is accurate but incomplete, keep commitments honest, and let the snapshot show the organised picture.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'best-financial-management-software-uk',
    title: 'Best Financial Management Software for UK Businesses (2026)',
    metaDescription:
      'Compare financial management software for UK businesses in 2026: accounting, cash flow forecasting, and Cash Prophet as a financial organiser for the day-to-day picture.',
    keywords: [
      'best financial management software UK',
      'financial management software for UK businesses',
      'business finance software UK',
      'UK SME finance apps 2026',
      'Cash Prophet',
      'Cash Prophet Balance',
      'financial organiser',
    ],
    publishedAt: '2026-08-01',
    updatedAt: '2026-09-01',
    category: 'Comparisons',
    readMinutes: 9,
    excerpt:
      'Accounting keeps HMRC happy. Forecasting plans the next ninety days. A financial organiser answers a different need: keeping the day-to-day picture together.',
    relatedSlugs: [
      'cash-flow-tools-uk-small-business-compared',
      'cash-prophet-vs-accounting-software',
      'what-is-cash-prophet-balance',
      'cash-prophet-explained',
      'bank-balance-vs-available-cash',
    ],
    sections: [
      {
        type: 'p',
        text: 'Search for the best financial management software for UK businesses and you will mostly find accounting packages. That is useful, but incomplete. Xero, FreeAgent and QuickBooks help you invoice, reclaim VAT and file. They do not reliably organise what is coming up this month, what should be put aside, or where the business stands after commitments.',
      },
      {
        type: 'p',
        text: 'This guide groups the main types of finance software UK SMEs use in 2026, what each is for, and where Cash Prophet fits. Calm and practical, not hype, and not a claim that one app replaces your accountant.',
      },
      {
        type: 'h2',
        text: 'What “financial management software” should mean',
      },
      {
        type: 'p',
        text: 'For most UK owners, financial management is three jobs that get bundled into one vague phrase:',
      },
      {
        type: 'ul',
        items: [
          'Record and report: invoices, expenses, VAT, year-end (accounting software)',
          'Plan ahead: scenarios for lumpy income or big projects (cash flow forecasting)',
          'Keep day to day organised: commitments, reserves and where you stand (a financial organiser)',
        ],
      },
      {
        type: 'p',
        text: 'Your bank app only shows cash in the account. Timing of payroll, VAT, rent and supplier bills constantly leaves that picture incomplete. Good financial management software either fixes the records, the forecast, or the day-to-day organisation, or it tries to do more than one of those jobs.',
      },
      {
        type: 'h2',
        text: 'How to choose (before you compare logos)',
      },
      {
        type: 'ul',
        items: [
          'Do you need HMRC-ready books and accountant collaboration? Start with accounting software.',
          'Is income lumpy or project-based? Prioritise detailed cash flow forecasting.',
          'Is income relatively consistent (hospitality, leisure, gyms, childcare, subscriptions, recurring services)? A financial organiser with Cash Prophet Balance is often the missing piece.',
          'Multi-site or multi-business? Check roll-ups and scope, not just a single account view.',
          'Will you actually open it regularly? The best tool is the one that becomes a habit.',
        ],
      },
      {
        type: 'h2',
        text: 'Quick comparison (2026)',
      },
      {
        type: 'ul',
        items: [
          'Cash Prophet: financial organiser; commitments and Reserve Planner; Cash Prophet Balance; complements accounting',
          'Xero: full UK accounting, bank feeds, accountant ecosystem',
          'FreeAgent: accounting aimed at smaller UK limited companies and freelancers',
          'QuickBooks Online: accounting with strong invoicing and reporting',
          'Sage: accounting for businesses that already live in the Sage world',
          'Float: cash flow forecasting on top of accounting data',
          'Fluidly: AI-assisted cash flow and collections for SMEs',
          'Invoice-led “safe to spend” apps: strong when life is invoices and tax vaults; weaker for payroll-heavy venues',
          'Business bank apps (Tide, Starling Business, etc.): banking plus insights; not a full organised commitment picture',
        ],
      },
      {
        type: 'h2',
        text: '1. Cash Prophet, a financial organiser for day-to-day finances',
      },
      {
        type: 'p',
        text: 'Cash Prophet is a financial organiser built for owner-managed businesses. It helps you keep track of what is coming up, what needs putting aside, where the business stands (Cash Prophet Balance), and whether that position is improving. It continuously accounts for meaningful commitments: accruing bills, due costs, reserves for VAT and tax, and realistic expected receipts.',
      },
      {
        type: 'ul',
        items: [
          'Best for: leisure, hospitality, gyms, childcare, subscriptions and other businesses with relatively consistent income',
          'Core outcome: less to carry in your head; a calmer, organised day-to-day picture',
          'Works alongside: Xero, FreeAgent, QuickBooks or Sage, it does not replace them',
          'Also useful: Reserve Planner for predictable future costs, even when income is lumpy',
        ],
      },
      {
        type: 'p',
        text: 'If you found this page after trying finance apps that still leave you guessing from the bank balance alone, Cash Prophet is aimed at that missing day-to-day picture.',
      },
      {
        type: 'h2',
        text: '2. Xero: UK accounting standard for many SMEs',
      },
      {
        type: 'p',
        text: 'Xero is excellent at books, VAT and working with your accountant. Cash flow reports exist, but they are not the same as an organised day-to-day view of commitments and reserves. Use Xero for compliance and history; use an organiser when you need Tuesday calm.',
      },
      {
        type: 'h2',
        text: '3. FreeAgent: accounting for smaller UK companies',
      },
      {
        type: 'p',
        text: 'FreeAgent suits freelancers and smaller limited companies that want accounting without enterprise complexity. Same pattern as other ledgers: strong on records, light on a living view of spoken-for money.',
      },
      {
        type: 'h2',
        text: '4. QuickBooks Online: accounting and invoicing',
      },
      {
        type: 'p',
        text: 'QuickBooks is a solid all-rounder for invoicing, expenses and reporting. Pair it with something that tracks accruing commitments if payroll, VAT and reserves are what catch you out.',
      },
      {
        type: 'h2',
        text: '5. Sage: accounting for Sage-centric businesses',
      },
      {
        type: 'p',
        text: 'If your accountant and processes already run on Sage, switching ledgers is rarely the first win. Add a day-to-day organiser if the bank total still feels incomplete between filing dates.',
      },
      {
        type: 'h2',
        text: '6. Float: cash flow forecasting on accounting data',
      },
      {
        type: 'p',
        text: 'Float sits on top of accounting platforms to project cash forward. Ideal when you need scenarios and a ninety-day plan. Less focused on keeping commitments and reserves organised for consistent-income businesses day to day.',
      },
      {
        type: 'h2',
        text: '7. Fluidly: forecasting and cash insight',
      },
      {
        type: 'p',
        text: 'Fluidly leans into AI-assisted cash flow and related SME finance workflows. Strong when the problem is planning and collections. Different job from organising accruing commitments into a calm day-to-day picture.',
      },
      {
        type: 'h2',
        text: '8. Invoice-led finance apps (including Token-style tools)',
      },
      {
        type: 'p',
        text: 'A growing set of UK finance apps, including tools people discover as “Token”-style or invoice-first money apps, help freelancers and contractors see tax set-asides and a form of safe-to-spend from invoices. They work well when your life is invoices and personal tax. They are a weaker fit for multi-site hospitality or leisure with payroll, venue costs and monthly accruing bills.',
      },
      {
        type: 'h2',
        text: '9. Business bank apps with insights',
      },
      {
        type: 'p',
        text: 'Tide, Starling Business and similar apps improve day-to-day banking and may surface categories or simple insights. Banking is not the same as organising commitments and reserves. Useful rails; still not a Cash Prophet Balance.',
      },
      {
        type: 'h2',
        text: 'Accounting vs forecasting vs day-to-day organisation',
      },
      {
        type: 'ul',
        items: [
          'Accounting software: compliance, history, accountant collaboration',
          'Cash flow forecasting: timing risk when income or projects are lumpy',
          'Cash Prophet: financial organiser for commitments, reserves and Cash Prophet Balance',
        ],
      },
      {
        type: 'p',
        text: 'Most growing UK businesses eventually need the first. Many need the second for projects. Owners with relatively consistent income often feel the third gap most sharply, and that is where listicles that only rank ledgers fall short.',
      },
      {
        type: 'h2',
        text: 'Who should shortlist Cash Prophet',
      },
      {
        type: 'ul',
        items: [
          'You check the bank app to decide spend, hire or dividends, and it still surprises you',
          'VAT, payroll or annual bills regularly catch you out',
          'Income is fairly steady through the month',
          'You already have (or will keep) accounting software',
          'You want less to carry in your head, not another spreadsheet to maintain',
        ],
      },
      {
        type: 'p',
        text: 'If income is highly project-based or seasonal, treat detailed forecasting as primary and use Reserve Planner for known future costs. Do not expect any single daily balance to replace a proper project cash plan.',
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            q: 'Is Cash Prophet accounting software?',
            a: 'No. It is a financial organiser focused on the day-to-day picture. Keep Xero, FreeAgent, QuickBooks or Sage for books and filings.',
          },
          {
            q: 'Does it replace cash flow forecasting?',
            a: 'No. Forecasting remains important for lumpy or project income. Cash Prophet is designed for consistent-income businesses that need a calm organised read of position.',
          },
          {
            q: 'What is the Cash Prophet Balance?',
            a: 'It is Cash Prophet’s calculation of where the business stands after accounting for meaningful commitments, reserves and realistic expected receipts, clearer than relying on the bank balance alone.',
          },
          {
            q: 'Can I use Cash Prophet with Xero or FreeAgent?',
            a: 'Yes. They solve different problems. Accounting records the past for compliance; Cash Prophet helps you keep today’s picture organised.',
          },
        ],
      },
      {
        type: 'h2',
        text: 'Next step',
      },
      {
        type: 'p',
        text: 'If you want a clear shortlist: keep your accounting package for compliance, add forecasting if income is lumpy, and add Cash Prophet when the real pain is keeping day-to-day finances organised. Try the live demos, or read what Cash Prophet is in plain language.',
      },
      { type: 'p', text: CTA },
    ],
  },
]
