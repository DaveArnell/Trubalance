import { useId, useState } from 'react'
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
  const reactId = useId()
  const baseId = id || reactId
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id={id} className="marketing-faq-section marketing-surface--paper" aria-labelledby={`${baseId}-heading`}>
      <div className="marketing-section-inner">
        <div className="marketing-section-head">
          <h2 id={`${baseId}-heading`}>{heading}</h2>
          {lead ? <p className="marketing-section-lead marketing-section-lead--home">{lead}</p> : null}
        </div>
        <div className="marketing-faq-list">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            const buttonId = `${baseId}-q-${index}`
            const panelId = `${baseId}-a-${index}`
            return (
              <div
                key={item.q}
                className={`marketing-faq-item${isOpen ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  id={buttonId}
                  className="marketing-faq-summary"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  {item.q}
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="marketing-faq-panel"
                >
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
