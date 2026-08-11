/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** development | staging | production — set staging on preview hosts */
  readonly VITE_APP_ENV?: string
  /** When true without Supabase, admin panel defaults to demo data */
  readonly VITE_ADMIN_DEMO_DEFAULT?: string
  /** GA4 measurement ID (G-XXXXXXXX) — site traffic analytics after cookie accept */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
