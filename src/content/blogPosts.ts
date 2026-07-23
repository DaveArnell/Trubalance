import { METHOD_BLOG_POSTS } from './methodBlogPosts'
import { CORNERSTONE_BLOG_POSTS } from './cornerstoneBlogPosts'
import type { BlogPost } from './blogTypes'

export type { BlogPost, BlogSection } from './blogTypes'

const CORE_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-true-balance',
    title: 'What Is Cash Prophet? Cash Clarity for UK Business Owners',
    metaDescription:
      'Cash Prophet is the money genuinely yours after commitments and expected receipts — not just your bank balance. Learn how UK small businesses use it for cash clarity.',
    keywords: ['true balance', 'cash clarity', 'UK small business', 'safe to spend', 'committed funds'],
    publishedAt: '2026-06-01',
    updatedAt: '2026-07-06',
    category: 'Guides',
    readMinutes: 6,
    excerpt:
      'Your bank balance is not your spending money. Cash Prophet shows what is left after everything already spoken for.',
    relatedSlugs: ['bank-balance-vs-safe-to-spend-uk', 'true-balance-vs-accounting-software'],
    sections: [
      {
        type: 'p',
        text: 'Most UK business owners check their bank app and guess. Cash Prophet replaces guessing with one number: current cash minus committed funds plus expected receipts. It answers a simple question — how much is genuinely mine to use?',
      },
      {
        type: 'h2',
        text: 'how Available is calculated',
      },
      {
        type: 'ul',
        items: [
          'Current account cash — what is in the bank today',
          'Minus committed funds — payroll accruing, VAT building, planned costs, reserve targets',
          'Plus expected receipts — invoices and project payments you are still owed',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet is not accounting software. It does not replace Xero, FreeAgent, or QuickBooks. It sits above your accounts as a cash-position tool for owners who run the numbers themselves.',
      },
      {
        type: 'h2',
        text: 'Who it is for',
      },
      {
        type: 'ul',
        items: [
          'Trades and contractors with lumpy project income',
          'Cafés and hospitality with payroll and rent cycles',
          'Multi-site operators who need one roll-up view',
          'Limited companies juggling VAT, corporation tax, and PAYE',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is Cash Prophet the same as my bank balance?',
            a: 'No. Your bank balance ignores money already spoken for. Cash Prophet subtracts commitments and adds money you are still owed but have not received yet.',
          },
          {
            q: 'Do I need an accountant to use Cash Prophet?',
            a: 'No. You enter balances and commitments yourself. Many owners use it alongside their accountant rather than instead of one.',
          },
        ],
      },
    ],
  },
  {
    slug: 'bank-balance-vs-safe-to-spend-uk',
    title: 'Bank Balance vs Safe to Spend: What UK Owners Actually Need',
    metaDescription:
      'Why your UK business bank balance misleads you, what safe-to-spend really means, and how committed funds change the picture for SMEs.',
    keywords: ['safe to spend', 'bank balance', 'UK business', 'cash clarity', 'available cash'],
    publishedAt: '2026-06-03',
    updatedAt: '2026-07-06',
    category: 'Guides',
    readMinutes: 5,
    excerpt:
      'Apps like VatVantage popularised safe to spend for freelancers. UK SMEs with payroll and VAT need a deeper view.',
    relatedSlugs: ['what-is-true-balance', 'how-much-set-aside-vat-uk'],
    sections: [
      {
        type: 'p',
        text: 'Freelancer tools such as VatVantage and similar apps calculate safe to spend from invoices and tax percentages. That works when your income is a list of client payments. It breaks down when you have payroll, CIS, quarterly VAT, corporation tax, and a reserve account.',
      },
      {
        type: 'h2',
        text: 'Why the bank balance lies',
      },
      {
        type: 'ul',
        items: [
          'Payroll accrues every day even though it leaves on the 28th',
          'VAT for last quarter is still owed even if the cash is sitting there',
          'A planned van purchase or refit is building up in the background',
          'Money in a reserve account is not free to spend from current',
        ],
      },
      {
        type: 'h2',
        text: 'Safe to spend vs Cash Prophet',
      },
      {
        type: 'p',
        text: 'Safe to spend usually means cash minus tax set-asides. Cash Prophet goes further: it includes all committed funds (monthly costs accruing, due items, planned one-offs) and expected receipts on the other side. For a building firm waiting on a £12,000 deposit, that receipt matters as much as the tax reserve.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'What is the best safe-to-spend app for UK businesses?',
            a: 'Freelancer-focused apps suit solo operators with simple invoice flows. SMEs with payroll, reserves, and irregular bills benefit from a commitment-based tool like Cash Prophet.',
          },
        ],
      },
    ],
  },
  {
    slug: 'uk-small-business-cash-flow-forecast',
    title: 'Cash Flow Forecast for UK Small Businesses (Without a Spreadsheet)',
    metaDescription:
      'How to forecast UK small business cash flow 30–90 days ahead using scheduled costs, expected receipts, and reserve transfers — not guesswork.',
    keywords: ['cash flow forecast UK', 'small business cash flow', '90 day forecast', 'SME cash planning'],
    publishedAt: '2026-06-05',
    updatedAt: '2026-07-06',
    category: 'Cash flow',
    readMinutes: 7,
    excerpt:
      'Spreadsheets work until they do not. Here is what a forward cash outlook needs for a real UK business.',
    relatedSlugs: ['cash-flow-spreadsheet-alternative-uk', 'lumpy-income-cash-flow-building-trades'],
    sections: [
      {
        type: 'p',
        text: 'Tools like Float, Cashflow King, and Easeful focus on forecasting from bank transactions or manual entries. Cash Prophet forecasts from what you already know: monthly costs, planned payments, reserve transfers, and dated expected receipts.',
      },
      {
        type: 'h2',
        text: 'What to include in a 90-day outlook',
      },
      {
        type: 'ul',
        items: [
          'Monthly commitments on their due dates (rent, payroll, suppliers)',
          'One-off planned costs with build-up (equipment, vehicles, refurbishments)',
          'Expected receipts with dates (deposits, stage payments, final balances)',
          'Reserve transfers between current and reserve accounts',
          'Opening current-account balance as the starting point',
        ],
      },
      {
        type: 'h2',
        text: 'Cash line vs Available line',
      },
      {
        type: 'p',
        text: 'The cash line shows your current account balance forward. The Available line adjusts for committed funds and expected receipts — so you see whether you are genuinely improving or just moving money around.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How far ahead should a small business forecast cash flow?',
            a: 'Thirty days catches immediate crunches; ninety days covers VAT quarters, monthly payroll cycles, and most project payment schedules.',
          },
        ],
      },
    ],
  },
  {
    slug: 'how-much-set-aside-vat-uk',
    title: 'How Much to Set Aside for VAT (UK Small Business Guide)',
    metaDescription:
      'Practical ways UK small businesses reserve for quarterly VAT — flat percentages, reserve accounts, and month-by-month planning.',
    keywords: ['VAT set aside', 'UK VAT reserve', 'quarterly VAT', 'small business VAT'],
    publishedAt: '2026-06-08',
    updatedAt: '2026-07-06',
    category: 'Tax & reserves',
    readMinutes: 6,
    excerpt:
      'A percentage on every invoice is a start. Quarterly VAT bills need month-by-month reserve planning.',
    relatedSlugs: ['corporation-tax-reserve-small-business', 'bank-balance-vs-safe-to-spend-uk'],
    sections: [
      {
        type: 'p',
        text: 'Many owners use a rough 20% rule or a separate savings pot. Freelancer apps automate a tax vault from invoices. Limited companies with mixed income and reclaimable VAT often need more precision.',
      },
      {
        type: 'h2',
        text: 'Three approaches compared',
      },
      {
        type: 'ul',
        items: [
          'Flat percentage — simple, wrong when expenses are high or VAT varies by quarter',
          'Spreadsheet VAT tab — flexible, goes stale by mid-quarter',
          'Reserve Planner — enter VAT in the months it is actually due (Mar, Jun, Sep, Dec) and accrue monthly toward each bill',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet Reserve Planner models irregular bills in their real due months, not smoothed as an average. Committed funds show whether you are on track before the return is due.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Should VAT money sit in my current account?',
            a: 'Many owners use a separate reserve account. Cash Prophet tracks the transfer target each month so Available stays honest.',
          },
        ],
      },
    ],
  },
  {
    slug: 'corporation-tax-reserve-small-business',
    title: 'Corporation Tax Reserve: Planning for the Year-End Bill',
    metaDescription:
      'How UK limited companies set aside for corporation tax, avoid March surprises, and track reserves month by month.',
    keywords: ['corporation tax reserve', 'UK limited company', 'year end tax', 'tax provision SME'],
    publishedAt: '2026-06-10',
    updatedAt: '2026-07-06',
    category: 'Tax & reserves',
    readMinutes: 5,
    excerpt:
      'Corporation tax is annual and painful. Monthly set-aside beats a single panic transfer in December.',
    relatedSlugs: ['how-much-set-aside-vat-uk', 'when-to-pay-yourself-limited-company-uk'],
    sections: [
      {
        type: 'p',
        text: 'Unlike PAYE or VAT, corporation tax does not arrive monthly. A £14,000 bill in December can wipe a healthy-looking current account if you have not been accruing mentally — or in a reserve plan — all year.',
      },
      {
        type: 'h2',
        text: 'Building a corporation tax reserve',
      },
      {
        type: 'ul',
        items: [
          'Estimate annual liability with your accountant or last year plus growth',
          'Add a December (or payment month) bill in Reserve Planner',
          'Transfer a monthly amount from current to reserve',
          'Treat reserved money as committed — not available to spend',
        ],
      },
      {
        type: 'p',
        text: 'Accounting software records tax after the fact. Cash Prophet helps you provision before the fact so Cash Prophet on the dashboard matches reality.',
      },
    ],
  },
  {
    slug: 'cash-flow-spreadsheet-alternative-uk',
    title: 'Still Using a Cash Flow Spreadsheet? UK Alternatives Compared',
    metaDescription:
      'Compare cash flow spreadsheets vs Cash Prophet, Float, and Cashflow King for UK small businesses — pros, cons, and when to switch.',
    keywords: ['cash flow spreadsheet', 'Excel cash flow UK', 'spreadsheet alternative', 'cash flow template'],
    publishedAt: '2026-06-12',
    updatedAt: '2026-07-06',
    category: 'Comparisons',
    readMinutes: 8,
    excerpt:
      'Every owner starts with a spreadsheet. Here is when dedicated cash clarity software earns its keep.',
    relatedSlugs: ['uk-small-business-cash-flow-forecast', 'cash-flow-tools-uk-small-business-compared'],
    sections: [
      {
        type: 'p',
        text: 'Spreadsheets are free and familiar. They also go out of date the moment you look away, break when you add a second site, and hide errors in SUM formulas. Dedicated tools trade flexibility for always-current clarity.',
      },
      {
        type: 'h2',
        text: 'Spreadsheet vs dedicated cash tools',
      },
      {
        type: 'ul',
        items: [
          'Spreadsheet — full control, high maintenance, no committed-funds logic',
          'Float / bank-connected forecasters — automatic transactions, subscription cost, categorisation cleanup',
          'Cashflow King — multi-account forecast, tax ringfencing, transaction-heavy',
          'Cash Prophet — manual balances, commitment accruals, reserve planner, Cash Prophet equation',
        ],
      },
      {
        type: 'h2',
        text: 'When to leave the spreadsheet',
      },
      {
        type: 'p',
        text: 'If you update balances weekly, have more than one commitment type, or got surprised by VAT or payroll despite a spreadsheet, you are ready for a purpose-built view.',
      },
    ],
  },
  {
    slug: 'true-balance-vs-accounting-software',
    title: 'Cash Prophet vs Accounting Software',
    metaDescription:
      'Cash Prophet vs accounting software: why Xero, FreeAgent and QuickBooks don’t answer what you can spend — and how they work together.',
    keywords: [
      'Cash Prophet vs accounting software',
      'Cash Prophet vs Xero',
      'FreeAgent cash flow',
      'accounting software UK',
      'what can I spend',
    ],
    publishedAt: '2026-06-15',
    updatedAt: '2026-07-14',
    category: 'Comparisons',
    readMinutes: 6,
    excerpt:
      'You still need accounting software for filings. You need something else for Tuesday morning spending decisions.',
    relatedSlugs: [
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
      'what-is-true-balance',
      'bank-balance-isnt-your-money',
    ],
    sections: [
      {
        type: 'p',
        text: 'Xero, FreeAgent, Sage, and QuickBooks excel at invoices, expenses, VAT returns, and year-end accounts. Their cash-flow reports are backward-looking and profit-oriented — not built for what can I spend this week.',
      },
      {
        type: 'h2',
        text: 'What accounting software does well',
      },
      {
        type: 'ul',
        items: [
          'HMRC-compliant VAT and MTD submissions',
          'Invoice and expense capture',
          'Profit and loss by period',
          'Accountant collaboration',
        ],
      },
      {
        type: 'h2',
        text: 'What Cash Prophet adds',
      },
      {
        type: 'ul',
        items: [
          'Daily accruing committed funds',
          'Forward cash outlook with the Available line',
          'Reserve Planner for irregular tax and insurance bills',
          'Expected receipts for project-based income',
        ],
      },
      {
        type: 'p',
        text: 'Use both: accounting software for compliance, Cash Prophet for operational cash decisions. That separation — Cash Prophet vs accounting software as complements, not rivals — is the niche.',
      },
    ],
  },
  {
    slug: 'cash-flow-tools-uk-small-business-compared',
    title: 'Best Cash Flow Tools for UK Small Businesses (2026 Comparison)',
    metaDescription:
      'Compare UK cash flow tools: Cash Prophet, Float, Cashflow King, VatVantage, Easeful, and spreadsheets for SMEs and freelancers.',
    keywords: ['best cash flow software UK', 'cash flow tools comparison', 'SME finance apps 2026'],
    publishedAt: '2026-06-18',
    updatedAt: '2026-07-06',
    category: 'Comparisons',
    readMinutes: 9,
    excerpt:
      'No single app fits every business. This comparison maps tools to how you actually earn and spend.',
    relatedSlugs: ['cash-flow-spreadsheet-alternative-uk', 'bank-balance-vs-safe-to-spend-uk'],
    sections: [
      {
        type: 'h2',
        text: 'Quick comparison',
      },
      {
        type: 'ul',
        items: [
          'VatVantage — freelancers, invoice + expense led, tax vault, safe to spend',
          'Easeful — variable income, manual balances, 30–90 day projection',
          'Float — bank feeds, scenario planning, established UK product',
          'Cashflow King — multi-business, 90-day forecast, AI-assisted categorisation',
          'Ebitly — bank-connected, ML predictions, runway alerts',
          'Profit Pilot — AI CFO positioning, MTD readiness, higher price tier',
          'Cash Prophet — UK SMEs, commitments + reserves + Cash Prophet, multi-site',
        ],
      },
      {
        type: 'h2',
        text: 'How to choose',
      },
      {
        type: 'ul',
        items: [
          'Solo freelancer with invoices → invoice-native safe-to-spend apps',
          'Limited company with payroll → commitment-based tools',
          'Multiple sites or companies → roll-up scope and group view',
          'Lumpy project income → expected receipts and forward outlook',
        ],
      },
    ],
  },
  {
    slug: 'when-to-pay-yourself-limited-company-uk',
    title: 'When Can I Pay Myself? UK Limited Company Owner Guide',
    metaDescription:
      'How UK directors decide when to take dividends or salary — using Cash Prophet, reserves, and committed funds before you transfer.',
    keywords: ['pay yourself limited company', 'director dividends UK', 'when to take salary', 'owner drawings'],
    publishedAt: '2026-06-20',
    updatedAt: '2026-07-06',
    category: 'Guides',
    readMinutes: 6,
    excerpt:
      'The account looks healthy. That does not mean you can afford a dividend. Check commitments first.',
    relatedSlugs: ['corporation-tax-reserve-small-business', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'Directors often pay themselves when cash feels comfortable. Accountants prefer planned dividends after retained profit is clear. Day-to-day, you need a third check: after payroll, VAT, tax reserves, and supplier commitments, is there headroom?',
      },
      {
        type: 'h2',
        text: 'A practical order of operations',
      },
      {
        type: 'ul',
        items: [
          'Cover overdue and due commitments',
          'Top up reserve accounts to target',
          'Leave buffer for next payroll and VAT',
          'Check Cash Prophet — not just bank balance',
          'Then consider dividend or extra salary',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Can Cash Prophet tell me my legal dividend limit?',
            a: 'No — that comes from accounts and your accountant. Cash Prophet shows cash headroom after operational commitments.',
          },
        ],
      },
    ],
  },
  {
    slug: 'lumpy-income-cash-flow-building-trades',
    title: 'Cash Flow for UK Building Trades & Contractors',
    metaDescription:
      'Manage lumpy project income, stage payments, CIS, and equipment costs — cash flow tips for UK builders and trades.',
    keywords: ['building trades cash flow', 'contractor cash flow UK', 'construction stage payments', 'CIS cash flow'],
    publishedAt: '2026-06-22',
    updatedAt: '2026-07-06',
    category: 'Industries',
    readMinutes: 7,
    excerpt:
      'Large deposits and quiet months are normal. Your cash view should reflect project timing, not monthly averages.',
    relatedSlugs: ['uk-small-business-cash-flow-forecast', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'A fit-out deposit lands in March; payroll and materials run every month. CIS and subcontractor retainers add pressure. A van replacement builds for ninety days before it hits. Generic budgeting apps miss this shape entirely.',
      },
      {
        type: 'h2',
        text: 'What trades businesses should track',
      },
      {
        type: 'ul',
        items: [
          'Expected receipts with dates for each stage payment',
          'Monthly materials, lease, and subcontractor retainers',
          'Planned equipment with accrue-until-due funding',
          'CIS / PAYE on its own cycle',
          'VAT quarters through Reserve Planner',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet includes a Riverside Building demo — a trades business with realistic commitments and lumpy receipts. Try it without signing up.',
      },
    ],
  },
  {
    slug: 'cafe-restaurant-cash-flow-management',
    title: 'Café & Restaurant Cash Flow: UK Owner Guide',
    metaDescription:
      'Daily takings vs monthly costs — how UK café and restaurant owners manage cash, payroll, rent, and reserves.',
    keywords: ['café cash flow UK', 'restaurant cash management', 'hospitality payroll', 'food business cash flow'],
    publishedAt: '2026-06-25',
    updatedAt: '2026-07-06',
    category: 'Industries',
    readMinutes: 6,
    excerpt:
      'Steady daily income does not mean simple cash flow. Rent and payroll still arrive on fixed dates.',
    relatedSlugs: ['multi-site-business-cash-dashboard', 'uk-small-business-cash-flow-forecast'],
    sections: [
      {
        type: 'p',
        text: 'Hospitality income is often steady day-to-day but costs are lumpy: rent on the 1st, wholesale mid-month, payroll at month end. Multi-site operators multiply the problem across venues.',
      },
      {
        type: 'h2',
        text: 'Cash outlook for steady income businesses',
      },
      {
        type: 'p',
        text: 'Cash Prophet marks income pattern as steady or lumpy per business. For cafés, the forward outlook plots scheduled outgoings — your real balance trends higher than the chart because daily sales are not modelled. Use Trends for historical trajectory and the outlook for cost timing.',
      },
      {
        type: 'ul',
        items: [
          'Track each venue as a scope with shared business costs',
          'Plan equipment service as planned commitments',
          'Reserve for VAT and corporation tax separately from daily float',
        ],
      },
    ],
  },
  {
    slug: 'multi-site-business-cash-dashboard',
    title: 'Multi-Site Business Cash: One Dashboard for Every Location',
    metaDescription:
      'Roll up cash, commitments, and Cash Prophet across UK business sites, venues, and group structures.',
    keywords: ['multi-site cash flow', 'multi-venue business UK', 'group cash dashboard', 'roll-up financial view'],
    publishedAt: '2026-06-28',
    updatedAt: '2026-07-06',
    category: 'Product',
    readMinutes: 5,
    excerpt:
      'Two cafés and a head office should not mean three spreadsheets. One scope tree, one Cash Prophet.',
    relatedSlugs: ['cafe-restaurant-cash-flow-management', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'Leisure groups, multi-site hospitality, and holding structures need consolidated visibility without losing venue-level detail. Cash Prophet scopes data to group, business, or venue with roll-up totals.',
      },
      {
        type: 'h2',
        text: 'Structure that matches reality',
      },
      {
        type: 'ul',
        items: [
          'Group — consolidated Cash Prophet across companies',
          'Business — separate companies in one workspace',
          'Venue — site-level accounts and commitments',
          'Sidebar scope picker switches view without losing context',
        ],
      },
    ],
  },
  {
    slug: 'cash-flow-vs-profit-uk-small-business',
    title: 'Cash Flow vs Profit: Why UK SMEs Run Out of Money While Profitable',
    metaDescription:
      'Profitable on paper, broke in the bank — explain cash flow vs profit for UK small businesses and how to stay ahead.',
    keywords: ['cash flow vs profit', 'profitable but no cash', 'UK SME cash problem', 'working capital'],
    publishedAt: '2026-07-01',
    updatedAt: '2026-07-06',
    category: 'Guides',
    readMinutes: 6,
    excerpt:
      'Profit is accounting. Cash is timing. Most surprises are timing problems.',
    relatedSlugs: ['true-balance-vs-accounting-software', 'uk-small-business-cash-flow-forecast'],
    sections: [
      {
        type: 'p',
        text: 'You can show a profit in Xero while the current account cannot cover payroll. Customers pay late, VAT leaves in one lump, equipment is bought before revenue is recognised. Owners who only read P&L miss the gap.',
      },
      {
        type: 'h2',
        text: 'Common timing gaps',
      },
      {
        type: 'ul',
        items: [
          'Invoice sent, cash not received — expected receipts matter',
          'Tax provision not funded — reserves matter',
          'Growth spends cash before revenue follows',
          'Personal drawings treated as available cash',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet is deliberately cash- and commitment-first, not profit-first. Pair it with your accounts for the full picture.',
      },
    ],
  },
  {
    slug: 'committed-funds-explained',
    title: 'What Are Committed Funds? (UK Small Business Guide)',
    metaDescription:
      'Committed funds explained: monthly accruals, due items, planned costs, and reserves — and how they affect what you can spend.',
    keywords: ['committed funds', 'accruing costs', 'money spoken for', 'UK business commitments'],
    publishedAt: '2026-07-03',
    updatedAt: '2026-07-06',
    category: 'Guides',
    readMinutes: 5,
    excerpt:
      'Money already spoken for is the part owners forget. Committed funds makes it visible.',
    relatedSlugs: ['what-is-true-balance', 'how-much-set-aside-vat-uk'],
    sections: [
      {
        type: 'p',
        text: 'Committed funds is everything your business has already promised — whether or not the cash has left yet. Payroll accrues daily. VAT builds toward quarter end. A planned van purchase grows until due date.',
      },
      {
        type: 'h2',
        text: 'Three buckets',
      },
      {
        type: 'ul',
        items: [
          'Building up — monthly costs accruing, reserve targets, planned save-to-spend items',
          'Due now — overdue or current-period items waiting for payment',
          'Expected receipts — money owed to you (reduces net commitments on Cash Prophet)',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet Committed Funds panel shows all three in one place, scoped to your selected business or venue.',
      },
    ],
  },
]

export const BLOG_POSTS: BlogPost[] = [
  ...CORNERSTONE_BLOG_POSTS,
  ...CORE_BLOG_POSTS,
  ...METHOD_BLOG_POSTS,
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

export function getRelatedPosts(slug: string): BlogPost[] {
  const post = getBlogPost(slug)
  if (!post) return []
  return post.relatedSlugs
    .map((relatedSlug) => getBlogPost(relatedSlug))
    .filter((entry): entry is BlogPost => entry != null)
}

export const BLOG_CATEGORIES = [...new Set(BLOG_POSTS.map((post) => post.category))].sort()

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.category === category)
}
