import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { AiAnalysisResult, TransactionGroupForAi } from '../bankImport/analysisSchema'
import type { RecurringCandidateForAi } from '../bankImport/recurringCandidates'

export interface BankImportAiHealth {
  configured: boolean
  ok: boolean
  message: string
}

export interface AnalyzeBankImportRequest {
  /** Deterministic recurring payee evidence (days/amounts/months) — AI still classifies. */
  candidates?: RecurringCandidateForAi[]
  /** Compact CSV of payee evidence (preferred over raw candidates JSON). */
  payeeEvidence?: string
  /** Compact money-out ledger for context. */
  ledger?: string
  /** Legacy fallback only. */
  groups?: TransactionGroupForAi[]
  analysisPeriod: { start_date: string; end_date: string; months_covered: number }
  scopeLevel: string
  scopeId: string
  /** Business id used for one-pass server entitlement. */
  businessId: string
  fileName?: string
  minMonthlyAmount?: number
}

export interface AnalyzeBankImportOptions {
  /** Called while we quietly wait out OpenAI rate limits — keep the user on the loading screen. */
  onStatus?: (message: string) => void
}

async function messageFromFunctionsError(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === 'object') {
    const payload = data as { error?: string; message?: string; code?: string }
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
  }

  if (!error || typeof error !== 'object') {
    return 'AI analysis failed.'
  }

  const err = error as { message?: string; context?: Response }
  const fallback = err.message || 'AI analysis failed.'

  try {
    const context = err.context
    if (context && typeof context.json === 'function') {
      const body = (await context.json()) as { error?: string; message?: string; code?: string }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
      if (typeof body.message === 'string' && body.message.trim()) return body.message
      if (body.code === 'OPENAI_ERROR') return body.error || fallback
    }
  } catch {
    // Keep the generic Supabase message if the body cannot be read.
  }

  return fallback
}

function isTransientAiCapacityError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('rate-limit') ||
    lower.includes('rate limiting') ||
    lower.includes('tokens per minute') ||
    lower.includes('temporarily limiting') ||
    lower.includes('busy') ||
    lower.includes('429') ||
    lower.includes('try again') ||
    lower.includes('wait 1') ||
    lower.includes('wait about a minute')
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkBankImportAiHealth(): Promise<BankImportAiHealth> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      ok: false,
      message: 'Sign in with a cloud account to use AI statement analysis.',
    }
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.functions.invoke('bank-import-ai-health', { body: {} })
    if (error) {
      return {
        configured: false,
        ok: false,
        message: await messageFromFunctionsError(error, data),
      }
    }
    return data as BankImportAiHealth
  } catch (err) {
    return {
      configured: false,
      ok: false,
      message: err instanceof Error ? err.message : 'Could not reach analysis service.',
    }
  }
}

async function invokeAnalyzeOnce(request: AnalyzeBankImportRequest): Promise<AiAnalysisResult> {
  const supabase = getSupabase()
  const { data, error } = await supabase.functions.invoke('bank-import-analyze', {
    body: request,
  })

  if (error) {
    throw new Error(await messageFromFunctionsError(error, data))
  }

  const payload = data as { error?: string; analysis?: AiAnalysisResult }
  if (payload.error) throw new Error(payload.error)
  if (!payload.analysis) throw new Error('AI analysis returned no results.')

  return payload.analysis
}

/**
 * Runs statement analysis. On a brief OpenAI rate-limit, waits once (~1 min) and
 * retries once — no long 20/40/60 multi-wait loop that feels abandoned.
 */
export async function analyzeBankImportWithAi(
  request: AnalyzeBankImportRequest,
  options?: AnalyzeBankImportOptions,
): Promise<AiAnalysisResult> {
  options?.onStatus?.('Reading your statement and preparing the draft…')

  try {
    return await invokeAnalyzeOnce(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI analysis failed.'
    if (!isTransientAiCapacityError(message)) {
      throw err instanceof Error ? err : new Error(message)
    }

    options?.onStatus?.(
      'Still working — finishing the draft now (this usually takes under a minute)…',
    )
    await sleep(55_000)
    options?.onStatus?.('Reading your statement and preparing the draft…')
    return await invokeAnalyzeOnce(request)
  }
}
