/** Session flags for the interactive demo product tour (not the normal-user tour). */

const keyFor = (scenarioId: string) => `trubalance-demo-product-tour-seen:${scenarioId}`

export function wasDemoProductTourSeen(scenarioId: string): boolean {
  try {
    return sessionStorage.getItem(keyFor(scenarioId)) === '1'
  } catch {
    return false
  }
}

export function markDemoProductTourSeen(scenarioId: string): void {
  try {
    sessionStorage.setItem(keyFor(scenarioId), '1')
  } catch {
    /* ignore */
  }
}
