const MIND_ITEMS = [
  'Rent £5,800 · 1st',
  'Wages £9,000 · 28th',
  'Utilities £650? · 20th',
  'VAT?',
  'Insurance £2,400 yearly',
  'Other bills?',
] as const

/** Finances “in your head” — compact panel for the hero stack (not a literal cloud blob). */
export function HomeHeroThoughtBubble() {
  return (
    <div
      className="home-hero-mind-panel"
      aria-label="Bank balance £33,350 with bills and costs you are keeping in your head, asking how much is actually left today"
    >
      <p className="home-hero-mind-kicker">In your head</p>
      <div className="home-hero-mind-balance">
        <span className="home-hero-mind-balance-label">Bank balance</span>
        <strong className="home-hero-mind-balance-amount">£33,350</strong>
      </div>
      <ul className="home-hero-mind-list">
        {MIND_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="home-hero-mind-question">So how much do I actually have today?</p>
    </div>
  )
}
