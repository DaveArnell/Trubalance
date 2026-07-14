import type { BlogPost } from './blogTypes'

const CTA =
  'True Balance is built for this: one honest available-cash number, committed money in view, and a Reserve Planner for VAT and tax — without replacing your accounting software.'

/**
 * Ten SEO cornerstone articles — own “bank balance isn’t available cash”
 * and related UK small-business cash-management searches.
 */
export const CORNERSTONE_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'your-bank-balance-is-lying-to-you',
    title: 'Your Bank Balance Is Lying To You',
    metaDescription:
      'Your business bank balance isn’t available cash. Here’s why that number misleads UK owners — and what to look at instead.',
    keywords: [
      'bank balance is lying',
      'bank balance isn’t available cash',
      'managing business cash',
      'UK small business cash',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 7,
    excerpt:
      'A healthy balance in the banking app can still leave you short. The lie is that cash in the account equals money you can spend.',
    relatedSlugs: [
      'bank-balance-isnt-your-money',
      'bank-balance-vs-available-cash',
      'how-much-money-does-my-business-actually-have',
    ],
    sections: [
      {
        type: 'p',
        text: 'You open the bank app. The number looks fine. You approve a purchase, hire, or dividend. Two weeks later payroll and VAT land and the comfort vanishes. The balance wasn’t wrong — it was incomplete.',
      },
      {
        type: 'h2',
        text: 'What the bank balance never shows',
      },
      {
        type: 'ul',
        items: [
          'Payroll and PAYE already accruing toward payday',
          'VAT building for the quarter even if the return isn’t due yet',
          'Rent, finance agreements and software still owed this month',
          'Corporation tax or insurance you know is coming',
          'Money you mentally set aside that hasn’t left the account yet',
        ],
      },
      {
        type: 'h2',
        text: 'Bank balance isn’t available cash',
      },
      {
        type: 'p',
        text: 'Available cash is what’s left after money already spoken for. Until you subtract committed money — and only add receipts you can realistically expect — every spending decision is a guess dressed up as confidence.',
      },
      {
        type: 'h2',
        text: 'A better habit for UK owners',
      },
      {
        type: 'p',
        text: 'Before you spend from “what’s in the account,” ask: what is already building up, what is due, and what tax money am I putting aside? That shift — from bank balance to available cash — is the foundation of the True Balance Method.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is my bank balance wrong?',
            a: 'No. It’s accurate as a cash total. It’s misleading as a spendable total, because it ignores commitments and reserves.',
          },
          {
            q: 'Does accounting software fix this?',
            a: 'Accounting software records what happened and helps with filings. It isn’t designed to answer “how much can I safely spend this week?” That’s a different job.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'bank-balance-isnt-your-money',
    title: 'Bank Balance Isn’t Your Money',
    metaDescription:
      'Bank balance isn’t your money until you account for committed costs and tax set-asides. Own the phrase every UK owner feels but rarely names.',
    keywords: [
      'bank balance isn’t your money',
      'bank balance isnt your money',
      'committed money',
      'how much cash is available in my business',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 6,
    excerpt:
      'Cash in the account is real. Ownership of that cash for spending is not automatic. Here’s the distinction that changes how you run the business.',
    relatedSlugs: [
      'your-bank-balance-is-lying-to-you',
      'committed-funds-explained',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: '“Bank balance isn’t your money” sounds dramatic until you’ve been caught by VAT, payday, or a bill you knew was coming. The cash was sitting there. It just wasn’t free.',
      },
      {
        type: 'h2',
        text: 'Whose money is it while it sits there?',
      },
      {
        type: 'p',
        text: 'Until HMRC, staff, landlords and suppliers are paid, part of that balance is spoken for. Treating the whole figure as yours is how profitable businesses still hit cash crises.',
      },
      {
        type: 'h2',
        text: 'Committed money vs available cash',
      },
      {
        type: 'ul',
        items: [
          'Committed money — already building or owed (payroll, VAT, rent, reserves)',
          'Available cash — what you can use without borrowing from those obligations',
          'Bank balance — the crude total that mixes both together',
        ],
      },
      {
        type: 'h2',
        text: 'How much cash is available in my business?',
      },
      {
        type: 'p',
        text: 'That’s the real question owners mean when they check their phone. Answer it with: cash now, minus committed funds, plus only realistic expected receipts. Call that your True Balance — and use it for Tuesday decisions, not the raw bank figure.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Does “bank balance isn’t your money” mean I can’t spend?',
            a: 'No. It means spend from what’s left after commitments and tax set-asides — not from the full balance.',
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
      'How much cash is available in my business? Learn the difference between bank balance, profit, and genuinely available cash for UK SMEs.',
    keywords: [
      'how much money does my business actually have',
      'how much cash is available in my business',
      'business cash management',
      'small business cash planning',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 7,
    excerpt:
      'Profit, bank balance and available cash answer three different questions. Only one tells you what you can safely do next.',
    relatedSlugs: [
      'bank-balance-vs-available-cash',
      'cash-flow-vs-profit-uk-small-business',
      'the-true-balance-method-explained',
    ],
    sections: [
      {
        type: 'p',
        text: '“How much money does my business actually have?” usually means: what can I afford without creating a problem later? Profit and bank balance both fail that test on their own.',
      },
      {
        type: 'h2',
        text: 'Three numbers owners confuse',
      },
      {
        type: 'ul',
        items: [
          'Profit — accounting result for a period (not cash in the bank)',
          'Bank balance — cash today (includes money already spoken for)',
          'Available cash — what’s left after commitments and tax reserves',
        ],
      },
      {
        type: 'h2',
        text: 'Small business cash planning in practice',
      },
      {
        type: 'p',
        text: 'List what builds every month. List irregular bills (VAT, insurance, corporation tax). Track money you’re still owed that you’re confident will arrive. The gap between cash and those obligations is your honest position.',
      },
      {
        type: 'h2',
        text: 'A business financial snapshot that helps',
      },
      {
        type: 'p',
        text: 'You don’t need another 40-row spreadsheet. You need a living snapshot: balances, committed money, expected receipts, and reserves for tax. That’s business cash management owners will stick with — because it answers one question in thirty seconds.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Why can we be profitable and still feel broke?',
            a: 'Profit doesn’t equal cash timing. Tax, stock, wages and customer delays remove cash even when the accounts look healthy.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'bank-balance-vs-available-cash',
    title: 'The Difference Between Bank Balance And Available Cash',
    metaDescription:
      'Bank balance vs available cash for UK businesses — why they diverge, and how committed money and VAT set-asides change what you can spend.',
    keywords: [
      'bank balance vs available cash',
      'bank balance isn’t available cash',
      'available cash business',
      'committed money',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 6,
    excerpt:
      'Same account. Two completely different answers. Understanding the gap is the heart of managing business cash.',
    relatedSlugs: [
      'your-bank-balance-is-lying-to-you',
      'committed-funds-explained',
      'true-balance-vs-accounting-software',
    ],
    sections: [
      {
        type: 'p',
        text: 'Bank balance is what’s in the account. Available cash is what’s left after you honour what’s already committed. Confusing them is normal — and expensive.',
      },
      {
        type: 'h2',
        text: 'Bank balance',
      },
      {
        type: 'p',
        text: 'A live total from your bank. Essential. Instant. But silent about payroll building, VAT accruing, or money set aside for tax that hasn’t moved to a savings pot yet.',
      },
      {
        type: 'h2',
        text: 'Available cash',
      },
      {
        type: 'p',
        text: 'Cash minus committed money (monthly costs accruing, due bills, reserve targets), plus only receipts you’re confident of. That’s the number for hires, kit, dividends and quiet months.',
      },
      {
        type: 'h2',
        text: 'Why the gap grows for UK limited companies',
      },
      {
        type: 'ul',
        items: [
          'Quarterly VAT and corporation tax lumpiness',
          'PAYE and pensions mid-month',
          'Lumpy trade income with regular costs',
          'Mentally reserved money that still sits in current',
        ],
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Is available cash the same as safe to spend?',
            a: 'Similar idea. Freelancer tools often mean cash minus tax %. SMEs usually need committed funds, reserves and expected receipts — a fuller available-cash view.',
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
      'Why UK cash flow forecasts die in the spreadsheet — and why a live available-cash position beats a 12-month model you never update.',
    keywords: [
      'cash flow forecast forgotten',
      'business cash management',
      'small business cash planning',
      'cash flow spreadsheet',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 6,
    excerpt:
      'Most forecasts fail from neglect, not maths. Owners need a daily truth number more than a perfect annual model.',
    relatedSlugs: [
      'uk-small-business-cash-flow-forecast',
      'business-financial-snapshot',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: 'You’ve built the 12-month cash flow. It looked sharp in January. By March the columns are stale, assumptions are wrong, and you’re back to the bank app. You’re not lazy — the tool asked for the wrong habit.',
      },
      {
        type: 'h2',
        text: 'Why forecasts get abandoned',
      },
      {
        type: 'ul',
        items: [
          'They need weekly maintenance few owner-operators have',
          'Tiny input errors compound into fantasy totals',
          'They answer “what might happen” when you needed “what’s true today”',
          'Accounting software reports feel related but don’t replace the live spend question',
        ],
      },
      {
        type: 'h2',
        text: 'What sticks instead',
      },
      {
        type: 'p',
        text: 'A business financial snapshot you can refresh in minutes: update balances, keep commitments current, mark VAT and tax reserves. Forecasting still has a place — it’s just a poor substitute for knowing available cash this week.',
      },
      {
        type: 'h2',
        text: 'Forecast later, position first',
      },
      {
        type: 'p',
        text: 'Get the True Balance habit working. Then layer a simple outlook on top. That order — position before projection — is why cash flow forecasts finally stop ending up forgotten.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'how-i-stop-vat-catching-me-out-every-quarter',
    title: 'How I Stop VAT Catching Me Out Every Quarter',
    metaDescription:
      'Putting money aside for VAT so the quarterly bill doesn’t smash cash flow. A practical UK owner approach to tax reserves.',
    keywords: [
      'putting money aside for VAT',
      'money set aside for tax',
      'VAT reserve small business',
      'business reserve planner',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 7,
    excerpt:
      'VAT doesn’t surprise you because of maths. It surprises you because the cash still looked spendable until payment day.',
    relatedSlugs: [
      'how-much-set-aside-vat-uk',
      'business-reserve-planner-explained',
      'how-to-put-money-aside-vat-tax-irregular-bills',
    ],
    sections: [
      {
        type: 'p',
        text: 'Every quarter the same story: sales felt good, the balance looked fine, then the VAT bill arrived and everything tightened. The fix isn’t a clever HMRC trick — it’s treating VAT as committed money while it builds.',
      },
      {
        type: 'h2',
        text: 'Putting money aside for VAT',
      },
      {
        type: 'ul',
        items: [
          'Estimate the quarter early and update as you go',
          'Treat that amount as spoken for — not free cash',
          'Move it to a reserve pot or track it as a virtual reserve',
          'Mark it paid when it leaves so your available cash jumps honestly',
        ],
      },
      {
        type: 'h2',
        text: 'Money set aside for tax isn’t optional fluff',
      },
      {
        type: 'p',
        text: 'Corporation tax, PAYE and VAT all compete with supplier payments in the same current account. If tax money still “looks available,” you will spend it. A business reserve planner exists so irregular bills stop ambushing you.',
      },
      {
        type: 'h2',
        text: 'What “caught out” usually means',
      },
      {
        type: 'p',
        text: 'Cash left the bank for VAT, but mentally (or in your tool) VAT was still counted as due — or worse, never reserved. Either you feel too rich before payment day, or too poor after if you’re still double-counting. Reserves plus clear “paid” status fix both.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'How much should I set aside for VAT?',
            a: 'Use your typical VAT due each quarter as a starting target, then refine with recent returns. The discipline of setting it aside matters more than perfection on day one.',
          },
        ],
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'the-true-balance-method-explained',
    title: 'The True Balance Method Explained',
    metaDescription:
      'The True Balance Method explained: manage UK business money from available cash — not the bank balance — with committed funds and reserves.',
    keywords: [
      'True Balance Method explained',
      'true balance method',
      'managing business cash',
      'business cash management',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 8,
    excerpt:
      'A simple owner framework: start from cash, subtract what’s spoken for, add only realistic receipts, decide from what’s left.',
    relatedSlugs: [
      'what-is-the-true-balance-method',
      'bank-balance-isnt-your-money',
      'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    ],
    sections: [
      {
        type: 'p',
        text: 'The True Balance Method is how owners stop treating the banking app as a green light. It’s financial management for decisions between accountant visits — not bookkeeping, not a 12-month forecast you’ll abandon.',
      },
      {
        type: 'h2',
        text: 'The steps',
      },
      {
        type: 'ul',
        items: [
          'See cash across the accounts that matter',
          'Subtract committed money (accruing costs, dues, planned spends)',
          'Add only expected receipts you trust',
          'Hold separate space for VAT, tax and irregular bills (reserves)',
          'Use the resulting True Balance for everyday choices',
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
          'Not a promise that forecasts will be perfect',
        ],
      },
      {
        type: 'h2',
        text: 'Why the branding matters',
      },
      {
        type: 'p',
        text: 'When people search “how much cash is available in my business” or feel “bank balance isn’t your money,” they need a named method — and a product that keeps that method current. That’s the long game: own the idea, then deliver the daily habit.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'why-accounting-software-doesnt-tell-you-what-you-can-spend',
    title: "Why Accounting Software Isn't Designed To Tell You What You Can Actually Spend",
    metaDescription:
      'Why accounting software isn’t designed to tell you what you can spend — and how True Balance complements Xero, FreeAgent and QuickBooks.',
    keywords: [
      'accounting software what can I spend',
      'True Balance vs accounting software',
      'Xero cash available',
      'business financial dashboard',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 8,
    excerpt:
      'Accounts software records history for compliance. Spending confidence is a different product. That’s your niche.',
    relatedSlugs: [
      'true-balance-vs-accounting-software',
      'what-accounting-software-tells-you-and-what-it-does-not',
      'your-bank-balance-is-lying-to-you',
    ],
    sections: [
      {
        type: 'p',
        text: 'Accounting software is excellent at invoices, expenses, VAT returns and year-end. Ask it “what can I actually spend this week?” and you’ll get reports that weren’t built for that job.',
      },
      {
        type: 'h2',
        text: 'What it was designed for',
      },
      {
        type: 'ul',
        items: [
          'Recording transactions accurately',
          'Producing accounts and tax figures',
          'Collaborating with your accountant',
          'Looking back over periods that have closed',
        ],
      },
      {
        type: 'h2',
        text: 'What owners still need on a Tuesday',
      },
      {
        type: 'ul',
        items: [
          'How much cash is available after commitments',
          'Whether VAT and tax are set aside',
          'Whether that new cost fits without borrowing from payday',
        ],
      },
      {
        type: 'h2',
        text: 'True Balance vs accounting software',
      },
      {
        type: 'p',
        text: 'Don’t replace your accounts. Add a business financial dashboard for available cash: committed funds, reserve planner, expected receipts, True Balance. Compliance tools stay. Clarity for spending decisions lives alongside them.',
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Should I cancel Xero or FreeAgent?',
            a: 'No. Keep accounting software for compliance. Use True Balance for operational cash clarity.',
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
      'What a business reserve planner is — putting money aside for VAT, tax and irregular bills so available cash stays honest.',
    keywords: [
      'business reserve planner',
      'putting money aside for VAT',
      'money set aside for tax',
      'small business cash planning',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 6,
    excerpt:
      'Irregular bills don’t fit monthly accruing. A reserve planner turns “I hope I’ve saved enough” into a visible target.',
    relatedSlugs: [
      'how-i-stop-vat-catching-me-out-every-quarter',
      'corporation-tax-reserve-small-business',
      'virtual-reserves-vs-separate-savings-accounts',
    ],
    sections: [
      {
        type: 'p',
        text: 'Rent and payroll build every month. VAT, insurance, corporation tax and renewals punch a hole once a quarter or once a year. A business reserve planner exists for the second type.',
      },
      {
        type: 'h2',
        text: 'Putting money aside on purpose',
      },
      {
        type: 'p',
        text: 'You name the bill, set the due window, and see how much to ring-fence each month. Whether the cash sits in a savings account or is tracked as a virtual reserve, the point is the same: that money must not look spendable.',
      },
      {
        type: 'h2',
        text: 'Money set aside for tax',
      },
      {
        type: 'ul',
        items: [
          'VAT — build through the quarter',
          'Corporation tax — build toward the payment date',
          'Insurance and licences — avoid January or renewal shocks',
        ],
      },
      {
        type: 'h2',
        text: 'How it connects to available cash',
      },
      {
        type: 'p',
        text: 'Until the bill is paid, the reserve target is committed money. When it leaves the bank, you mark it paid so True Balance recovers honestly — no double-counting.',
      },
      { type: 'p', text: CTA },
    ],
  },
  {
    slug: 'business-financial-snapshot',
    title: 'Business Financial Snapshot: The Dashboard Owners Actually Use',
    metaDescription:
      'A business financial snapshot and dashboard for UK SMEs — available cash, committed money and reserves without spreadsheet drag.',
    keywords: [
      'business financial snapshot',
      'business financial dashboard',
      'managing business cash',
      'business cash management',
    ],
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    category: 'Cornerstone',
    readMinutes: 6,
    excerpt:
      'Forget a wall of KPIs. Owners need one snapshot: what we have, what’s spoken for, what’s coming in, what to spend.',
    relatedSlugs: [
      'how-much-money-does-my-business-actually-have',
      'multi-site-business-cash-dashboard',
      'the-true-balance-method-explained',
    ],
    sections: [
      {
        type: 'p',
        text: '“Business financial dashboard” often means charts nobody opens. A useful business financial snapshot is smaller: cash, committed funds, expected receipts, reserves, True Balance — updated in the time it takes to sip coffee.',
      },
      {
        type: 'h2',
        text: 'What belongs on the snapshot',
      },
      {
        type: 'ul',
        items: [
          'Balances that matter (current, reserve, key venues)',
          'Committed money building and due',
          'Expected receipts you trust',
          'VAT and tax set-asides',
          'One available-cash number for decisions',
        ],
      },
      {
        type: 'h2',
        text: 'Managing business cash without theatre',
      },
      {
        type: 'p',
        text: 'Small business cash planning fails when the system is heavier than the decision. Start from bank balance isn’t available cash, keep commitments honest, and let the snapshot do its job: stop you spending money that isn’t really yours.',
      },
      { type: 'p', text: CTA },
    ],
  },
]
