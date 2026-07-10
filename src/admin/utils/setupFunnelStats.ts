import {
  SETUP_ONBOARDING_STEP_LABELS,
  SETUP_ONBOARDING_STEPS,
} from '../../content/setupOnboarding'
import type { SetupFunnelSnapshot } from '../types'

const SETUP_FUNNEL_EVENTS = [
  'setup_started',
  'setup_step_view',
  'setup_step_dismiss',
  'onboarding_complete',
] as const

export function emptySetupFunnelSnapshot(): SetupFunnelSnapshot {
  return {
    usersStarted: 0,
    usersCompleted: 0,
    usersDismissed: 0,
    steps: SETUP_ONBOARDING_STEPS.map((step) => ({
      stepId: step.id,
      label: SETUP_ONBOARDING_STEP_LABELS[step.id] ?? step.title,
      usersReached: 0,
      pctOfStarted: 0,
      dropOffFromPrevious: 0,
    })),
    dismissByStep: [],
  }
}

export function buildSetupFunnelSnapshot(
  rows: Array<{ userId: string; eventType: string; metadata: Record<string, unknown> | null }>,
): SetupFunnelSnapshot {
  const started = new Set<string>()
  const completed = new Set<string>()
  const dismissed = new Set<string>()
  const stepUsers = new Map<string, Set<string>>()
  const dismissCounts = new Map<string, number>()

  for (const step of SETUP_ONBOARDING_STEPS) {
    stepUsers.set(step.id, new Set())
  }

  for (const row of rows) {
    const meta = row.metadata ?? {}
    switch (row.eventType) {
      case 'setup_started':
        started.add(row.userId)
        break
      case 'setup_step_view': {
        started.add(row.userId)
        const stepId = String(meta.stepId ?? '')
        if (stepId && stepUsers.has(stepId)) {
          stepUsers.get(stepId)!.add(row.userId)
        }
        break
      }
      case 'setup_step_dismiss':
        dismissed.add(row.userId)
        {
          const stepId = String(meta.stepId ?? 'unknown')
          dismissCounts.set(stepId, (dismissCounts.get(stepId) ?? 0) + 1)
        }
        break
      case 'onboarding_complete':
        completed.add(row.userId)
        started.add(row.userId)
        break
    }
  }

  const usersStarted = started.size
  const steps = SETUP_ONBOARDING_STEPS.map((step, index) => {
    const usersReached = stepUsers.get(step.id)?.size ?? 0
    const previousReached =
      index === 0 ? usersStarted : (stepUsers.get(SETUP_ONBOARDING_STEPS[index - 1]!.id)?.size ?? 0)
    return {
      stepId: step.id,
      label: SETUP_ONBOARDING_STEP_LABELS[step.id] ?? step.title,
      usersReached,
      pctOfStarted: usersStarted > 0 ? Math.round((usersReached / usersStarted) * 100) : 0,
      dropOffFromPrevious: Math.max(0, previousReached - usersReached),
    }
  })

  const dismissByStep = [...dismissCounts.entries()]
    .map(([stepId, count]) => ({
      stepId,
      label: SETUP_ONBOARDING_STEP_LABELS[stepId] ?? stepId,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    usersStarted,
    usersCompleted: completed.size,
    usersDismissed: dismissed.size,
    steps,
    dismissByStep,
  }
}

export { SETUP_FUNNEL_EVENTS }
