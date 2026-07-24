import type { FaqItem } from '../../content/marketingFaqs'

/** Visible FAQ block — must stay in sync with FAQPage JSON-LD on the same page. */
export function MarketingFaqSection({
  id = 'faq',
  heading = 'Frequently asked questions',
  lead,
  items,
}: {
  id?: string
  heading?: string
  lead?: string
  items: FaqItem[]
}) {
  return (
    <section id={id} className="marketing-faq-section marketing-surface--paper" aria-labelledby={`${id}-heading`}>
      <div className="marketing-section-inner">
        <div className="marketing-section-head">
          <p className="marketing-how-eyebrow">FAQ</p>
          <h2 id={`${id}-heading`}>{heading}</h2>
          {lead ? <p className="marketing-section-lead marketing-section-lead--home">{lead}</p> : null}
        </div>
        <div className="marketing-faq-list">
          {items.map((item) => (
            <details key={item.q} className="marketing-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
