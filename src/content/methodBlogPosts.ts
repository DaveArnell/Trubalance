import type { BlogPost } from './blogTypes'
import { METHOD_BLOG_CATEGORY } from './trueBalanceMethod'

const METHOD_CTA =
  'True Balance automates the True Balance Method — keeping committed money, virtual reserves and your live position up to date without spreadsheet logic.'

/** Educational articles for the True Balance Method category. */
export const METHOD_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-the-true-balance-method',
    title: 'What Is the True Balance Method?',
    metaDescription:
      'The True Balance Method helps UK business owners manage money from what is genuinely available — not the bank balance alone. A plain-English introduction.',
    keywords: ['true balance method', 'available cash', 'UK small business', 'financial management'],
    publishedAt: '2026-07-08',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 6,
    excerpt:
      'A simple framework for seeing what your business can really afford — by accounting for committed money, reserves and realistic receipts.',
    relatedSlugs: [
      'why-business-bank-balance-is-not-all-yours',
      'what-accounting-software-tells-you-and-what-it-does-not',
    ],
    sections: [
      {
        type: 'p',
        text: 'The True Balance Method is a practical way to manage business money. It starts from a question most owners already ask quietly: how much of what is in the bank can I actually use?',
      },
      {
        type: 'h2',
        text: 'Not the bank balance alone',
      },
      {
        type: 'p',
        text: 'Your bank balance shows cash in the account. It does not show payroll building toward month end, VAT accruing, or a quarterly insurance bill you know is coming. The method brings those obligations into view before they become a surprise.',
      },
      {
        type: 'h2',
        text: 'The core idea',
      },
      {
        type: 'ul',
        items: [
          'Start from available cash in the bank.',
          'Subtract money already committed or building up.',
          'Add only realistic expected receipts.',
          'Use the result — your True Balance — for everyday decisions.',
        ],
      },
      {
        type: 'p',
        text: 'It is financial management for owners who make spending decisions between accountant visits — not a replacement for accounting software or professional advice.',
      },
      {
        type: 'h2',
        text: 'Software that keeps the method current',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'why-business-bank-balance-is-not-all-yours',
    title: 'Why Your Business Bank Balance Is Not All Yours',
    metaDescription:
      'Why a healthy UK business bank balance can still mislead you — and how committed money changes what is genuinely available to spend.',
    keywords: ['bank balance', 'committed funds', 'UK business', 'available cash'],
    publishedAt: '2026-07-08',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 5,
    excerpt:
      'Cash in the account is not the same as money you can safely use. Here is what is often already spoken for.',
    relatedSlugs: ['what-is-the-true-balance-method', 'monthly-accruals-explained-small-business'],
    sections: [
      {
        type: 'p',
        text: 'Opening your banking app feels reassuring when the balance is healthy. The harder question is how much of that figure is still yours once obligations are counted.',
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
          'Corporation tax or self-assessment set-asides',
          'Planned purchases or renewals you have already committed to mentally',
        ],
      },
      {
        type: 'h2',
        text: 'A clearer habit',
      },
      {
        type: 'p',
        text: 'The True Balance Method treats those items as part of your position now — not only on payment day. That single shift helps owners avoid decisions that look affordable on the bank app but are not.',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'how-to-put-money-aside-vat-tax-irregular-bills',
    title: 'How to Put Money Aside for VAT, Tax and Irregular Bills',
    metaDescription:
      'A calm approach to setting money aside for VAT, corporation tax and irregular UK business bills — using virtual reserves and steady habits.',
    keywords: ['VAT reserve', 'tax reserve', 'irregular bills', 'UK small business'],
    publishedAt: '2026-07-09',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 6,
    excerpt:
      'Lumpy bills are easier when you set money aside steadily. Virtual reserves help you see what should be held back.',
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
        text: 'List the bills that catch people out: quarterly VAT, corporation tax, insurance, software renewals, equipment. Give each one a target reserve rather than one vague tax pot.',
      },
      {
        type: 'h2',
        text: 'Build steadily',
      },
      {
        type: 'p',
        text: 'The True Balance Method suggests monthly amounts toward each reserve. You transfer what you choose into savings — the reserve tracks what ought to be set aside, whether or not you have moved the cash yet.',
      },
      {
        type: 'h2',
        text: 'No guarantee — better visibility',
      },
      {
        type: 'p',
        text: 'Reserves improve discipline and visibility. They do not guarantee every bill will always be covered; they help you see shortfalls earlier.',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'monthly-accruals-explained-small-business',
    title: 'Monthly Accruals Explained for Small Business Owners',
    metaDescription:
      'What monthly accruals mean in plain English for UK small businesses — and why they matter for your available cash position.',
    keywords: ['accruals', 'small business', 'payroll accrual', 'committed funds'],
    publishedAt: '2026-07-09',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 5,
    excerpt:
      'Accruals sound technical. For owners, they simply mean costs building up before the money leaves.',
    relatedSlugs: ['why-business-bank-balance-is-not-all-yours', 'committed-funds-explained'],
    sections: [
      {
        type: 'p',
        text: 'Accrual is one of those words accountants use calmly while everyone else reaches for coffee. For day-to-day management, it means something simple: a cost is growing even though you have not paid it yet.',
      },
      {
        type: 'h2',
        text: 'Payroll is the everyday example',
      },
      {
        type: 'p',
        text: 'If you pay staff monthly, the obligation builds every day. On the 15th, roughly half a month of payroll is already committed even though the balance has not moved.',
      },
      {
        type: 'h2',
        text: 'Why it belongs in your position',
      },
      {
        type: 'p',
        text: 'The True Balance Method includes that build-up in your available cash picture. Waiting until payment day to notice the cost is how owners get surprised.',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'virtual-reserves-vs-separate-savings-accounts',
    title: 'Virtual Reserves Versus Separate Savings Accounts',
    metaDescription:
      'Virtual reserves in True Balance are planning figures — not money moved automatically. How they work alongside a real savings account.',
    keywords: ['virtual reserves', 'savings account', 'tax reserve', 'cash management'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 5,
    excerpt:
      'A virtual reserve tells you what should be set aside. A savings account is where you may choose to put it.',
    relatedSlugs: ['how-to-put-money-aside-vat-tax-irregular-bills', 'what-is-the-true-balance-method'],
    sections: [
      {
        type: 'p',
        text: 'Many owners use a separate account for tax and larger bills. That is sensible. The question is how you know how much should be in that account at any moment.',
      },
      {
        type: 'h2',
        text: 'What a virtual reserve is',
      },
      {
        type: 'p',
        text: 'In the True Balance Method, a virtual reserve is a target tracked in software — for example VAT or corporation tax. It shows what ought to be held back from your operating cash. It does not move money on its own.',
      },
      {
        type: 'h2',
        text: 'What a savings transfer is',
      },
      {
        type: 'p',
        text: 'When you move cash to a savings account, that is a real bank transfer you initiate. True Balance can suggest amounts and track progress, but the physical movement is always your choice and your bank.',
      },
      {
        type: 'h2',
        text: 'Using both together',
      },
      {
        type: 'p',
        text: 'Owners often match virtual reserves with real transfers monthly. The reserve answers should I have set this aside? The account answers where is the cash now?',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'five-minute-financial-routine-business-owners',
    title: 'A Five-Minute Financial Routine for Business Owners',
    metaDescription:
      'A short, repeatable routine to keep your True Balance position current — bank balances, paid items, and a monthly reserve check.',
    keywords: ['financial routine', 'small business', 'cash management', 'True Balance Method'],
    publishedAt: '2026-07-10',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 4,
    excerpt:
      'Little and often beats a monthly panic. A calm routine for keeping your position honest.',
    relatedSlugs: ['what-is-the-true-balance-method', 'virtual-reserves-vs-separate-savings-accounts'],
    sections: [
      {
        type: 'p',
        text: 'The True Balance Method does not ask for hours of bookkeeping. It asks for small, regular updates so the position stays trustworthy.',
      },
      {
        type: 'h2',
        text: 'When balances change',
      },
      {
        type: 'p',
        text: 'Refresh bank balances when meaningful money moves — not necessarily every day, but often enough that the dashboard reflects reality.',
      },
      {
        type: 'h2',
        text: 'When payments leave',
      },
      {
        type: 'p',
        text: 'Mark commitments as paid when they clear. That keeps committed totals accurate for the next decision.',
      },
      {
        type: 'h2',
        text: 'Monthly reserve review',
      },
      {
        type: 'p',
        text: 'Once a month, review reserve suggestions and transfer what you choose into savings. Accruals between reviews are handled automatically in True Balance.',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
  {
    slug: 'what-accounting-software-tells-you-and-what-it-does-not',
    title: 'What Accounting Software Tells You — and What It Does Not',
    metaDescription:
      'Xero and similar tools record what happened. The True Balance Method focuses on what you can safely do next — they work together.',
    keywords: ['accounting software', 'Xero', 'cash position', 'True Balance Method'],
    publishedAt: '2026-07-11',
    updatedAt: '2026-07-12',
    category: METHOD_BLOG_CATEGORY,
    readMinutes: 6,
    excerpt:
      'Accounting software is essential — but it is not designed to answer what can I afford this week?',
    relatedSlugs: ['what-is-the-true-balance-method', 'true-balance-vs-accounting-software'],
    sections: [
      {
        type: 'p',
        text: 'Accounting software does an important job: records, compliance, reports for your accountant. Most owners still need a separate answer for daily spending confidence.',
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
          'After everything building up, what is genuinely available?',
          'Have we set enough aside for VAT and tax?',
          'Can we afford this hire, purchase or quiet month?',
        ],
      },
      {
        type: 'h2',
        text: 'Complement, not compete',
      },
      {
        type: 'p',
        text: 'The True Balance Method sits alongside your accounts. It is not bookkeeping and not forecasting — it is a current position for decisions, kept honest with small regular updates.',
      },
      {
        type: 'p',
        text: METHOD_CTA,
      },
    ],
  },
]
