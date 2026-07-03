export type AppEnvironment = 'development' | 'staging' | 'production'

/** Deployment target — set VITE_APP_ENV=staging on staging hosts. */
export function getAppEnvironment(): AppEnvironment {
  const configured = import.meta.env.VITE_APP_ENV
  if (configured === 'staging' || configured === 'production') return configured
  return import.meta.env.DEV ? 'development' : 'production'
}

export function isStagingEnvironment(): boolean {
  return getAppEnvironment() === 'staging'
}

export function getAppEnvironmentLabel(env: AppEnvironment = getAppEnvironment()): string {
  if (env === 'staging') return 'Staging'
  if (env === 'production') return 'Production'
  return 'Development'
}
