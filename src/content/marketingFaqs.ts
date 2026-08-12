/** Visible FAQ copy — must match FAQPage JSON-LD on the same page (Google guideline). */

import { CASH_PROPHET_BALANCE } from './brandFoundation'

export type FaqItem = { q: string; a: string }

export const HOW_IT_WORKS_FAQS: FaqItem[] = [
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is Cash Prophet's calculation of your business's financial position. Unlike a bank balance, it already reflects accrued meaningful financial commitments — so you can see where your business really stands.`,
  },
  {
    q: 'How do monthly costs build before payday?',
    a: 'Meaningful costs such as rent and wages grow a little every day until paid. Cash Prophet keeps that accrual in your position so payday is not a surprise.',
  },
  {
    q: 'What does the Reserve Planner do?',
    a: 'It helps you continuously save towards predictable future costs — VAT, corporation tax, annual bills — without multiple bank accounts or manual jam-jar budgeting. Reserve Planner is valuable whatever your income pattern.',
  },
  {
    q: 'Is Cash Prophet accounting software?',
    a: 'No. It sits alongside tools like Xero or FreeAgent. Cash Prophet is not bookkeeping and not a replacement for accountants or detailed cash flow forecasting. It complements accounting with a continuously updated financial position you can understand every day.',
  },
  {
    q: 'How much daily effort does it take?',
    a: 'A light routine: update bank balances when needed, mark payments paid, and review reserve targets monthly. Cash Prophet does the daily calculations around that rhythm.',
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
    a: 'Yes — free while we are growing. Request a 30–60 minute setup session from the Enquire page. We arrange a time by email (no booking calendar). You can also start the free trial on your own anytime.',
  },
]

export const WHO_FOR_FAQS: FaqItem[] = [
  {
    q: 'Who is Cash Prophet for?',
    a: `Owners who check the bank and still cannot tell what is safe to spend. If wages, VAT and bills keep catching you out, and you want one trusted daily number, Cash Prophet is built for that.`,
  },
  {
    q: 'Does my business type matter?',
    a: 'Less than the problem you have. It works best when income is fairly steady week to week or month to month, so a daily position stays meaningful. That includes many leisure, hospitality, childcare, subscription and service businesses, but the fit is the problem, not the sector label.',
  },
  {
    q: 'Who is Cash Prophet Balance less suitable for?',
    a: 'Businesses with highly irregular, project-based or occasional large-contract income often need detailed cash flow forecasting first, because income timing is itself a major risk. Reserve Planner can still help those businesses save for predictable costs, but Cash Prophet Balance should not replace proper forecasting there.',
  },
]
