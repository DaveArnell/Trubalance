import type { AppState, BusinessReferenceProfile, DiaryReminder } from '../../types'
import { daysAheadDateKey } from './dateHelpers'

type HubConfig = {
  businessId: string
  fields: Array<{ presetId: string; label: string; value: string }>
  notes?: string
  diary: Array<{
    title: string
    date: string
    category: DiaryReminder['category']
    notes?: string
  }>
}

const LEISURE_HUB: HubConfig[] = [
  {
    businessId: 'demo-leisure-main',
    fields: [
      { presetId: 'company-number', label: 'Company number', value: '4829103' },
      { presetId: 'vat-number', label: 'VAT registration number', value: 'GB 294 817 562' },
      { presetId: 'paye-reference', label: 'PAYE reference', value: '482/SA92831' },
      { presetId: 'pension-scheme', label: 'Pension scheme reference', value: 'NEST — scheme #88421' },
      { presetId: 'bank-operating', label: 'Main operating account', value: '40-12-34 · 88210441' },
    ],
    notes: 'Primary trading company — activity centres and hospitality.',
    diary: [
      { title: 'Quarterly VAT return', date: daysAheadDateKey(18), category: 'tax', notes: 'Q2 VAT — check leisure vs F&B split.' },
      { title: 'PAYE payment', date: daysAheadDateKey(8), category: 'tax' },
      { title: 'Employers liability renewal', date: daysAheadDateKey(42), category: 'insurance' },
      { title: 'Fire safety inspection', date: daysAheadDateKey(25), category: 'general' },
    ],
  },
  {
    businessId: 'demo-leisure-north',
    fields: [
      { presetId: 'company-number', label: 'Company number', value: '7193846' },
      { presetId: 'vat-number', label: 'VAT registration number', value: 'GB 301 552 904' },
      { presetId: 'paye-reference', label: 'PAYE reference', value: '719/AB10482' },
    ],
    notes: 'Secondary site operator — single venue.',
    diary: [
      { title: 'Business rates instalment', date: daysAheadDateKey(30), category: 'tax' },
      { title: 'Equipment safety certification', date: daysAheadDateKey(14), category: 'general' },
    ],
  },
  {
    businessId: 'demo-leisure-coast',
    fields: [
      { presetId: 'company-number', label: 'Company number', value: '8831047' },
      { presetId: 'vat-number', label: 'VAT registration number', value: 'GB 318 904 221' },
    ],
    diary: [
      { title: 'Seasonal licence renewal', date: daysAheadDateKey(55), category: 'general' },
      { title: 'Service charge review', date: daysAheadDateKey(21), category: 'general' },
    ],
  },
]

const CAFE_HUB: HubConfig[] = [
  {
    businessId: 'cafe-biz',
    fields: [
      { presetId: 'company-number', label: 'Company number', value: '5510294' },
      { presetId: 'vat-number', label: 'VAT registration number', value: 'GB 412 883 901' },
      { presetId: 'paye-reference', label: 'PAYE reference', value: '551/FE22019' },
      { presetId: 'accounts-office', label: 'Accounts Office reference', value: '551PA00928104' },
      { presetId: 'bank-operating', label: 'Main operating account', value: '20-45-18 · 30491827' },
      { presetId: 'accountant', label: 'Accountant contact', value: 'Helen Marsh · Marsh & Co · 01482 330 912' },
    ],
    notes: 'Two-site café — High Street flagship and Market Hall kiosk.',
    diary: [
      { title: 'VAT return & payment', date: daysAheadDateKey(16), category: 'tax' },
      { title: 'PAYE / NIC', date: daysAheadDateKey(9), category: 'tax' },
      { title: 'Food hygiene rating revisit', date: daysAheadDateKey(28), category: 'general' },
      { title: 'Coffee machine annual service', date: daysAheadDateKey(38), category: 'general' },
      { title: 'Business rates — Market Hall', date: daysAheadDateKey(62), category: 'tax' },
    ],
  },
]

const TRADES_HUB: HubConfig[] = [
  {
    businessId: 'trades-biz',
    fields: [
      { presetId: 'company-number', label: 'Company number', value: '6284019' },
      { presetId: 'vat-number', label: 'VAT registration number', value: 'GB 502 118 774' },
      { presetId: 'paye-reference', label: 'PAYE reference', value: '628/RB55201' },
      { presetId: 'utr', label: 'UTR (Unique Taxpayer Reference)', value: '4829103847' },
      { presetId: 'corporation-tax', label: 'Corporation Tax reference', value: '6284019001' },
      { presetId: 'hmrc-gateway', label: 'HMRC Government Gateway ID', value: 'riverside.building.cis' },
      { presetId: 'bank-operating', label: 'Main operating account', value: '30-91-44 · 71029384' },
    ],
    notes: 'General building — commercial and domestic. CIS registered.',
    diary: [
      { title: 'CIS monthly return', date: daysAheadDateKey(6), category: 'tax' },
      { title: 'PAYE payment', date: daysAheadDateKey(11), category: 'tax' },
      { title: 'Public liability insurance renewal', date: daysAheadDateKey(48), category: 'insurance' },
      { title: 'Van MOT & service', date: daysAheadDateKey(22), category: 'general' },
      { title: 'Corporation tax planning review', date: daysAheadDateKey(75), category: 'tax' },
      { title: 'Confirmation statement', date: daysAheadDateKey(90), category: 'companies-house' },
    ],
  },
]

function buildProfiles(configs: HubConfig[]): BusinessReferenceProfile[] {
  const now = new Date().toISOString()
  return configs.map((cfg) => ({
    businessId: cfg.businessId,
    notes: cfg.notes,
    updatedAt: now,
    fields: cfg.fields.map((field, index) => ({
      id: `${cfg.businessId}-${field.presetId}`,
      presetId: field.presetId,
      label: field.label,
      value: field.value,
      sortOrder: index,
    })),
  }))
}

function buildDiary(configs: HubConfig[]): DiaryReminder[] {
  const reminders: DiaryReminder[] = []
  for (const cfg of configs) {
    cfg.diary.forEach((entry, index) => {
      reminders.push({
        id: `diary-${cfg.businessId}-${index}`,
        businessId: cfg.businessId,
        title: entry.title,
        date: entry.date,
        category: entry.category,
        notes: entry.notes,
        completed: false,
        recurring: 'none',
        createdAt: entry.date,
      })
    })
  }
  return reminders
}

export function buildLeisureBusinessHub(): Pick<AppState, 'businessReferenceProfiles' | 'diaryReminders'> {
  return {
    businessReferenceProfiles: buildProfiles(LEISURE_HUB),
    diaryReminders: buildDiary(LEISURE_HUB),
  }
}

export function buildCafeBusinessHub(): Pick<AppState, 'businessReferenceProfiles' | 'diaryReminders'> {
  return {
    businessReferenceProfiles: buildProfiles(CAFE_HUB),
    diaryReminders: buildDiary(CAFE_HUB),
  }
}

export function buildTradesBusinessHub(): Pick<AppState, 'businessReferenceProfiles' | 'diaryReminders'> {
  return {
    businessReferenceProfiles: buildProfiles(TRADES_HUB),
    diaryReminders: buildDiary(TRADES_HUB),
  }
}
