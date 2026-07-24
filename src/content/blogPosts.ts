import { METHOD_BLOG_POSTS } from './methodBlogPosts'
import { CORNERSTONE_BLOG_POSTS } from './cornerstoneBlogPosts'
import type { BlogPost } from './blogTypes'

export type { BlogPost, BlogSection } from './blogTypes'

const CORE_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-true-balance',
    title: 'What Is Cash Prophet? Cash Clarity for UK Business Owners',
    metaDescription:
      'Cash Prophet shows the Available Balance you can genuinely spend, after commitments and expected receipts, not just your bank balance.',
    keywords: ['available balance', 'cash clarity', 'UK small business', 'safe to spend', 'committed funds'],
    publishedAt: '2026-06-01',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'Your bank balance is not your spending money. Cash Prophet shows what is left after everything already spoken for.',
    relatedSlugs: ['bank-balance-vs-safe-to-spend-uk', 'true-balance-vs-accounting-software'],
    sections: [
      {
        type: 'p',
        text: 'Most UK business owners check their bank app and guess. Cash Prophet replaces guessing with one number: current cash, minus committed funds, plus expected receipts. It answers a simple question: how much is genuinely mine to use?',
      },
      {
        type: 'h2',
        text: 'How your Available Balance is calculated',
      },
      {
        type: 'ul',
        items: [
          'Current account cash: what is in the bank today',
          'Minus committed funds: payroll accruing, VAT building, planned costs, reserve targets',
          'Plus expected receipts: invoices and project payments you are still owed',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet is not accounting software. It does not replace Xero, FreeAgent or QuickBooks. It sits above your accounts as a cash position tool for owners who run the numbers themselves.',
      },
      {
        type: 'h2',
        text: 'Who it is for',
      },
      {
        type: 'ul',
        items: [
          'Trades and contractors with lumpy project income',
          'Cafes, restaurants and hospitality with payroll and rent cycles',
          'Multi site operators who need one roll up view',
          'Limited companies juggling VAT, corporation tax and PAYE',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is Cash Prophet the same as my bank balance?',
            a: 'No. Your bank balance ignores money already spoken for. Cash Prophet subtracts commitments and adds money you are still owed but have not received.',
          },
        ],
      },
    ],
  },
  {
    slug: 'bank-balance-vs-safe-to-spend-uk',
    title: 'Bank Balance vs Safe to Spend: What UK Owners Actually Need',
    metaDescription:
      'Why your UK business bank balance misleads you, what safe to spend really means, and how committed funds change the picture for SMEs.',
    keywords: ['safe to spend', 'bank balance', 'UK business', 'cash clarity', 'available balance'],
    publishedAt: '2026-06-03',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'Freelancer apps popularised safe to spend for invoices. UK SMEs with payroll and VAT need a deeper view.',
    relatedSlugs: ['what-is-true-balance', 'how-much-set-aside-vat-uk'],
    sections: [
      {
        type: 'p',
        text: 'Freelancer tools calculate safe to spend from invoices and tax percentages. That works when your income is a simple list of client payments. It breaks down once you have payroll, CIS, quarterly VAT, corporation tax and a reserve account.',
      },
      {
        type: 'h2',
        text: 'Why the bank balance lies',
      },
      {
        type: 'ul',
        items: [
          'Payroll accrues every day, even though it leaves on the 28th',
          'VAT for last quarter is still owed, even if the cash is sitting there',
          'A planned van purchase or refit is building up in the background',
          'Money in a reserve account is not free to spend from current',
        ],
      },
      {
        type: 'h2',
        text: 'Safe to spend vs Available Balance',
      },
      {
        type: 'p',
        text: 'Safe to spend usually means cash minus tax set asides. Available Balance goes further: it includes all committed funds, monthly costs accruing, Due items, planned one offs, and expected receipts on the other side.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'What is the best safe to spend app for UK businesses?',
            a: 'Freelancer apps suit solo operators with simple invoice flows. SMEs with payroll, reserves and irregular bills benefit from a commitment based tool like Cash Prophet.',
          },
        ],
      },
    ],
  },
  {
    slug: 'uk-small-business-cash-flow-forecast',
    title: 'Cash Flow Forecast for UK Small Businesses (Without a Spreadsheet)',
    metaDescription:
      'How to forecast UK small business cash flow 30 to 90 days ahead using scheduled costs, expected receipts and reserve transfers, not guesswork.',
    keywords: ['cash flow forecast UK', 'small business cash flow', '90 day forecast', 'SME cash planning'],
    publishedAt: '2026-06-05',
    updatedAt: '2026-07-24',
    category: 'Cash flow',
    readMinutes: 2,
    excerpt:
      'Spreadsheets work until they do not. Here is what a forward cash outlook needs for a real UK business.',
    relatedSlugs: ['cash-flow-spreadsheet-alternative-uk', 'lumpy-income-cash-flow-building-trades', 'small-business-cash-flow-management-uk'],
    sections: [
      {
        type: 'p',
        text: 'Bank connected forecasters focus on transactions. Cash Prophet forecasts from what you already know: monthly costs, planned payments, reserve transfers and dated expected receipts.',
      },
      {
        type: 'h2',
        text: 'What to include in a 90 day outlook',
      },
      {
        type: 'ul',
        items: [
          'Monthly commitments on their due dates: rent, payroll, suppliers',
          'One off planned costs with build up: equipment, vehicles, refurbishments',
          'Expected receipts with dates: deposits, stage payments, final balances',
          'Reserve transfers between current and reserve accounts',
        ],
      },
      {
        type: 'h2',
        text: 'Cash line vs Available Balance line',
      },
      {
        type: 'p',
        text: 'The cash line shows your current account balance forward. The Available Balance line adjusts for committed funds and expected receipts, so you see whether you are genuinely improving or just moving money around.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How far ahead should a small business forecast cash flow?',
            a: 'Thirty days catches immediate crunches. Ninety days covers VAT quarters, monthly payroll cycles and most project payment schedules.',
          },
        ],
      },
    ],
  },
  {
    slug: 'how-much-set-aside-vat-uk',
    title: 'How Much to Set Aside for VAT (UK Small Business Guide)',
    metaDescription:
      'Practical ways UK small businesses reserve for quarterly VAT: flat percentages, reserve accounts and month by month planning.',
    keywords: ['VAT set aside', 'UK VAT reserve', 'quarterly VAT', 'small business VAT'],
    publishedAt: '2026-06-08',
    updatedAt: '2026-07-24',
    category: 'Tax & reserves',
    readMinutes: 2,
    excerpt:
      'A percentage on every invoice is a start. Quarterly VAT bills need month by month reserve planning.',
    relatedSlugs: ['corporation-tax-reserve-small-business', 'bank-balance-vs-safe-to-spend-uk'],
    sections: [
      {
        type: 'p',
        text: 'Many owners use a rough 20% rule or a separate savings pot. Limited companies with mixed income and reclaimable VAT often need more precision.',
      },
      {
        type: 'h2',
        text: 'Three approaches compared',
      },
      {
        type: 'ul',
        items: [
          'Flat percentage: simple, wrong when expenses are high or VAT varies by quarter',
          'Spreadsheet VAT tab: flexible, goes stale by mid quarter',
          'Reserve Planner: enter VAT in the months it is actually due (Mar, Jun, Sep, Dec) and accrue monthly toward each bill',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet Reserve Planner models irregular bills in their real due months, not smoothed as an average, so committed funds show whether you are on track before the return is due.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Should VAT money sit in my current account?',
            a: 'Many owners use a separate reserve account. Cash Prophet tracks the transfer target each month so your Available Balance stays honest.',
          },
        ],
      },
    ],
  },
  {
    slug: 'corporation-tax-reserve-small-business',
    title: 'Corporation Tax Reserve: Planning for the Year End Bill',
    metaDescription:
      'How UK limited companies set aside for corporation tax, avoid March surprises, and track reserves month by month.',
    keywords: ['corporation tax reserve', 'UK limited company', 'year end tax', 'tax provision SME'],
    publishedAt: '2026-06-10',
    updatedAt: '2026-07-24',
    category: 'Tax & reserves',
    readMinutes: 2,
    excerpt:
      'Corporation tax is annual and painful. Monthly set aside beats a single panic transfer in December.',
    relatedSlugs: ['how-much-set-aside-vat-uk', 'when-to-pay-yourself-limited-company-uk'],
    sections: [
      {
        type: 'p',
        text: 'Unlike PAYE or VAT, corporation tax does not arrive monthly. A £14,000 bill in December can wipe a healthy looking current account if you have not been accruing all year, mentally or in a reserve plan.',
      },
      {
        type: 'h2',
        text: 'Building a corporation tax reserve',
      },
      {
        type: 'ul',
        items: [
          'Estimate annual liability with your accountant, or last year plus growth',
          'Add a December, or payment month, bill in the Reserve Planner',
          'Transfer a monthly amount from current to reserve',
          'Treat reserved money as committed, not available to spend',
        ],
      },
      {
        type: 'p',
        text: 'Accounting software records tax after the fact. Cash Prophet helps you provision before the fact, so the Available Balance on the dashboard matches reality.',
      },
    ],
  },
  {
    slug: 'cash-flow-spreadsheet-alternative-uk',
    title: 'Still Using a Cash Flow Spreadsheet? UK Alternatives Compared',
    metaDescription:
      'Compare cash flow spreadsheets vs Cash Prophet for UK small businesses: pros, cons, and when to switch.',
    keywords: ['cash flow spreadsheet', 'Excel cash flow UK', 'spreadsheet alternative', 'cash flow template'],
    publishedAt: '2026-06-12',
    updatedAt: '2026-07-24',
    category: 'Comparisons',
    readMinutes: 2,
    excerpt:
      'Every owner starts with a spreadsheet. Here is when dedicated cash clarity software earns its keep.',
    relatedSlugs: ['uk-small-business-cash-flow-forecast', 'cash-flow-tools-uk-small-business-compared'],
    sections: [
      {
        type: 'p',
        text: 'Spreadsheets are free and familiar. They also go out of date the moment you look away, break when you add a second site, and hide errors in formulas. Dedicated tools trade flexibility for always current clarity.',
      },
      {
        type: 'h2',
        text: 'Spreadsheet vs Cash Prophet',
      },
      {
        type: 'ul',
        items: [
          'Spreadsheet: full control, high maintenance, no committed funds logic',
          'Bank connected forecasters: automatic transactions, subscription cost, categorisation cleanup',
          'Cash Prophet: manual balances, commitment accruals, Reserve Planner, Available Balance',
        ],
      },
      {
        type: 'h2',
        text: 'When to leave the spreadsheet',
      },
      {
        type: 'p',
        text: 'If you update balances weekly, have more than one commitment type, or got surprised by VAT or payroll despite a spreadsheet, you are ready for a purpose built view.',
      },
    ],
  },
  {
    slug: 'true-balance-vs-accounting-software',
    title: 'Cash Prophet vs Accounting Software',
    metaDescription:
      'Cash Prophet vs accounting software: why Xero, FreeAgent and QuickBooks do not answer what you can spend, and how they work together.',
    keywords: [
      'Cash Prophet vs accounting software',
      'Cash Prophet vs Xero',
      'FreeAgent cash flow',
      'accounting software UK',
      'what can I spend',
    ],
    publishedAt: '2026-06-15',
    updatedAt: '2026-07-24',
    category: 'Comparisons',
    readMinutes: 2,
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
        text: 'Xero, FreeAgent, Sage and QuickBooks excel at invoices, expenses, VAT returns and year end accounts. Their cash flow reports are backward looking and profit oriented, not built for "what can I spend this week".',
      },
      {
        type: 'h2',
        text: 'What accounting software does well',
      },
      {
        type: 'ul',
        items: [
          'HMRC compliant VAT and MTD submissions',
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
          'Forward cash outlook with the Available Balance line',
          'Reserve Planner for irregular tax and insurance bills',
          'Expected receipts for project based income',
        ],
      },
      {
        type: 'p',
        text: 'Use both: accounting software for compliance, Cash Prophet for operational cash decisions. That separation is the niche.',
      },
    ],
  },
  {
    slug: 'cash-flow-tools-uk-small-business-compared',
    title: 'Best Cash Flow Tools for UK Small Businesses (2026 Comparison)',
    metaDescription:
      'Compare UK cash flow tools and approaches, from bank connected forecasters to reserve based platforms like Cash Prophet.',
    keywords: ['best cash flow software UK', 'cash flow tools comparison', 'SME finance apps 2026'],
    publishedAt: '2026-06-18',
    updatedAt: '2026-07-24',
    category: 'Comparisons',
    readMinutes: 2,
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
          'Invoice led apps: freelancers, tax vault, safe to spend from invoices',
          'Bank connected forecasters: scenario planning, established feeds',
          'Multi business forecasters: 90 day forecast, categorisation',
          'Cash Prophet: UK SMEs, commitments plus reserves plus Available Balance, multi site',
        ],
      },
      {
        type: 'h2',
        text: 'How to choose',
      },
      {
        type: 'ul',
        items: [
          'Solo freelancer with invoices: invoice native safe to spend apps',
          'Limited company with payroll: commitment based tools',
          'Multiple sites or companies: roll up scope and group view',
          'Lumpy project income: expected receipts and forward outlook',
        ],
      },
    ],
  },
  {
    slug: 'when-to-pay-yourself-limited-company-uk',
    title: 'When Can I Pay Myself? UK Limited Company Owner Guide',
    metaDescription:
      'How UK directors decide when to take dividends or salary, using Cash Prophet, reserves and committed funds before you transfer.',
    keywords: ['pay yourself limited company', 'director dividends UK', 'when to take salary', 'owner drawings'],
    publishedAt: '2026-06-20',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'The account looks healthy. That does not mean you can afford a dividend. Check commitments first.',
    relatedSlugs: ['corporation-tax-reserve-small-business', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'Directors often pay themselves when cash feels comfortable. Accountants prefer planned dividends after retained profit is clear. Day to day, you need a third check: after payroll, VAT, tax reserves and supplier commitments, is there headroom?',
      },
      {
        type: 'h2',
        text: 'A practical order of operations',
      },
      {
        type: 'ul',
        items: [
          'Cover overdue and Due commitments',
          'Top up reserve accounts to target',
          'Leave buffer for next payroll and VAT',
          'Check your Available Balance, not just bank balance',
          'Then consider dividend or extra salary',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Can Cash Prophet tell me my legal dividend limit?',
            a: 'No, that comes from your accounts and accountant. Cash Prophet shows cash headroom after operational commitments.',
          },
        ],
      },
    ],
  },
  {
    slug: 'lumpy-income-cash-flow-building-trades',
    title: 'Cash Flow for UK Building Trades & Contractors',
    metaDescription:
      'Manage lumpy project income, stage payments, CIS and equipment costs. Cash flow tips for UK builders and trades.',
    keywords: ['building trades cash flow', 'contractor cash flow UK', 'construction stage payments', 'CIS cash flow'],
    publishedAt: '2026-06-22',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Large deposits and quiet months are normal. Your cash view should reflect project timing, not monthly averages.',
    relatedSlugs: ['uk-small-business-cash-flow-forecast', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'A fit out deposit lands in March, payroll and materials run every month, CIS and subcontractor retainers add pressure, and a van replacement builds for ninety days before it hits. Generic budgeting apps miss this shape entirely.',
      },
      {
        type: 'h2',
        text: 'What trades businesses should track',
      },
      {
        type: 'ul',
        items: [
          'Expected receipts with dates for each stage payment',
          'Monthly materials, lease and subcontractor retainers',
          'Planned equipment with accrue until due funding',
          'CIS and PAYE on their own cycle',
          'VAT quarters through the Reserve Planner',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet includes a Riverside Building demo, a trades business with realistic commitments and lumpy receipts. Try it without signing up.',
      },
    ],
  },
  {
    slug: 'cafe-restaurant-cash-flow-management',
    title: 'Cafe & Restaurant Cash Flow: UK Owner Guide',
    metaDescription:
      'Daily takings vs monthly costs. How UK cafe and restaurant owners manage cash, payroll, rent and reserves.',
    keywords: ['cafe cash flow UK', 'restaurant cash management', 'hospitality payroll', 'food business cash flow'],
    publishedAt: '2026-06-25',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Steady daily income does not mean simple cash flow. Rent and payroll still arrive on fixed dates.',
    relatedSlugs: ['multi-site-business-cash-dashboard', 'restaurant-cash-flow-uk', 'hospitality-cash-management-uk'],
    sections: [
      {
        type: 'p',
        text: 'Hospitality income is often steady day to day, but costs are lumpy: rent on the 1st, wholesale mid month, payroll at month end. Multi site operators multiply the problem across venues.',
      },
      {
        type: 'h2',
        text: 'Cash outlook for steady income businesses',
      },
      {
        type: 'p',
        text: 'Cash Prophet marks income pattern as steady or lumpy per business. For cafes, the forward outlook plots scheduled outgoings; your real balance trends higher than the chart because daily sales are not modelled. Use Trends for historical trajectory and the outlook for cost timing.',
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
    title: 'Multi Site Business Cash: One Dashboard for Every Location',
    metaDescription:
      'Roll up cash, commitments and Available Balance across UK business sites, venues and group structures.',
    keywords: ['multi-site cash flow', 'multi-venue business UK', 'group cash dashboard', 'roll-up financial view'],
    publishedAt: '2026-06-28',
    updatedAt: '2026-07-24',
    category: 'Product',
    readMinutes: 2,
    excerpt:
      'Two cafes and a head office should not mean three spreadsheets. One scope tree, one Available Balance.',
    relatedSlugs: ['cafe-restaurant-cash-flow-management', 'what-is-true-balance'],
    sections: [
      {
        type: 'p',
        text: 'Leisure groups, multi site hospitality and holding structures need consolidated visibility without losing venue level detail. Cash Prophet scopes data to group, business or venue with roll up totals.',
      },
      {
        type: 'h2',
        text: 'Structure that matches reality',
      },
      {
        type: 'ul',
        items: [
          'Group: consolidated Available Balance across companies',
          'Business: separate companies in one workspace',
          'Venue: site level accounts and commitments',
          'Sidebar scope picker switches view without losing context',
        ],
      },
    ],
  },
  {
    slug: 'cash-flow-vs-profit-uk-small-business',
    title: 'Cash Flow vs Profit: Why UK SMEs Run Out of Money While Profitable',
    metaDescription:
      'Profitable on paper, broke in the bank. Cash flow vs profit for UK small businesses, and how to stay ahead.',
    keywords: ['cash flow vs profit', 'profitable but no cash', 'UK SME cash problem', 'working capital'],
    publishedAt: '2026-07-01',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'Profit is accounting. Cash is timing. Most surprises are timing problems.',
    relatedSlugs: ['true-balance-vs-accounting-software', 'uk-small-business-cash-flow-forecast'],
    sections: [
      {
        type: 'p',
        text: 'You can show a profit in Xero while the current account cannot cover payroll. Customers pay late, VAT leaves in one lump, equipment is bought before revenue is recognised. Owners who only read the P&L miss the gap.',
      },
      {
        type: 'h2',
        text: 'Common timing gaps',
      },
      {
        type: 'ul',
        items: [
          'Invoice sent, cash not received: expected receipts matter',
          'Tax provision not funded: reserves matter',
          'Growth spends cash before revenue follows',
          'Personal drawings treated as available cash',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet is deliberately cash and commitment first, not profit first. Pair it with your accounts for the full picture.',
      },
    ],
  },
  {
    slug: 'committed-funds-explained',
    title: 'What Are Committed Funds? (UK Small Business Guide)',
    metaDescription:
      'Committed funds explained: monthly accruals, Due items, planned costs and reserves, and how they affect your Available Balance.',
    keywords: ['committed funds', 'accruing costs', 'money spoken for', 'UK business commitments'],
    publishedAt: '2026-07-03',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'Money already spoken for is the part owners forget. Committed funds makes it visible.',
    relatedSlugs: ['what-is-true-balance', 'how-much-set-aside-vat-uk'],
    sections: [
      {
        type: 'p',
        text: 'Committed funds is everything your business has already promised, whether or not the cash has left yet. Payroll accrues daily. VAT builds toward quarter end. A planned van purchase grows until its due date.',
      },
      {
        type: 'h2',
        text: 'Three buckets',
      },
      {
        type: 'ul',
        items: [
          'Building up: monthly costs accruing, reserve targets, planned save to spend items',
          'Due now: overdue or current period items waiting for payment',
          'Expected receipts: money owed to you, which reduces net commitments on your Available Balance',
        ],
      },
      {
        type: 'p',
        text: 'The Cash Prophet Committed Funds panel shows all three in one place, scoped to your selected business or venue.',
      },
    ],
  },
  {
    slug: 'restaurant-cash-flow-uk',
    title: 'Restaurant Cash Flow Management for UK Owners',
    metaDescription:
      'How UK restaurants manage cash flow around payroll, rent, food cost and VAT, without guessing from the bank balance alone.',
    keywords: ['restaurant cash flow UK', 'restaurant payroll', 'restaurant VAT', 'restaurant cash management'],
    publishedAt: '2026-07-24',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Covers can be full and the till still tight. Restaurants live and die by payroll, rent and VAT timing.',
    relatedSlugs: ['cafe-restaurant-cash-flow-management', 'hospitality-cash-management-uk', 'how-much-set-aside-vat-uk'],
    sections: [
      {
        type: 'p',
        text: 'A restaurant can be busy every night and still run short. Food and drink sales cover the till, but payroll, rent, wholesale accounts and VAT all move on their own schedules regardless of how many covers you did last week.',
      },
      {
        type: 'h2',
        text: 'What drains a restaurant current account',
      },
      {
        type: 'ul',
        items: [
          'Kitchen and front of house payroll, weekly or monthly',
          'Rent and service charge on fixed dates',
          'Wholesale food and drink accounts settled mid month',
          'Quarterly VAT that builds fast on higher turnover',
        ],
      },
      {
        type: 'h2',
        text: 'A steadier approach',
      },
      {
        type: 'p',
        text: 'Cash Prophet accrues payroll and rent daily, so the Available Balance already reflects what is building, not just what has left the account. VAT sits in the Reserve Planner, funded monthly instead of arriving as a shock each quarter.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Why does a busy restaurant still feel short of cash?',
            a: 'Sales are daily but big costs, payroll, rent and VAT, land in lumps. Without tracking what is building, the bank balance looks healthier than the real position.',
          },
        ],
      },
    ],
  },
  {
    slug: 'bar-pub-cash-flow-uk',
    title: 'Bar & Pub Cash Flow Management for UK Owners',
    metaDescription:
      'Cash flow tips for UK bars and pubs: stock, wages, and getting through the quiet midweek without a scare.',
    keywords: ['bar cash flow UK', 'pub cash flow', 'pub cash management', 'hospitality wages'],
    publishedAt: '2026-07-24',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Friday and Saturday carry the week. Cash flow has to survive Monday to Thursday as well.',
    relatedSlugs: ['cafe-restaurant-cash-flow-management', 'hospitality-cash-management-uk', 'restaurant-cash-flow-uk'],
    sections: [
      {
        type: 'p',
        text: 'A pub or bar can take most of its weekly income across two or three nights. Stock orders, wages and rent do not wait for the weekend, so the quiet midweek days are when the cash position really gets tested.',
      },
      {
        type: 'h2',
        text: 'Where the pressure builds',
      },
      {
        type: 'ul',
        items: [
          'Drink and stock orders due whether trade was strong or slow',
          'Bar staff wages accruing through the week',
          'Rent, business rates and licensing costs on fixed dates',
          'Quiet midweek trade with the same fixed costs as a busy weekend',
        ],
      },
      {
        type: 'h2',
        text: 'Smoothing the week',
      },
      {
        type: 'p',
        text: 'Cash Prophet treats wages and rent as daily accruals rather than end of week surprises, so your Available Balance already reflects Thursday costs on a Tuesday. Stock and seasonal peaks can sit as planned commitments, funded ahead of time.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How do I plan cash flow around a quiet midweek?',
            a: 'Treat fixed weekly costs, wages, rent and stock, as commitments that accrue daily. That way the weekend takings are not the only thing keeping the position afloat.',
          },
        ],
      },
    ],
  },
  {
    slug: 'hospitality-cash-management-uk',
    title: 'Hospitality Cash Management: A UK Owner Overview',
    metaDescription:
      'Cash management for UK hospitality businesses: cafes, restaurants, bars and pubs, and how commitments differ from retail or trades.',
    keywords: ['hospitality cash management', 'hospitality finance UK', 'cafe restaurant bar cash flow', 'hospitality payroll'],
    publishedAt: '2026-07-24',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Cafes, restaurants, bars and pubs share the same shape of problem: steady sales, lumpy costs.',
    relatedSlugs: ['cafe-restaurant-cash-flow-management', 'restaurant-cash-flow-uk', 'bar-pub-cash-flow-uk'],
    sections: [
      {
        type: 'p',
        text: 'Hospitality businesses take money most days of the week, but the big costs, payroll, rent, wholesale suppliers and VAT, land in fixed lumps. That mismatch is why hospitality finance needs a different view from a shop or trades business.',
      },
      {
        type: 'h2',
        text: 'What most hospitality venues share',
      },
      {
        type: 'ul',
        items: [
          'Payroll accruing daily across kitchen, bar and front of house',
          'Rent and service charge due on fixed dates each month',
          'Wholesale and stock accounts settled mid month',
          'Quarterly VAT that can spike with seasonal trade',
        ],
      },
      {
        type: 'h2',
        text: 'One view across venues',
      },
      {
        type: 'p',
        text: 'Cash Prophet scopes each site while rolling up to a group Available Balance, so a multi venue operator sees both the detail and the total. Reserve Planner handles VAT and annual costs so they stop arriving as surprises.',
      },
      {
        type: 'p',
        text: 'For venue specific detail see the cafe and restaurant guide, or the bar and pub guide.',
      },
    ],
  },
  {
    slug: 'leisure-business-cash-flow-uk',
    title: 'Leisure & Attraction Business Cash Flow (UK)',
    metaDescription:
      'Cash flow clarity for UK leisure businesses: attractions, soft play and activity venues with seasonal takings and fixed costs.',
    keywords: ['leisure business cash flow', 'attraction cash management', 'soft play cash flow', 'seasonal cash flow UK'],
    publishedAt: '2026-07-24',
    updatedAt: '2026-07-24',
    category: 'Industries',
    readMinutes: 2,
    excerpt:
      'Half term is busy, February is quiet. Fixed costs do not follow the same calendar as your takings.',
    relatedSlugs: ['multi-site-business-cash-dashboard', 'hospitality-cash-management-uk', 'small-business-cash-flow-management-uk'],
    sections: [
      {
        type: 'p',
        text: 'Soft play centres, attractions and activity venues see takings swing hard with school holidays and weather. Staff rotas, rent, insurance and equipment maintenance keep running on their own schedule regardless of footfall.',
      },
      {
        type: 'h2',
        text: 'The seasonal cash flow trap',
      },
      {
        type: 'ul',
        items: [
          'Strong holiday weeks can hide a weak February or September',
          'Wages and rates are fixed costs, not variable with footfall',
          'Equipment servicing and safety checks arrive on their own calendar',
          'Multiple sites multiply the swings across a group',
        ],
      },
      {
        type: 'h2',
        text: 'Planning around the swings',
      },
      {
        type: 'p',
        text: 'Cash Prophet lets you reserve during busy months for known quiet ones, so a strong October funds a flatter January. Trends shows the seasonal pattern over time, and the Available Balance keeps day to day decisions honest in between.',
      },
    ],
  },
  {
    slug: 'small-business-cash-flow-management-uk',
    title: 'Cash Flow Management for Small Business (UK Guide)',
    metaDescription:
      'A practical guide to cash flow management for UK small businesses: what to track, how often, and where most owners go wrong.',
    keywords: ['cash flow management small business UK', 'small business cash flow', 'SME cash management', 'business cash planning'],
    publishedAt: '2026-07-24',
    updatedAt: '2026-07-24',
    category: 'Guides',
    readMinutes: 2,
    excerpt:
      'Cash flow management does not need a finance team. It needs the right few numbers, checked regularly.',
    relatedSlugs: ['what-is-true-balance', 'uk-small-business-cash-flow-forecast', 'committed-funds-explained'],
    sections: [
      {
        type: 'p',
        text: 'Cash flow management for a small business is not complicated in theory: know what cash you have, what is already committed, and what is realistically coming in. Most owners struggle because that information lives in their head, not in one place.',
      },
      {
        type: 'h2',
        text: 'The essentials to track',
      },
      {
        type: 'ul',
        items: [
          'Current cash across your business bank accounts',
          'Committed funds: payroll, VAT, rent and other regular costs',
          'Reserves for irregular bills like corporation tax and insurance',
          'Expected receipts you can realistically rely on',
        ],
      },
      {
        type: 'h2',
        text: 'Where owners go wrong',
      },
      {
        type: 'p',
        text: 'The most common mistake is spending from the bank balance instead of the Available Balance. The second is building a detailed spreadsheet once and never updating it. Cash Prophet fixes both: commitments accrue automatically, and the Available Balance updates the moment you refresh a bank balance.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How often should I check cash flow as a small business?',
            a: 'Update balances weekly at minimum, and review reserve targets monthly. Cash Prophet accrues commitments daily in between so the picture never goes stale.',
          },
        ],
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
