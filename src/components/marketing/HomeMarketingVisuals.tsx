import { SetupAccruingCycleDemo } from '../onboarding/SetupAccruingCycleDemo'

/**
 * Homepage visuals that match the copy’s feeling:
 * - Bank section = the unanswered questions after you check the balance
 * - Does section = known costs building (same animation as How it works)
 */

const MENTAL_QUESTIONS = [
  'Can I afford this?',
  'What’s already spoken for?',
  'Have I allowed for VAT?',
  'What about payroll next week?',
  'Is that insurance renewal covered?',
] as const

export function HomeSpokenForPanel() {
  return (
    <aside className="home-stage" aria-label="The questions behind a healthy bank balance">
      <div className="home-mind">
        <div className="home-mind-bank">
          <p className="home-mind-kicker">Banking app</p>
          <p className="home-mind-balance">£48,200</p>
          <p className="home-mind-status">Looks fine</p>
        </div>
        <p className="home-mind-bridge" aria-hidden>
          But before you put the phone down…
        </p>
        <ul className="home-mind-questions">
          {MENTAL_QUESTIONS.map((question, index) => (
            <li key={question} style={{ ['--q' as string]: index }}>
              {question}
            </li>
          ))}
        </ul>
        <p className="home-mind-foot">The balance never answers those. Your head does.</p>
      </div>
    </aside>
  )
}

export function HomeAvailablePanel() {
  return (
    <aside className="home-stage home-stage--demo" aria-label="Known costs building toward Available">
      <div className="home-accrue">
        <p className="home-accrue-kicker">What Cash Prophet is doing</p>
        <p className="home-accrue-title">Known costs building every day</p>
        <div className="home-accrue-stage">
          <SetupAccruingCycleDemo />
        </div>
        <p className="home-accrue-foot">
          Regular bills and reserves build into today’s Available Balance — so you don’t have to keep
          them in your head.
        </p>
      </div>
    </aside>
  )
}

export function HomeOutcomeBeats({
  beats,
  closing,
}: {
  beats: readonly string[]
  closing: string
}) {
  return (
    <div className="home-outcome">
      <div className="home-outcome-beats">
        {beats.map((beat, index) => (
          <article key={beat} className="home-outcome-beat">
            <p className="home-outcome-num" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </p>
            <p>{beat}</p>
          </article>
        ))}
      </div>
      <p className="home-outcome-close">{closing}</p>
    </div>
  )
}

export function HomeCompareStrip() {
  return (
    <div className="home-compare" aria-label="How Cash Prophet sits beside accounting and banking">
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Accounting</p>
        <p className="home-compare-body">Records the past</p>
      </div>
      <div className="home-compare-col home-compare-col--muted">
        <p className="home-compare-tag">Your bank</p>
        <p className="home-compare-body">Shows today’s cash</p>
      </div>
      <div className="home-compare-col home-compare-col--accent">
        <p className="home-compare-tag">Cash Prophet</p>
        <p className="home-compare-body">Helps you make today’s decisions</p>
        <p className="home-compare-highlight">Available Balance you can rely on</p>
      </div>
    </div>
  )
}
