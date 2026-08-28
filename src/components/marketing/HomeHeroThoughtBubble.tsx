/** “In your head” finances — same canvas size as the hero dashboard for balance. */
export function HomeHeroThoughtBubble() {
  return (
    <div className="home-hero-thought-frame">
      <div
        className="home-hero-thought"
        aria-label="Bank balance £33,350 with bills and costs floating in a thought bubble, asking how much is actually left today"
      >
        <svg className="home-hero-thought-shape" viewBox="0 0 900 540" aria-hidden>
          <path
            className="home-hero-thought-cloud"
            d="M248 392c-88 0-158-68-158-156 0-78 62-142 148-156 24-92 108-154 212-154 98 0 182 56 210 140 86 10 152 74 152 158 0 88-70 168-168 168H248z"
          />
          <circle className="home-hero-thought-tail" cx="268" cy="418" r="24" />
          <circle className="home-hero-thought-tail" cx="242" cy="448" r="15" />
          <circle className="home-hero-thought-tail" cx="224" cy="468" r="9" />
        </svg>

        <div className="home-hero-thought-content">
          <p className="home-hero-thought-note home-hero-thought-note--rent">Rent £5,800 - 1st</p>
          <p className="home-hero-thought-note home-hero-thought-note--wages">Wages £9,000 - 28th</p>
          <p className="home-hero-thought-note home-hero-thought-note--utilities">Utilities £650? 20th?</p>
          <p className="home-hero-thought-note home-hero-thought-note--vat">VAT?</p>
          <p className="home-hero-thought-note home-hero-thought-note--insurance">Insurance £2,400 yearly</p>
          <p className="home-hero-thought-note home-hero-thought-note--other">Other bills? How much?</p>

          <div className="home-hero-thought-core">
            <span className="home-hero-thought-core-label">Bank balance</span>
            <strong className="home-hero-thought-core-amount">£33,350</strong>
          </div>

          <p className="home-hero-thought-question">So how much do I actually have today?</p>
        </div>
      </div>
    </div>
  )
}
