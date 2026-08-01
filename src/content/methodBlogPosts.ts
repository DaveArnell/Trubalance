import type { BlogPost } from './blogTypes'
import { METHOD_BLOG_CATEGORY } from './trueBalanceMethod'

const METHOD_CTA =
  'Cash Prophet continuously accounts for meaningful commitments to give you one trusted Cash Prophet Balance: confidence in where your business really stands, alongside your accounting software.'

/** Educational articles for the Cash Prophet category. */
export const METHOD_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-the-true-balance-method',
    title: 'What Is Cash Prophet?',
    metaDescription:
      'Cash Prophet helps UK business owners see where the business really stands with one trusted Cash Prophet Balance, not the bank balance alone.',
    keywords: ['cash prophet', 'cash prophet balance', 'UK small business', 'financial management'],
    publishedAt: '2026-07-08',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'One trusted financial number that accounts for committed money, reserves and realistic receipts, so you know where the business really stands.',
    relatedSlugs: [
      'why-business-bank-balance-is-not-all-yours',
      'what-accounting-software-tells-you-and-what-it-does-not',
    ],
    sections: [
      {
        type: 'p',
        text: 'Cash Prophet is a practical way to manage business money. It starts from a quieter question most owners already ask: where does my business really stand once commitments are counted?',
      },
      {
        type: 'h2',
        text: 'Not the bank balance alone',
      },
      {
        type: 'p',
        text: 'Your bank balance shows cash in the account. It does not show payroll building toward month end, VAT accruing, or a quarterly insurance bill you know is coming. Cash Prophet brings those into view before they become a surprise.',
      },
      {
        type: 'h2',
        text: 'The core idea',
      },
      {
        type: 'ul',
        items: [
          'Start from cash in the bank',
          'Subtract money already committed or building up',
          'Add only realistic expected receipts',
          'Use the result, your Cash Prophet Balance, as your trusted financial position',
        ],
      },
      {
        type: 'p',
        text: 'It is financial management for owners who need day to day confidence between accountant visits, not a replacement for accounting software, professional advice or detailed cash flow forecasting.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'why-business-bank-balance-is-not-all-yours',
    title: 'Why Your Business Bank Balance Is Not All Yours',
    metaDescription:
      'Why a healthy UK business bank balance can still mislead you, and how committed funds change your real Cash Prophet Balance.',
    keywords: ['bank balance', 'committed funds', 'UK business', 'cash prophet balance'],
    publishedAt: '2026-07-08',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'Cash in the account is not the same as a trusted financial position. Here is what is often already spoken for.',
    relatedSlugs: ['what-is-the-true-balance-method', 'monthly-accruals-explained-small-business'],
    sections: [
      {
        type: 'p',
        text: 'Opening your banking app feels reassuring when the balance is healthy. The harder question is where the business really stands once obligations are counted.',
      },
      {
        type: 'h2',
        text: 'What the balance hides',
      },
      {
        type: 'ul',
        items: [
          'Payroll and PAYE building through the month',
          'VAT for the current quarter',
          'Corporation tax or self assessment set asides',
          'Planned purchases or renewals you have already committed to',
        ],
      },
      {
        type: 'h2',
        text: 'A clearer habit',
      },
      {
        type: 'p',
        text: 'Cash Prophet treats those items as part of your Cash Prophet Balance now, not only on payment day. That single shift helps owners trust the position they are looking at, instead of decisions that look fine on the bank app but are not.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'how-to-put-money-aside-vat-tax-irregular-bills',
    title: 'How to Put Money Aside for VAT, Tax and Irregular Bills',
    metaDescription:
      'A calm approach to setting money aside for VAT, corporation tax and irregular UK business bills, using Reserve Planner and steady habits.',
    keywords: ['VAT reserve', 'tax reserve', 'irregular bills', 'UK small business'],
    publishedAt: '2026-07-09',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'Lumpy bills are easier when you set money aside steadily. The Reserve Planner shows what should be held back.',
    relatedSlugs: [
      'virtual-reserves-vs-separate-savings-accounts',
      'monthly-accruals-explained-small-business',
    ],
    sections: [
      {
        type: 'p',
        text: 'VAT, corporation tax and annual costs do not feel irregular when you see them coming. The difficulty is holding back enough while still running the business day to day.',
      },
      {
        type: 'h2',
        text: 'Name each obligation',
      },
      {
        type: 'p',
        text: 'List the bills that catch people out: quarterly VAT, corporation tax, insurance, software renewals, equipment. Give each one a target in the Reserve Planner, rather than one vague tax pot.',
      },
      {
        type: 'h2',
        text: 'Build steadily',
      },
      {
        type: 'p',
        text: 'Cash Prophet suggests a monthly amount toward each reserve. You transfer what you choose into savings; the reserve tracks what ought to be set aside, whether or not the cash has moved yet.',
      },
      {
        type: 'p',
        text: 'Reserves improve discipline and visibility. They do not guarantee every bill is always covered, but they help you see shortfalls earlier.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'monthly-accruals-explained-small-business',
    title: 'Monthly Accruals Explained for Small Business Owners',
    metaDescription:
      'What monthly accruals mean in plain English for UK small businesses, and why they matter for your Cash Prophet Balance.',
    keywords: ['accruals', 'small business', 'payroll accrual', 'committed funds'],
    publishedAt: '2026-07-09',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'Accruals sound technical. For owners they simply mean costs building up before the money leaves.',
    relatedSlugs: ['why-business-bank-balance-is-not-all-yours', 'committed-funds-explained'],
    sections: [
      {
        type: 'p',
        text: 'Accrual is one of those words accountants use calmly while everyone else reaches for coffee. Day to day it means something simple: a cost is growing even though you have not paid it yet.',
      },
      {
        type: 'h2',
        text: 'Payroll is the everyday example',
      },
      {
        type: 'p',
        text: 'If you pay staff monthly, the obligation builds every day. On the 15th, roughly half a month of payroll is already committed, even though the bank balance has not moved.',
      },
      {
        type: 'h2',
        text: 'Why it belongs in your position',
      },
      {
        type: 'p',
        text: 'Cash Prophet includes that build up in your Cash Prophet Balance. Waiting until payment day to notice the cost is how owners get caught out.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'virtual-reserves-vs-separate-savings-accounts',
    title: 'Virtual Reserves Versus Separate Savings Accounts',
    metaDescription:
      'Reserve targets in Cash Prophet are planning figures, not money moved automatically. How they work alongside a real savings account.',
    keywords: ['virtual reserves', 'savings account', 'tax reserve', 'cash management'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'A reserve target tells you what should be set aside. A savings account is where you may choose to put it.',
    relatedSlugs: ['how-to-put-money-aside-vat-tax-irregular-bills', 'what-is-the-true-balance-method'],
    sections: [
      {
        type: 'p',
        text: 'Many owners use a separate account for tax and larger bills. That is sensible. The question is how you know how much should be in that account at any moment.',
      },
      {
        type: 'h2',
        text: 'What a reserve target is',
      },
      {
        type: 'p',
        text: 'In Cash Prophet, a reserve target is tracked in the Reserve Planner, for example VAT or corporation tax. It shows what ought to be held back from your Cash Prophet Balance. It does not move money on its own.',
      },
      {
        type: 'h2',
        text: 'Using both together',
      },
      {
        type: 'p',
        text: 'Owners often match reserve targets with real transfers monthly. The Reserve Planner answers "should I have set this aside?" The bank account answers "where is the cash now?"',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'five-minute-financial-routine-business-owners',
    title: 'A Five Minute Financial Routine for Business Owners',
    metaDescription:
      'A short, repeatable routine to keep your Cash Prophet Balance current: bank balances, paid items, and a monthly reserve check.',
    keywords: ['financial routine', 'small business', 'cash management', 'Cash Prophet'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'Little and often beats a monthly panic. A calm routine for keeping your Cash Prophet Balance honest.',
    relatedSlugs: ['what-is-the-true-balance-method', 'virtual-reserves-vs-separate-savings-accounts'],
    sections: [
      {
        type: 'p',
        text: 'Cash Prophet does not ask for hours of bookkeeping. It asks for small, regular updates so the Cash Prophet Balance stays trustworthy.',
      },
      {
        type: 'h2',
        text: 'Three habits',
      },
      {
        type: 'ul',
        items: [
          'Refresh bank balances when meaningful money moves',
          'Mark commitments as paid when they clear, so Due stays accurate',
          'Once a month, review Reserve Planner suggestions and transfer what you choose',
        ],
      },
      {
        type: 'p',
        text: 'Accruals between reviews are handled automatically in Cash Prophet, so five minutes a month is usually enough.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
  {
    slug: 'what-accounting-software-tells-you-and-what-it-does-not',
    title: 'What Accounting Software Tells You, and What It Does Not',
    metaDescription:
      'Xero and similar tools record what happened. Cash Prophet focuses on a trusted financial position for day to day confidence. They work together.',
    keywords: ['accounting software', 'Xero', 'cash prophet balance', 'Cash Prophet'],
    publishedAt: '2026-07-11',
    updatedAt: '2026-07-26',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 2,
    excerpt:
      'Accounting software is essential, but it is not designed to answer where your business really stands today.',
    relatedSlugs: ['what-is-the-true-balance-method', 'true-balance-vs-accounting-software'],
    sections: [
      {
        type: 'p',
        text: 'Accounting software does an important job: records, compliance, reports for your accountant. Most owners still need a separate answer for day to day financial confidence.',
      },
      {
        type: 'h2',
        text: 'What it is good at',
      },
      {
        type: 'ul',
        items: [
          'Recording invoices and bills',
          'Producing accounts and tax figures',
          'Giving your accountant what they need for filings',
        ],
      },
      {
        type: 'h2',
        text: 'What owners still ask separately',
      },
      {
        type: 'ul',
        items: [
          'After everything building up, what is my Cash Prophet Balance?',
          'Have we set enough aside for VAT and tax?',
          'Where does the business really stand before a hire, purchase or quiet month?',
        ],
      },
      {
        type: 'p',
        text: 'Cash Prophet sits alongside your accounts. It is not bookkeeping and not a replacement for detailed forecasting, it is a current trusted position for decisions, kept honest with small regular updates.',
      },
      { type: 'p', text: METHOD_CTA },
    ],
  },
]
