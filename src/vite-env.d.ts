/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** development | staging | production — set staging on preview hosts */
  readonly VITE_APP_ENV?: string
  /** When true without Supabase, admin panel defaults to demo data */
  readonly VITE_ADMIN_DEMO_DEFAULT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
