/** Visible FAQ copy — must match FAQPage JSON-LD on the same page (Google guideline). */

export type FaqItem = { q: string; a: string }

export const HOW_IT_WORKS_FAQS: FaqItem[] = [
  {
    q: 'What is Available Balance in Cash Prophet?',
    a: 'Available Balance is what cash is genuinely yours to use after known commitments and expected receipts — not just the figure in your bank app.',
  },
  {
    q: 'How do monthly costs build before payday?',
    a: 'Meaningful costs such as rent and wages grow a little every day until paid. Cash Prophet keeps that accrual in your position so payday is not a surprise.',
  },
  {
    q: 'What does the Reserve Planner do?',
    a: 'It turns large irregular bills — VAT, corporation tax, annual costs — into manageable monthly amounts so you set money aside steadily instead of scrambling when the bill arrives.',
  },
  {
    q: 'Is Cash Prophet accounting software?',
    a: 'No. It sits alongside tools like Xero or FreeAgent. Cash Prophet focuses on what you can safely spend next; bookkeeping records what already happened.',
  },
  {
    q: 'How much daily effort does it take?',
    a: 'A light routine: update bank balances when needed, mark payments paid, and review reserve targets monthly. Cash Prophet does the daily calculations around that rhythm.',
  },
]

export const PRICING_FAQS: FaqItem[] = [
  {
    q: 'How much does Cash Prophet cost?',
    a: 'Plans start at £5/month for Solo Business, £10/month for Multi-site Business, and £15/month for Multi-business / Group. Annual billing gives two months free.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. New accounts get three months free so you can set up your picture and decide which plan matches your structure.',
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
    a: 'Billing is not switched on yet. When it is, you will choose monthly or annual from Settings → Your plan, and invoices will be available there.',
  },
]

export const WHO_FOR_FAQS: FaqItem[] = [
  {
    q: 'Who is Cash Prophet for?',
    a: 'Owner-managed UK businesses that look at the bank balance and mentally subtract what is coming — especially if you want confidence without a finance team or complex forecasts.',
  },
  {
    q: 'Is Cash Prophet only for cafés or trades?',
    a: 'No. It suits any owner-managed business with regular commitments and larger irregular costs — hospitality, trades, leisure, multi-site and multi-company structures.',
  },
  {
    q: 'Who is Cash Prophet not for?',
    a: 'If you already have a finance department producing daily management information, have almost no commitments, or only need bookkeeping software, you may not need Cash Prophet.',
  },
]
