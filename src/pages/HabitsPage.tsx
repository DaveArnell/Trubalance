import { Link } from 'react-router-dom'
import {
  MarketingFooter,
  MarketingHeader,
  MarketingShell,
} from '../components/marketing/MarketingLayout'
import { METHOD_TWO_HABITS, METHOD_PAGE_PATH } from '../content/trueBalanceMethod'
import { HABITS_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function HabitsPage() {
  usePageMeta(HABITS_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="marketing-main">
        <section className="demo-scenarios-section demo-scenarios-section--landing">
          <div className="marketing-section-inner">
            <div className="marketing-section-head">
              <p className="marketing-how-eyebrow">The routine</p>
              <h1>Daily and monthly habits</h1>
              <p className="marketing-section-lead marketing-section-lead--home">
                The platform handles the calculations. You follow a light routine so you always know
                what’s already committed — and large bills stop catching you out.
              </p>
            </div>

            <div className="marketing-method-habits marketing-method-habits--page">
              {METHOD_TWO_HABITS.map((habit) => (
                <article key={habit.id} className="marketing-method-habit-card">
                  <p className="marketing-method-habit-meta">
                    <span className="marketing-method-habit-title">{habit.title}</span>
                    <span className="marketing-method-habit-time">{habit.time}</span>
                  </p>
                  <h2>{habit.lead}</h2>
                  <p>{habit.body}</p>
                  <ul className="marketing-method-habit-tasks">
                    {habit.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <p className="marketing-method-more">
              Want the full picture first? <Link to={METHOD_PAGE_PATH}>Read the Method</Link>
              {' · '}
              <Link to="/how-it-works">See how it works</Link>
            </p>

            <div className="demo-scenarios-footer">
              <Link to="/signup" className="btn-primary btn-large">
                Start free trial
              </Link>
              <Link to="/see-how-it-works" className="btn-secondary btn-large">
                Try a live demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
