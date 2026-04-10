const STORAGE_KEY = 'atlas-force-offline'

export function isForceOffline(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function setForceOffline(value: boolean): void {
  if (value) localStorage.setItem(STORAGE_KEY, '1')
  else localStorage.removeItem(STORAGE_KEY)
}

export function toggleForceOffline(): boolean {
  const next = !isForceOffline()
  setForceOffline(next)
  return next
}
