/** Visible FAQ copy — must match FAQPage JSON-LD on the same page (Google guideline). */

import { CASH_PROPHET_BALANCE } from './brandFoundation'

export type FaqItem = { q: string; a: string }

export const HOW_IT_WORKS_FAQS: FaqItem[] = [
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is a benchmark for the underlying financial position of the business. It combines your bank balance with regular costs already building, planned reserves and any realistic expected receipts.`,
  },
  {
    q: 'How do regular costs build before payday?',
    a: 'Rent, wages, utilities and similar costs build through their payment cycle. Cash Prophet reflects the amount already built up in your financial picture, rather than waiting until payday.',
  },
  {
    q: 'What does the Reserve Planner do?',
    a: 'It turns larger or irregular costs such as VAT, corporation tax and insurance into a manageable monthly reserve amount, so those costs become predictable and funded.',
  },
  {
    q: 'Is Cash Prophet accounting software?',
    a: 'No. It is a financial organiser that sits alongside your bookkeeping and accountant. It does not replace accounting software, bookkeeping or professional advice.',
  },
  {
    q: 'How much ongoing effort does it take?',
    a: 'Once set up, a quick check-in is usually enough: update balances, tick off what has been paid, add anything new and see your current position. For a straightforward business it can take just a few minutes.',
  },
  {
    q: 'Do I have to use it every day?',
    a: 'No. Check in daily, every few days or weekly depending on how closely you want to follow the business. Review the Reserve Planner periodically as well.',
  },
]

export const PRICING_FAQS: FaqItem[] = [
  {
    q: 'How much does Cash Prophet cost?',
    a: 'Plans start at £24/month + VAT for Solo Business, £34/month + VAT for Multi-site Business, and £44/month + VAT for Multi-business / Group. Annual billing gives two months free.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. New accounts get 30 days free so you can set up your picture and decide which plan matches your structure.',
  },
  {
    q: 'Which plan should I choose?',
    a: 'Solo is for one business without venues. Multi-site is one business with multiple venues. Multi-business / Group is for owners running more than one company in one workspace. Start free and we recommend a plan after your trial based on what you built.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Monthly plans are rolling contracts you can cancel anytime. Annual plans are paid upfront for the year.',
  },
  {
    q: 'Are payments live yet?',
    a: 'Yes. Start with a free trial — no card required. When you are ready, choose monthly or annual from Settings → Your plan. Your card is charged when the trial ends, not before.',
  },
  {
    q: 'Do you offer personal onboarding?',
    a: 'Yes. You can book a free 30 to 60 minute personal onboarding session from the Enquire page. We help you get balances, commitments and reserves in place, and you have a real person to ask when something is unclear. You can also start the free trial on your own anytime.',
  },
]

export const CAFES_FAQS: FaqItem[] = [
  {
    q: 'Is Cash Prophet accounting software for cafés?',
    a: 'No. It is a lightweight budgeting and financial awareness tool for the owner. It sits alongside your accountant or bookkeeper. It is not bookkeeping, not a replacement for an accountant, and not conventional cash flow forecasting.',
  },
  {
    q: 'How is this different from looking at the bank?',
    a: 'The bank shows what is in the account. It does not show wages, rent and other regular costs that have already built up. Cash Prophet accounts for those as they progress through their payment cycles, and gives you one Cash Prophet Balance to follow.',
  },
  {
    q: 'Do I need to be good with numbers?',
    a: 'No. Once regular costs are in, Cash Prophet quietly keeps the picture updated. You do not need accounting knowledge, and it is not another finance system to learn.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. New accounts get 30 days free, with no card needed to start. You can also try the free Snapshot with your café figures without creating an account. Free personal onboarding is available if you want a guided start.',
  },
]

export const WHO_FOR_FAQS: FaqItem[] = [
  {
    q: 'Who is Cash Prophet for?',
    a: 'Cash Prophet is designed for owner-managed businesses where the owner is still closely involved in the day-to-day finances. We are initially focusing on independent hospitality and leisure businesses, but the underlying approach can suit other businesses with regular commitments and larger costs to prepare for.',
  },
  {
    q: 'Do I need to be in hospitality or leisure?',
    a: 'No. That is where we are initially focusing because Cash Prophet was shaped around the realities of running these kinds of businesses. The important thing is whether the financial problems it organises are familiar to you.',
  },
  {
    q: 'Is Cash Prophet accounting software?',
    a: 'No. Your accounting software keeps the financial records of the business and your accountant helps with accounts, tax and professional advice. Cash Prophet sits alongside them and helps you keep the day-to-day financial picture organised.',
  },
  {
    q: 'What if my income is very irregular?',
    a: 'Cash Prophet is not designed to replace detailed cash-flow forecasting. If your business depends heavily on irregular projects or occasional large contracts, forecasting may need to play a bigger role. Cash Prophet may still be useful for organising regular commitments and planned larger costs.',
  },
  {
    q: 'Do I need a finance background?',
    a: 'No. Cash Prophet is deliberately designed around the questions a business owner wants answered rather than accounting terminology or management reports.',
  },
]
