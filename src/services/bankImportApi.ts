import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { AiAnalysisResult, TransactionGroupForAi } from '../bankImport/analysisSchema'

export interface BankImportAiHealth {
  configured: boolean
  ok: boolean
  message: string
}

export interface AnalyzeBankImportRequest {
  groups: TransactionGroupForAi[]
  analysisPeriod: { start_date: string; end_date: string; months_covered: number }
  scopeLevel: string
  scopeId: string
  fileName?: string
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
      return { configured: false, ok: false, message: error.message }
    }
    const result = data as BankImportAiHealth
    return result
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
    throw new Error(error.message || 'AI analysis failed.')
  }

  const payload = data as { error?: string; analysis?: AiAnalysisResult }
  if (payload.error) throw new Error(payload.error)
  if (!payload.analysis) throw new Error('AI analysis returned no results.')

  return payload.analysis
}
