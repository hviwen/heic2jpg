export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
}

export function toApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return new URL(path, `${getApiBaseUrl().replace(/\/$/, '')}/`).toString()
}
