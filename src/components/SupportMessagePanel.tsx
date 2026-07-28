import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tryGetSupabase } from '../lib/supabase'
import { COMPANY_INFO } from '../content/companyInfo'

interface SupportMessagePanelProps {
  embedded?: boolean
}

export function SupportMessagePanel({ embedded = false }: SupportMessagePanelProps) {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSent(false)

    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    if (!trimmedSubject || !trimmedBody) {
      setError('Please add a subject and a message.')
      return
    }
    if (!user?.id) {
      setError('You need to be signed in to send a message.')
      return
    }

    const supabase = tryGetSupabase()
    if (!supabase) {
      setError(`Cloud support needs Supabase. Email us at ${COMPANY_INFO.contactEmail}.`)
      return
    }

    setSending(true)
    const meta = user.user_metadata as { full_name?: string } | undefined
    const { error: insertError } = await supabase.from('support_messages').insert({
      user_id: user.id,
      user_email: user.email ?? COMPANY_INFO.contactEmail,
      user_name: meta?.full_name ?? user.email ?? 'Cash Prophet user',
      subject: trimmedSubject.slice(0, 200),
      body: trimmedBody.slice(0, 8000),
      status: 'open',
      priority: 'normal',
    })
    setSending(false)

    if (insertError) {
      setError(
        insertError.message.includes('relation') || insertError.code === '42P01'
          ? `Support inbox is not set up yet. Email us at ${COMPANY_INFO.contactEmail}.`
          : insertError.message,
      )
      return
    }

    setSubject('')
    setBody('')
    setSent(true)
  }

  const form = (
    <form className="support-message-form" onSubmit={(e) => void handleSubmit(e)}>
      <p className="support-message-lead">
        Send a message to the Cash Prophet team. We read these in the admin inbox and reply by email
        to your account address — there isn’t an in-app reply thread yet.
      </p>

      <label className="support-message-field">
        <span>Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="What do you need help with?"
          disabled={sending}
          required
        />
      </label>

      <label className="support-message-field">
        <span>Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={8000}
          placeholder="Include enough detail for us to help: what you were trying to do, and what went wrong."
          disabled={sending}
          required
        />
      </label>

      {error && (
        <p className="setup-onboarding-form-error" role="alert">
          {error}
        </p>
      )}
      {sent && (
        <p className="support-message-success" role="status">
          Message sent. We will reply to {user?.email ?? 'your account email'}.
        </p>
      )}

      <div className="support-message-actions">
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send message'}
        </button>
        <a className="btn-ghost" href={`mailto:${COMPANY_INFO.contactEmail}`}>
          Or email {COMPANY_INFO.contactEmail}
        </a>
      </div>
    </form>
  )

  if (embedded) return form

  return <section className="card support-message-card">{form}</section>
}
