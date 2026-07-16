/**
 * Self-explaining How-it-works illustrations — product mockups with
 * handwritten callouts (RankFirst-style), for the homepage steps.
 */

function Scribble({
  x,
  y,
  children,
  className = '',
}: {
  x: number | string
  y: number | string
  children: string
  className?: string
}) {
  return (
    <text x={x} y={y} className={`method-illust-scribble ${className}`}>
      {children}
    </text>
  )
}

/** Step 01 — commitments building daily before payday */
export function IllustCommitmentsBuild() {
  return (
    <svg
      className="method-illust-svg"
      viewBox="0 0 320 200"
      role="img"
      aria-label="Payroll building day by day before payday"
    >
      <rect x="16" y="28" width="288" height="148" rx="14" className="method-illust-panel" />
      <text x="32" y="52" className="method-illust-ui-label">
        Monthly accruing
      </text>
      <text x="248" y="52" className="method-illust-ui-muted" textAnchor="end">
        Payroll
      </text>

      {/* Progress bar filling over the month */}
      <rect x="32" y="72" width="256" height="18" rx="9" className="method-illust-track" />
      <rect x="32" y="72" width="168" height="18" rx="9" className="method-illust-fill" />
      <text x="40" y="85" className="method-illust-ui-on-fill">
        Day 18 of 31
      </text>

      {/* Amount building */}
      <text x="32" y="120" className="method-illust-ui-muted">
        Accrued so far
      </text>
      <text x="32" y="148" className="method-illust-ui-amount">
        £2,840
      </text>
      <text x="248" y="148" className="method-illust-ui-muted" textAnchor="end">
        of £4,900
      </text>

      {/* Hand annotation */}
      <path
        d="M200 58 C 220 42, 250 38, 268 48"
        className="method-illust-arrow"
        fill="none"
      />
      <Scribble x={210} y={36}>
        building every day
      </Scribble>
    </svg>
  )
}

/** Step 02 — Reserve Planner turns annual bills into monthly transfers */
export function IllustReservePlanner() {
  return (
    <svg
      className="method-illust-svg"
      viewBox="0 0 320 200"
      role="img"
      aria-label="Annual VAT bill broken into a monthly reserve transfer"
    >
      <rect x="16" y="28" width="288" height="148" rx="14" className="method-illust-panel" />
      <text x="32" y="52" className="method-illust-ui-label">
        Reserve Planner
      </text>

      {/* Big annual bill → monthly */}
      <rect x="32" y="68" width="110" height="56" rx="10" className="method-illust-chip method-illust-chip--muted" />
      <text x="87" y="92" className="method-illust-ui-muted" textAnchor="middle">
        VAT due
      </text>
      <text x="87" y="112" className="method-illust-ui-amount-sm" textAnchor="middle">
        £9,600/yr
      </text>

      <path
        d="M152 96 L178 96"
        className="method-illust-arrow"
        markerEnd="url(#method-illust-arrowhead)"
      />
      <defs>
        <marker
          id="method-illust-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6" className="method-illust-arrow-head" fill="none" />
        </marker>
      </defs>

      <rect x="188" y="68" width="100" height="56" rx="10" className="method-illust-chip method-illust-chip--green" />
      <text x="238" y="92" className="method-illust-ui-on-green" textAnchor="middle">
        This month
      </text>
      <text x="238" y="112" className="method-illust-ui-amount-sm method-illust-ui-amount-sm--green" textAnchor="middle">
        £800
      </text>

      <text x="32" y="156" className="method-illust-ui-muted">
        Move into reserve →
      </text>
      <text x="248" y="156" className="method-illust-ui-amount-sm method-illust-ui-amount-sm--green" textAnchor="end">
        £800
      </text>

      <Scribble x={170} y={48} className="method-illust-scribble--right">
        one monthly transfer
      </Scribble>
    </svg>
  )
}

/** Step 03 — one True Balance number for today */
export function IllustTrueBalanceNumber() {
  return (
    <svg
      className="method-illust-svg"
      viewBox="0 0 320 200"
      role="img"
      aria-label="True Balance equation: cash minus committed plus receipts"
    >
      <rect x="16" y="28" width="288" height="148" rx="14" className="method-illust-panel" />
      <text x="32" y="52" className="method-illust-ui-label">
        True Balance
      </text>
      <text x="32" y="70" className="method-illust-ui-muted">
        What you can actually afford today
      </text>

      <text x="160" y="118" className="method-illust-hero-number" textAnchor="middle">
        £26,900
      </text>

      {/* Mini equation strip */}
      <text x="32" y="158" className="method-illust-eq">
        £42.5k
      </text>
      <text x="78" y="158" className="method-illust-eq-op">
        −
      </text>
      <text x="96" y="158" className="method-illust-eq">
        £20.3k
      </text>
      <text x="148" y="158" className="method-illust-eq-op">
        +
      </text>
      <text x="166" y="158" className="method-illust-eq">
        £4.7k
      </text>
      <text x="210" y="158" className="method-illust-eq-op">
        =
      </text>
      <text x="228" y="158" className="method-illust-eq method-illust-eq--green">
        £26.9k
      </text>

      <Scribble x={200} y={88}>
        one number
      </Scribble>
      <path d="M230 92 C 240 100, 245 108, 248 114" className="method-illust-arrow" fill="none" />
    </svg>
  )
}

export const METHOD_HOW_ILLUSTRATIONS = [
  IllustCommitmentsBuild,
  IllustReservePlanner,
  IllustTrueBalanceNumber,
] as const
