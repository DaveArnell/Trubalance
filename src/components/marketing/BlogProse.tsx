import type { BlogSection } from '../../content/blogTypes'

export function BlogProse({ sections }: { sections: BlogSection[] }) {
  return (
    <div className="blog-prose legal-prose">
      {sections.map((section, index) => {
        if (section.type === 'p') {
          return <p key={index}>{section.text}</p>
        }
        if (section.type === 'h2') {
          return <h2 key={index}>{section.text}</h2>
        }
        if (section.type === 'h3') {
          return <h3 key={index}>{section.text}</h3>
        }
        if (section.type === 'ul') {
          return (
            <ul key={index}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }
        if (section.type === 'faq') {
          return (
            <div key={index} className="blog-faq">
              <h2>{section.heading ?? 'Frequently asked questions'}</h2>
              {section.items.map((item) => (
                <div key={item.q} className="blog-faq-item">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
