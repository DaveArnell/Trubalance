import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { AiAnalysisResult, TransactionGroupForAi } from '../bankImport/analysisSchema'
import type { RecurringCandidateForAi } from '../bankImport/recurringCandidates'

export interface BankImportAiHealth {
  configured: boolean
  ok: boolean
  message: string
}

export interface AnalyzeBankImportRequest {
  /** Deterministic recurring payee candidates for the model to classify. */
  candidates?: RecurringCandidateForAi[]
  /** Optional compact ledger (legacy / debug). */
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

async function messageFromFunctionsError(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === 'object') {
    const payload = data as { error?: string; message?: string }
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
    }
  } catch {
    // Keep the generic Supabase message if the body cannot be read.
  }

  return fallback
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

export async function analyzeBankImportWithAi(
  request: AnalyzeBankImportRequest,
): Promise<AiAnalysisResult> {
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
