export type NavKey = 'route' | 'voters' | 'log' | 'intel'

export interface RouteState {
  path: string
  voterId: string | null
  nav: NavKey
  /** True when hash includes `?ballot=1` (opened from profile "Log Ballot Request"). */
  logRevealForm: boolean
}

function navFromPath(path: string): NavKey {
  if (path.startsWith('/log')) return 'log'
  if (path.startsWith('/voters')) return 'voters'
  if (path.startsWith('/intel')) return 'intel'
  return 'route'
}

function parsePath(hash: string): { path: string; voterId: string | null; logRevealForm: boolean } {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathname, query] = raw.split('?')
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const params = new URLSearchParams(query ?? '')
  const voterFromQuery = params.get('voter')
  const logRevealForm = params.get('ballot') === '1'
  const parts = path.split('/').filter(Boolean)

  let voterId: string | null = voterFromQuery
  if (!voterId && parts[0] === 'voters' && parts[1]) {
    voterId = parts[1]
  }
  if (!voterId && parts[0] === 'log' && parts[1]) {
    voterId = parts[1]
  }

  return { path: path === '' ? '/' : path, voterId, logRevealForm }
}

export function readRoute(): RouteState {
  const { path, voterId, logRevealForm } = parsePath(window.location.hash)
  return { path, voterId, nav: navFromPath(path), logRevealForm }
}

export function navigate(to: string): void {
  window.location.hash = to.startsWith('#') ? to.slice(1) : to
}

export function onRouteChange(cb: (r: RouteState) => void): () => void {
  const handler = (): void => cb(readRoute())
  window.addEventListener('hashchange', handler)
  return () => window.removeEventListener('hashchange', handler)
}
