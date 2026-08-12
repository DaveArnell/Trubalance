import { COMPANY_INFO } from '../content/companyInfo'
import type { InquiryTopic } from '../content/contactPage'
import { isSupabaseConfigured, tryGetSupabase } from '../lib/supabase'

export type InquiryPayload = {
  name: string
  email: string
  businessName?: string
  phone?: string
  topic: InquiryTopic
  message: string
  /** Honeypot — must stay empty */
  companyWebsite?: string
}

export type InquiryResult = { ok: true } | { ok: false; error: string }

export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResult> {
  const supabase = tryGetSupabase()
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      error: `Cloud enquiry is not configured yet. Email ${COMPANY_INFO.contactEmail} instead.`,
    }
  }

  const { data, error } = await supabase.functions.invoke('submit-inquiry', {
    body: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      businessName: payload.businessName?.trim() || '',
      phone: payload.phone?.trim() || '',
      topic: payload.topic,
      message: payload.message.trim(),
      companyWebsite: payload.companyWebsite ?? '',
    },
  })

  if (error) {
    return {
      ok: false,
      error: error.message || `Could not send enquiry. Email ${COMPANY_INFO.contactEmail} instead.`,
    }
  }

  const body = data as { ok?: boolean; error?: string } | null
  if (!body?.ok) {
    return {
      ok: false,
      error: body?.error || `Could not send enquiry. Email ${COMPANY_INFO.contactEmail} instead.`,
    }
  }

  return { ok: true }
}
