import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { COMPANY_REFERENCE_PRESETS, BUSINESS_HUB_HELP } from '../content/businessHub'
import { HelpButton } from './HelpButton'
import { FeatureGate } from './FeatureGate'
import {
  businessName,
  countReferenceValues,
  getProfileForBusiness,
  resolvePrimaryBusinessId,
} from '../utils/businessHub'
import { getBusinessIdsForScope } from '../utils/scope'

interface CompanyReferenceVaultPanelProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<AppActions, 'upsertReferenceField' | 'removeReferenceField' | 'setReferenceNotes'>
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

export function CompanyReferenceVaultPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: CompanyReferenceVaultPanelProps) {
  const businessIds = useMemo(() => getBusinessIdsForScope(state, viewScope), [state, viewScope])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const activeBusinessId = selectedBusinessId ?? resolvePrimaryBusinessId(state, viewScope)
  const profile = activeBusinessId ? getProfileForBusiness(state, activeBusinessId) : undefined
  const savedCount = countReferenceValues(state)

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [fieldDraft, setFieldDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState<string | null>(null)
  const [notesDirty, setNotesDirty] = useState(false)
  const fieldInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditingFieldId(null)
    setFieldDraft('')
    setNotesDraft(null)
    setNotesDirty(false)
  }, [activeBusinessId])

  useEffect(() => {
    if (editingFieldId && fieldInputRef.current) {
      fieldInputRef.current.focus()
      fieldInputRef.current.select()
    }
  }, [editingFieldId])

  const usedPresetIds = new Set(profile?.fields.map((f) => f.presetId) ?? [])
  const availablePresets = COMPANY_REFERENCE_PRESETS.filter((p) => !usedPresetIds.has(p.id))

  const startEditField = (fieldId: string, currentValue: string) => {
    setEditingFieldId(fieldId)
    setFieldDraft(currentValue)
  }

  const saveField = (fieldId: string) => {
    if (!activeBusinessId) return
    const field = profile?.fields.find((f) => f.id === fieldId)
    if (!field) return
    actions.upsertReferenceField(activeBusinessId, {
      id: field.id,
      presetId: field.presetId,
      label: field.label,
      value: fieldDraft.trim(),
    })
    setEditingFieldId(null)
    setFieldDraft('')
  }

  const cancelFieldEdit = () => {
    setEditingFieldId(null)
    setFieldDraft('')
  }

  const addPreset = (presetId: string) => {
    if (!activeBusinessId) return
    const preset = COMPANY_REFERENCE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const newId = `ref-${Date.now()}`
    actions.upsertReferenceField(activeBusinessId, {
      id: newId,
      presetId: preset.id,
      label: preset.label,
      value: '',
    })
    setEditingFieldId(newId)
    setFieldDraft('')
  }

  const addCustomField = () => {
    if (!activeBusinessId) return
    const newId = `ref-${Date.now()}`
    actions.upsertReferenceField(activeBusinessId, {
      id: newId,
      presetId: 'custom',
      label: 'Custom reference',
      value: '',
    })
    setEditingFieldId(newId)
    setFieldDraft('')
  }

  const notesValue = notesDraft ?? profile?.notes ?? ''

  const saveNotes = () => {
    if (!activeBusinessId) return
    actions.setReferenceNotes(activeBusinessId, notesValue)
    setNotesDraft(null)
    setNotesDirty(false)
  }

  return (
    <section className="card widget-compact card-scroll business-hub-panel" data-tour="company-vault-panel">
      <header className="hub-panel-head">
        <div className="hub-panel-head-copy">
          <p className="hub-panel-eyebrow">Business hub</p>
          <h2 className="hub-panel-title">Company references</h2>
        </div>
        <HelpButton
          id="company-vault"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text={BUSINESS_HUB_HELP.vault}
        />
      </header>

      <div className="card-scroll-body">
        <FeatureGate
          feature="companyReferenceVault"
          headline="Your company reference vault"
          body="Keep HMRC, Companies House, and bank references handy. Included on the Business Group plan — try it free during your trial."
          savedCount={savedCount}
          savedLabel="references saved"
        >
          {businessIds.length > 1 && (
            <div className="business-hub-scope-row">
              <label className="muted" htmlFor="vault-business-select">
                Business
              </label>
              <select
                id="vault-business-select"
                className="sheet-input sheet-input--compact"
                value={activeBusinessId ?? ''}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
              >
                {businessIds.map((id) => (
                  <option key={id} value={id}>
                    {businessName(state, id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeBusinessId ? (
            <p className="muted">Add a business in Settings to store references.</p>
          ) : (
            <>
              <table className="hub-sheet-table" data-tour="vault-fields">
                <tbody>
                  {(profile?.fields ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted hub-sheet-empty">
                        Add a field below — VAT, PAYE, company number, and more.
                      </td>
                    </tr>
                  ) : (
                    (profile?.fields ?? []).map((field) => {
                      const placeholder =
                        COMPANY_REFERENCE_PRESETS.find((p) => p.id === field.presetId)?.placeholder ??
                        'Enter value'
                      const editing = editingFieldId === field.id

                      return (
                        <tr key={field.id} className={editing ? 'hub-field-row--editing' : undefined}>
                          <th scope="row">{field.label}</th>
                          <td>
                            {editing ? (
                              <input
                                ref={fieldInputRef}
                                type="text"
                                className="sheet-input"
                                value={fieldDraft}
                                placeholder={placeholder}
                                onChange={(e) => setFieldDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveField(field.id)
                                  if (e.key === 'Escape') cancelFieldEdit()
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className={`hub-field-value-btn${field.value.trim() ? '' : ' hub-field-value-btn--empty'}`}
                                onClick={() => startEditField(field.id, field.value)}
                              >
                                {field.value.trim() || 'Enter value…'}
                              </button>
                            )}
                          </td>
                          <td className="hub-sheet-actions">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary btn-tiny"
                                  onClick={() => saveField(field.id)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost btn-tiny"
                                  onClick={cancelFieldEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn-ghost btn-tiny"
                                onClick={() => actions.removeReferenceField(activeBusinessId, field.id)}
                                aria-label={`Remove ${field.label}`}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              <div className="hub-chip-row">
                {availablePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="btn-secondary btn-tiny"
                    onClick={() => addPreset(preset.id)}
                  >
                    + {preset.label}
                  </button>
                ))}
                <button type="button" className="btn-secondary btn-tiny" onClick={addCustomField}>
                  + Custom
                </button>
              </div>

              <label className="hub-notes-label muted" htmlFor="reference-notes">
                Notes
              </label>
              <textarea
                id="reference-notes"
                className="sheet-input hub-notes-input"
                rows={2}
                value={notesValue}
                placeholder="Accountant, filing location…"
                onChange={(e) => {
                  setNotesDraft(e.target.value)
                  setNotesDirty(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNotes()
                }}
              />
              {notesDirty && (
                <div className="hub-notes-actions">
                  <button type="button" className="btn-primary btn-tiny" onClick={saveNotes}>
                    Save notes
                  </button>
                </div>
              )}
            </>
          )}
        </FeatureGate>
      </div>
    </section>
  )
}
