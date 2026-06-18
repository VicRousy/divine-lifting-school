/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MASTER_ACCESS_KEY: string
  readonly VITE_TEACHER_ACCESS_KEY: string
  readonly VITE_STUDENT_ACCESS_KEY: string
  readonly VITE_EMAIL_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
