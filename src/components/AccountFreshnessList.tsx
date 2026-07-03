import type { AppState, ViewScope } from '../types'
import {
  FRESHNESS_ENCOURAGEMENT,
  FRESHNESS_SECTION_HEADING,
} from '../content/livingDashboard'
import {
  getCurrentAccountFreshnessEntries,
  getWorstAccountFreshness,
  groupAccountFreshnessEntries,
} from '../utils/accountFreshness'
import { FreshnessAccountTooltip } from './FreshnessAccountTooltip'

interface AccountFreshnessListProps {
  state: AppState
  viewScope: ViewScope
}

export function AccountFreshnessList({ state, viewScope }: AccountFreshnessListProps) {
  const entries = getCurrentAccountFreshnessEntries(state, viewScope)
  const groups = groupAccountFreshnessEntries(entries)

  if (entries.length === 0) {
    return null
  }

  const worst = getWorstAccountFreshness(entries)

  return (
    <div className="overview-freshness">
      <p className="overview-freshness-heading">{FRESHNESS_SECTION_HEADING}</p>
      <ul className="overview-freshness-groups" aria-label="When bank balances were last updated">
        {groups.map((group) => {
          const groupEntries = entries.filter((entry) => entry.freshnessLabel === group.freshnessLabel)
          return (
            <li
              key={group.freshnessLabel}
              className={`overview-freshness-chip overview-freshness-chip--${group.freshness} freshness-hover-target`}
              tabIndex={0}
            >
              <span className={`overview-freshness-dot overview-freshness-dot--${group.freshness}`} aria-hidden />
              <span>
                {group.count} account{group.count === 1 ? '' : 's'} · {group.freshnessLabel}
              </span>
              <FreshnessAccountTooltip accounts={groupEntries} />
            </li>
          )
        })}
      </ul>
      <p className={`overview-freshness-hint overview-freshness-hint--${worst}`}>
        {FRESHNESS_ENCOURAGEMENT[worst]}
      </p>
    </div>
  )
}
