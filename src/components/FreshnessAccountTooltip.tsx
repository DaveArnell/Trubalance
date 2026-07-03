import type { AccountFreshnessEntry } from '../utils/accountFreshness'

export function FreshnessAccountTooltip({
  accounts,
}: {
  accounts: Pick<AccountFreshnessEntry, 'label' | 'freshnessLabel'>[]
}) {
  if (accounts.length === 0) return null

  return (
    <span className="freshness-account-tooltip" role="tooltip">
      <ul className="freshness-account-tooltip-list">
        {accounts.map((account, index) => (
          <li key={`${account.label}-${index}`}>
            <span className="freshness-account-tooltip-name">{account.label}</span>
            <span className="freshness-account-tooltip-when">{account.freshnessLabel}</span>
          </li>
        ))}
      </ul>
    </span>
  )
}
