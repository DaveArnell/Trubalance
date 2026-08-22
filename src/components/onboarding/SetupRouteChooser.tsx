import type { GuidedSetupPath } from '../../content/guidedSetup'
import { GUIDED_SETUP_PATH_OPTIONS } from '../../content/guidedSetup'

interface SetupRouteChooserProps {
  onChoose: (path: GuidedSetupPath) => void
}

/** Upload statement vs enter manually — shown right after structure. */
export function SetupRouteChooser({ onChoose }: SetupRouteChooserProps) {
  return (
    <div className="setup-route-chooser" role="group" aria-label="How do you want to add your bills?">
      <p className="setup-route-chooser-lead">
        Choose how to add monthly costs and reserve bills. You can edit everything afterwards.
      </p>
      <div className="setup-route-chooser-grid">
        {GUIDED_SETUP_PATH_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`setup-route-card setup-route-card--${option.id}`}
            onClick={() => onChoose(option.id)}
          >
            <span className="setup-route-card-badge">{option.badge}</span>
            <strong className="setup-route-card-title">{option.title}</strong>
            <span className="setup-route-card-subtitle">{option.subtitle}</span>
            <span className="setup-route-card-lead">{option.lead}</span>
            <ul className="setup-route-card-highlights">
              {option.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className="setup-route-card-time">{option.timeEstimate}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
