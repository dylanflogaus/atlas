import type { NavKey } from './router'
import { isForceOffline, toggleForceOffline } from './offlineMode'
import { navigate } from './router'

export interface ShellOptions {
  nav: NavKey
  title?: string
  showBack?: boolean
  statusLine?: string
  hideNav?: boolean
  /** Allow main content to extend to the viewport bottom under the fixed dock (no shell bottom padding). */
  fullBleedMain?: boolean
}

function navItem(
  key: NavKey,
  active: NavKey,
  icon: string,
  label: string,
  hash: string,
): string {
  const isActive = active === key
  return `
    <button type="button" data-nav="${hash}" class="dock-item flex flex-1 flex-col items-center justify-center pt-2 pb-1 min-w-0 ${isActive ? 'text-primary border-t-2 border-primary' : 'text-on-surface-variant hover:text-primary'} transition-colors">
      <span class="material-symbols-outlined text-[22px] ${isActive ? 'fill' : ''}">${icon}</span>
      <span class="font-headline font-semibold text-[9px] sm:text-[10px] uppercase tracking-tight sm:tracking-widest mt-0.5">${label}</span>
    </button>`
}

export function renderShell(mainHtml: string, opts: ShellOptions): string {
  const {
    nav,
    title = 'Project Atlas',
    showBack = false,
    statusLine = 'APR 09 • 85%',
    hideNav = false,
    fullBleedMain = false,
  } = opts
  const offlineOn = isForceOffline()

  const header = `
    <header class="sticky top-0 z-50 flex h-16 items-center justify-between px-4 glass-panel">
      <div class="flex items-center gap-2 min-w-0">
        ${showBack ? `<button type="button" data-action="back" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-transform" aria-label="Back">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>` : `<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low" aria-label="Menu">
          <span class="material-symbols-outlined">menu</span>
        </button>`}
        <h1 class="font-headline truncate text-lg font-black uppercase tracking-tight text-primary">${title}</h1>
      </div>
      <div class="flex items-center gap-2 shrink-0 text-[10px] font-bold tracking-widest text-on-surface-variant">
        <span class="uppercase">${statusLine}</span>
        <button type="button" data-action="toggle-offline" class="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${offlineOn ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}" aria-pressed="${!offlineOn}" aria-label="${offlineOn ? 'Go online' : 'Go offline'}">
          <span class="material-symbols-outlined text-sm ${offlineOn ? 'fill' : ''}">${offlineOn ? 'wifi_off' : 'wifi'}</span>
          <span class="uppercase tracking-widest">Online</span>
        </button>
      </div>
    </header>`

  const bottomNav = hideNav
    ? ''
    : `
    <nav class="command-dock fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch justify-around px-1 safe-bottom border-t border-outline-variant/20 gap-0.5" role="navigation" aria-label="Main">
      ${navItem('route', nav, 'map', 'Route', '#/')}
      ${navItem('voters', nav, 'group', 'Voters', '#/voters')}
      ${navItem('log', nav, 'leaderboard', 'Progress', '#/log')}
      ${navItem('intel', nav, 'analytics', 'Intel', '#/intel')}
    </nav>`

  return `
    <div class="min-h-dvh bg-background ${fullBleedMain ? '' : 'pb-nav'} font-body text-on-background selection:bg-primary/20">
      ${header}
      <div id="view-root">${mainHtml}</div>
      ${bottomNav}
    </div>`
}

export function bindShell(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.nav ?? '#/')
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-action="back"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back()
      else navigate('#/')
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-action="toggle-offline"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = toggleForceOffline()
      const icon = btn.querySelector<HTMLSpanElement>('.material-symbols-outlined')
      if (icon) {
        icon.textContent = next ? 'wifi_off' : 'wifi'
        icon.classList.toggle('fill', next)
      }
      btn.setAttribute('aria-pressed', String(!next))
      btn.setAttribute('aria-label', next ? 'Go online' : 'Go offline')
      btn.classList.toggle('bg-primary/10', next)
      btn.classList.toggle('text-primary', next)
      btn.classList.toggle('hover:bg-surface-container-low', !next)
      btn.classList.toggle('text-on-surface-variant', !next)
    })
  })
}
