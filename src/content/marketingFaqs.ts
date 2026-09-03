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

export const CAFE_SECTOR_FAQS: FaqItem[] = [
  {
    q: 'Is Cash Prophet financial management software for cafés?',
    a: 'Yes. Cash Prophet is financial management software for independent cafés and similar owner-managed businesses. It organises bills coming up, money to put aside and your Cash Prophet Balance so you can see where the café stands without replacing your accounting software.',
  },
  {
    q: 'Is this the same as café cash flow forecasting?',
    a: 'No. Cash Prophet is not detailed cash-flow forecasting. It continuously accounts for regular commitments and planned larger costs so you have a clearer day-to-day picture than the bank balance alone. Businesses with highly irregular income may still need forecasting alongside it.',
  },
  {
    q: 'Does it replace my accountant or bookkeeping?',
    a: 'No. Your accounting software keeps the records and your accountant helps with accounts, tax and advice. Cash Prophet sits alongside them as a financial organiser for the questions you want to answer yourself.',
  },
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is a benchmark for the underlying financial position of the business. It combines your bank balance with regular costs already building, planned reserves and any realistic expected receipts.`,
  },
  {
    q: 'How does the Reserve Planner help with café VAT?',
    a: 'The Reserve Planner turns larger or irregular costs such as VAT, insurance and renewals into a manageable monthly reserve amount, so those costs become predictable and funded before they land.',
  },
  {
    q: 'How much ongoing effort does it take?',
    a: 'Once set up, a quick check-in is usually enough: update balances, tick off what has been paid, add anything new and see your current position. For a straightforward café it can take just a few minutes.',
  },
]

export const PUB_SECTOR_FAQS: FaqItem[] = [
  {
    q: 'Is Cash Prophet financial management software for pubs and bars?',
    a: 'Yes. Cash Prophet is financial management software for independent pubs and bars. It organises wages, rent, stock-related costs, VAT and your Cash Prophet Balance so you can see where the pub stands without relying on the bank balance alone.',
  },
  {
    q: 'Is this the same as pub cash flow software?',
    a: 'People often search for pub cash flow when they mean a clearer day-to-day picture. Cash Prophet is not detailed cash-flow forecasting. It accounts for commitments building and reserves planned so the bank balance is not the only number you rely on.',
  },
  {
    q: 'Does it replace my accountant or bookkeeping?',
    a: 'No. Accounting keeps the records; your accountant helps with tax and advice. Cash Prophet sits alongside them as a financial organiser for owner day-to-day decisions.',
  },
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is a benchmark for the underlying financial position of the business. It combines your bank balance with regular costs already building, planned reserves and any realistic expected receipts.`,
  },
  {
    q: 'How does the Reserve Planner help with pub VAT and rent?',
    a: 'It turns larger costs such as VAT, rent and insurance into a clear monthly set-aside and shows the planned reserve balance after each due date, so those bills are less of a surprise.',
  },
  {
    q: 'How much ongoing effort does it take?',
    a: 'Once set up, a quick check-in is usually enough: update balances, tick off what has been paid, add anything new and see your current position. For a straightforward pub it can take just a few minutes.',
  },
]

export const RESTAURANT_SECTOR_FAQS: FaqItem[] = [
  {
    q: 'Is Cash Prophet financial management software for restaurants?',
    a: 'Yes. Cash Prophet is financial management software for independent restaurants. It organises kitchen and front-of-house wages, rent, suppliers, VAT and your Cash Prophet Balance so you can see where the restaurant stands without relying on the bank balance alone.',
  },
  {
    q: 'Is this restaurant cash flow forecasting?',
    a: 'No. Cash Prophet is not detailed cash-flow forecasting. It continuously accounts for regular commitments and planned larger costs so you have a clearer day-to-day picture than the bank balance alone.',
  },
  {
    q: 'Does it replace my accountant or bookkeeping?',
    a: 'No. Your accounting software keeps the records and your accountant helps with accounts, tax and advice. Cash Prophet sits alongside them as a financial organiser for the questions you want to answer yourself.',
  },
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is a benchmark for the underlying financial position of the business. It combines your bank balance with regular costs already building, planned reserves and any realistic expected receipts.`,
  },
  {
    q: 'How does the Reserve Planner help with restaurant VAT?',
    a: 'The Reserve Planner turns larger or irregular costs such as VAT, insurance and renewals into a manageable monthly reserve amount, so those costs become predictable and funded before they land.',
  },
  {
    q: 'How much ongoing effort does it take?',
    a: 'Once set up, a quick check-in is usually enough: update balances, tick off what has been paid, add anything new and see your current position. For a straightforward restaurant it can take just a few minutes.',
  },
]

export const SOFT_PLAY_SECTOR_FAQS: FaqItem[] = [
  {
    q: 'Is Cash Prophet financial management software for soft play centres?',
    a: 'Yes. Cash Prophet is financial management software for soft play and similar leisure venues. It organises staffing costs, rent, insurance, VAT and your Cash Prophet Balance so you can see where the venue stands without relying on the bank balance alone.',
  },
  {
    q: 'Is this cash flow forecasting for leisure venues?',
    a: 'No. Cash Prophet is not detailed cash-flow forecasting. It accounts for commitments building and reserves planned so you have a clearer day-to-day picture than the bank balance alone. Highly irregular project businesses may still need forecasting alongside it.',
  },
  {
    q: 'Does it replace my accountant or bookkeeping?',
    a: 'No. Accounting keeps the records; your accountant helps with tax and advice. Cash Prophet sits alongside them as a financial organiser for owner day-to-day decisions.',
  },
  {
    q: `What is the ${CASH_PROPHET_BALANCE}?`,
    a: `The ${CASH_PROPHET_BALANCE} is a benchmark for the underlying financial position of the business. It combines your bank balance with regular costs already building, planned reserves and any realistic expected receipts.`,
  },
  {
    q: 'How does the Reserve Planner help with soft play insurance and VAT?',
    a: 'It turns larger costs such as VAT, rent and insurance into a clear monthly set-aside and shows the planned reserve balance after each due date, so those bills are less of a surprise.',
  },
  {
    q: 'How much ongoing effort does it take?',
    a: 'Once set up, a quick check-in is usually enough: update balances, tick off what has been paid, add anything new and see your current position. For a straightforward venue it can take just a few minutes.',
  },
]
