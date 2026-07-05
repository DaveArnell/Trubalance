import { getCurrencyLocale, getCurrencySymbol } from './format'

export function formatAxisCurrency(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  const symbol = getCurrencySymbol()
  const locale = getCurrencyLocale()
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}m`
  if (abs >= 10_000) return `${sign}${symbol}${Math.round(abs / 1000)}k`
  if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}k`
  return `${sign}${symbol}${Math.round(abs).toLocaleString(locale)}`
}

/** Y-axis domain that always includes zero so metrics are comparable when switching charts. */
export function computeZeroAnchoredDomain(
  minVal: number,
  maxVal: number,
  paddingRatio = 0.08,
): { yMin: number; yMax: number } {
  const span = maxVal - minVal
  const fallbackPad = Math.max(500, Math.abs(maxVal || minVal || 1) * 0.05)
  const padding = span > 0 ? span * paddingRatio : fallbackPad
  return {
    yMin: Math.min(0, minVal - padding),
    yMax: Math.max(0, maxVal + padding),
  }
}

/**
 * Y-axis for balance trend lines — only pin to zero when values are near or below it.
 * Avoids a huge empty band under the line when balances stay well above zero.
 */
export function computeTrendYDomain(
  minVal: number,
  maxVal: number,
  paddingRatio = 0.08,
): { yMin: number; yMax: number } {
  const span = Math.max(0, maxVal - minVal)
  const fallbackPad = Math.max(500, Math.abs(maxVal || minVal || 1) * 0.05)
  const padding = span > 0 ? span * paddingRatio : fallbackPad
  const nearZero = minVal < 0 || (maxVal > 0 && minVal <= maxVal * 0.25)

  if (!nearZero && minVal >= 0) {
    return {
      yMin: Math.max(0, minVal - padding),
      yMax: maxVal + padding,
    }
  }
  return computeZeroAnchoredDomain(minVal, maxVal, paddingRatio)
}

export function isChartZeroTick(tick: number): boolean {
  return Math.abs(tick) < 1e-6
}

export function computeNiceTicks(min: number, max: number, targetCount = 5): number[] {
  if (min === max) {
    const pad = Math.max(500, Math.abs(min) * 0.1)
    return [min - pad, min, min + pad]
  }

  const range = max - min
  const rawStep = range / Math.max(1, targetCount - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const niceStep =
    normalized <= 1 ? magnitude : normalized <= 2 ? 2 * magnitude : normalized <= 5 ? 5 * magnitude : 10 * magnitude

  const start = Math.floor(min / niceStep) * niceStep
  const ticks: number[] = []
  for (let v = start; v <= max + niceStep * 0.5; v += niceStep) {
    ticks.push(v)
  }
  return ticks
}

export function pickEvenlySpaced<T>(items: T[], maxCount: number): T[] {
  if (items.length <= maxCount) return items
  const result: T[] = []
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.round((i / (maxCount - 1)) * (items.length - 1))
    result.push(items[idx])
  }
  return result
}
