import { Link } from 'react-router-dom'
import { METHOD_PAGE_PATH, METHOD_WHY_COMPARE } from '../../content/trueBalanceMethod'
import { MethodEquation } from './MethodEquation'

const HOME_TOPICS = [
  {
    eyebrow: 'The method',
    title: 'The True Balance Method',
    body: 'A simple system for understanding what your bank balance is made up of — committed money, future bills, receipts, and what is left in the business.',
    to: METHOD_PAGE_PATH,
    cta: 'Read the Method',
  },
  {
    eyebrow: 'Routine',
    title: 'How it works',
    body: 'Set up once, then live a simple financial routine. Seven clear steps from connecting the business to the monthly Reserve Planner.',
    to: '/how-it-works',
    cta: 'See how it works',
  },
  {
    eyebrow: 'Habits',
    title: 'Daily and monthly habits',
    body: 'Light daily logging and a short monthly Reserve Planner review. The software does the maths — you keep the picture honest.',
    to: '/habits',
    cta: 'See the habits',
  },
  {
    eyebrow: 'Fit',
    title: 'Who it is for',
    body: 'For business owners who want clarity on what the bank balance is made up of — with or without bookkeeping software. Plus a “probably not for you” list.',
    to: '/who-its-for',
    cta: 'Check if it fits',
  },
  {
    eyebrow: 'Proof',
    title: 'Try a live demo',
    body: 'Open a fully set-up café, trades business or leisure group and see accruals, the Reserve Planner and True Balance in action.',
    to: '/see-how-it-works',
    cta: 'Try demo',
  },
  {
    eyebrow: 'Plans',
    title: 'Pricing',
    body: 'Simple plans for following the Method in software. Start free — no payment details required to begin.',
    to: '/pricing',
    cta: 'View pricing',
  },
] as const

/**
 * Homepage overview — short, separated topic cards that link to full pages.
 * Keeps the home story scannable instead of dumping every section inline.
 */
export function HomeTopicSections() {
  return (
    <>
      <section
        id="overview"
        className="marketing-home-overview"
        aria-labelledby="home-overview-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Explore</p>
            <h2 id="home-overview-heading">Learn the Method. Then choose your next step.</h2>
            <p className="marketing-section-lead">
              Everything below opens a focused page — so the homepage stays clear instead of blending
              into one long scroll.
            </p>
          </div>

          <div className="marketing-home-topic-grid">
            {HOME_TOPICS.map((topic) => (
              <article key={topic.to} className="marketing-home-topic-card">
                <p className="marketing-home-topic-eyebrow">{topic.eyebrow}</p>
                <h3>{topic.title}</h3>
                <p>{topic.body}</p>
                <Link to={topic.to} className="marketing-home-topic-link">
                  {topic.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="marketing-pillars-section marketing-pillars-section--pop marketing-method-section marketing-home-equation-band"
        aria-labelledby="home-equation-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">At a glance</p>
            <h2 id="home-equation-heading">What the Method separates</h2>
            <p className="marketing-section-lead">
              Bank balance, committed money, expected receipts — and the True Balance left after
              that.
            </p>
          </div>
          <div className="marketing-method-equation-wrap">
            <MethodEquation variant="home" />
          </div>
          <p className="marketing-method-more">
            <Link to={METHOD_PAGE_PATH}>Full explanation on the Method page →</Link>
          </p>
        </div>
      </section>

      <section
        className="marketing-features-section marketing-features-section--pop marketing-method-section"
        aria-labelledby="home-why-heading"
      >
        <div className="marketing-section-inner">
          <div className="marketing-section-head marketing-section-head--center">
            <p className="marketing-eyebrow marketing-eyebrow--vivid">Why it works</p>
            <h2 id="home-why-heading">A clearer approach than the bank app alone</h2>
          </div>
          <div className="marketing-method-compare">
            <article className="marketing-method-compare-card marketing-method-compare-card--muted">
              <h3>{METHOD_WHY_COMPARE.traditional.title}</h3>
              <ul>
                {METHOD_WHY_COMPARE.traditional.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
            <article className="marketing-method-compare-card marketing-method-compare-card--accent">
              <h3>{METHOD_WHY_COMPARE.method.title}</h3>
              <ul>
                {METHOD_WHY_COMPARE.method.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          </div>
          <p className="marketing-method-more">
            <Link to={METHOD_PAGE_PATH}>Go deeper on the Method page →</Link>
          </p>
        </div>
      </section>
    </>
  )
}
