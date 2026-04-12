import type { NavKey } from './router'
import { isForceOffline, toggleForceOffline } from './offlineMode'
import { navigate } from './router'
import { signOut } from './views/signIn'

export interface ShellOptions {
  nav: NavKey
  title?: string
  showBack?: boolean
  /** When true, header omits menu and back (e.g. sign-in). */
  hideHeaderNav?: boolean
  statusLine?: string
  hideNav?: boolean
  /** Allow main content to extend to the viewport bottom under the fixed dock (no shell bottom padding). */
  fullBleedMain?: boolean
  /** Optional full-width strip between header and main (e.g. canvass progress). */
  belowHeader?: string
  /** Dark command-center chrome for `/admin` and similar views. */
  headerVariant?: 'default' | 'admin'
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

/** Same four destinations as the bottom dock — used in the hamburger drawer. */
function drawerNavItem(
  key: NavKey,
  active: NavKey,
  icon: string,
  label: string,
  hash: string,
): string {
  const isActive = active === key
  return `
    <button type="button" data-nav="${hash}" class="atlas-shell-drawer__item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/12 text-primary' : 'text-on-background hover:bg-surface-container-low'}">
      <span class="material-symbols-outlined text-[26px] shrink-0 ${isActive ? 'fill' : ''}">${icon}</span>
      <span class="font-headline text-sm font-bold uppercase tracking-wide">${label}</span>
    </button>`
}

export function renderShell(mainHtml: string, opts: ShellOptions): string {
  const {
    nav,
    title = 'Project Atlas',
    showBack = false,
    hideHeaderNav = false,
    statusLine = '',
    hideNav = false,
    fullBleedMain = false,
    belowHeader = '',
    headerVariant = 'default',
  } = opts
  const offlineOn = isForceOffline()
  const isAdminShell = headerVariant === 'admin'

  const headerClass = isAdminShell
    ? 'sticky top-0 z-50 flex h-16 items-center justify-between px-4 atlas-shell-header--admin'
    : 'sticky top-0 z-50 flex h-16 items-center justify-between px-4 glass-panel'

  const titleClass = isAdminShell
    ? 'font-headline truncate text-lg font-black uppercase tracking-tight text-slate-100'
    : 'font-headline truncate text-lg font-black uppercase tracking-tight text-primary'

  const backBtnClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg active:scale-95 transition-transform ' +
    (isAdminShell
      ? 'text-slate-300 hover:bg-white/10'
      : 'text-on-surface-variant hover:bg-surface-container-low')

  const menuBtnClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ' +
    (isAdminShell ? 'text-slate-300 hover:bg-white/10' : 'text-on-surface-variant hover:bg-surface-container-low')

  const headerLead = hideHeaderNav
    ? `<span class="h-10 w-10 shrink-0" aria-hidden="true"></span>`
    : showBack
      ? `<button type="button" data-action="back" class="${backBtnClass}" aria-label="Back">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>`
      : `<button type="button" data-action="toggle-menu" class="${menuBtnClass}" aria-expanded="false" aria-controls="atlas-shell-menu" aria-label="Open menu">
          <span class="material-symbols-outlined">menu</span>
        </button>`

  const offlineIdleClass = isAdminShell
    ? 'hover:bg-white/10 text-slate-400'
    : 'hover:bg-surface-container-low text-on-surface-variant'

  const header = `
    <header class="${headerClass}">
      <div class="flex items-center gap-2 min-w-0">
        ${headerLead}
        <h1 class="${titleClass}">${title}</h1>
      </div>
      <div class="flex items-center gap-2 shrink-0 text-[10px] font-bold tracking-widest ${isAdminShell ? 'text-slate-500' : 'text-on-surface-variant'}">
        ${statusLine ? `<span class="uppercase">${statusLine}</span>` : ''}
        <button type="button" data-action="toggle-offline" class="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${offlineOn ? 'bg-primary/15 text-primary' : offlineIdleClass}" aria-pressed="${!offlineOn}" aria-label="${offlineOn ? 'Go online' : 'Go offline'}">
          <span class="material-symbols-outlined text-sm ${offlineOn ? 'fill' : ''}">${offlineOn ? 'wifi_off' : 'wifi'}</span>
          <span class="uppercase tracking-widest">Online</span>
        </button>
      </div>
    </header>`

  const belowHeaderBlock =
    belowHeader.trim() === ''
      ? ''
      : `<div class="sticky top-16 z-40 border-b border-outline-variant/15 bg-surface-container-low/95 backdrop-blur-sm shadow-sm">${belowHeader}</div>`

  const hamburgerDrawer = showBack || hideHeaderNav
    ? ''
    : `
    <div id="atlas-shell-menu" class="atlas-shell-menu" aria-hidden="true">
      <button type="button" class="atlas-shell-menu__backdrop" data-action="close-menu" aria-label="Close menu"></button>
      <nav class="atlas-shell-menu__panel" aria-label="Main navigation">
        <div class="atlas-shell-menu__header">
          <p class="atlas-shell-menu__headline font-headline text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Go to</p>
          <button type="button" class="atlas-shell-menu__close" data-action="close-menu" aria-label="Close menu">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        <div class="atlas-shell-menu__list flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          ${drawerNavItem('route', nav, 'map', 'Route', '#/')}
          ${drawerNavItem('voters', nav, 'group', 'Voters', '#/voters')}
          ${drawerNavItem('log', nav, 'leaderboard', 'Progress', '#/log')}
          ${drawerNavItem('intel', nav, 'analytics', 'Intel', '#/intel')}
          ${drawerNavItem('account', nav, 'account_circle', 'Profile', '#/account')}
        </div>
        <div class="atlas-shell-menu__footer flex w-full shrink-0 flex-col gap-2">
          <button type="button" data-action="sign-out" class="font-headline flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-outline-variant/55 bg-transparent px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface">
            <span class="material-symbols-outlined text-[22px]">logout</span>
            Sign out
          </button>
          <button type="button" data-nav="#/" class="atlas-shell-menu__cta font-headline w-full rounded-2xl px-4 py-4 text-center text-base font-black uppercase tracking-wide text-white">
            Start my route
          </button>
        </div>
      </nav>
    </div>`

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
    <div class="min-h-dvh bg-background ${fullBleedMain ? '' : 'pb-nav'} font-body text-on-background selection:bg-primary/20" data-shell-variant="${headerVariant}">
      ${header}
      ${belowHeaderBlock}
      ${hamburgerDrawer}
      <div id="view-root">${mainHtml}</div>
      ${bottomNav}
    </div>`
}

let shellBindAbort: AbortController | null = null

function setHamburgerMenuOpen(root: HTMLElement, open: boolean): void {
  const menu = root.querySelector('#atlas-shell-menu')
  const btn = root.querySelector<HTMLButtonElement>('[data-action="toggle-menu"]')
  menu?.classList.toggle('atlas-shell-menu--open', open)
  menu?.setAttribute('aria-hidden', open ? 'false' : 'true')
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false')
  if (open) {
    window.setTimeout(() => {
      menu?.querySelector<HTMLButtonElement>('.atlas-shell-menu__list [data-nav]')?.focus({
        preventScroll: true,
      })
    }, 0)
  } else {
    btn?.focus({ preventScroll: true })
  }
}

export function bindShell(root: HTMLElement): void {
  shellBindAbort?.abort()
  shellBindAbort = new AbortController()
  const { signal } = shellBindAbort

  const closeHamburgerMenu = (): void => setHamburgerMenuOpen(root, false)

  root.querySelector<HTMLButtonElement>('[data-action="toggle-menu"]')?.addEventListener(
    'click',
    () => {
      const menu = root.querySelector('#atlas-shell-menu')
      const next = !menu?.classList.contains('atlas-shell-menu--open')
      setHamburgerMenuOpen(root, next)
    },
    { signal },
  )

  root.querySelectorAll<HTMLButtonElement>('[data-action="close-menu"]').forEach((btn) => {
    btn.addEventListener('click', closeHamburgerMenu, { signal })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-action="sign-out"]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        closeHamburgerMenu()
        signOut()
      },
      { signal },
    )
  })

  root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        closeHamburgerMenu()
        navigate(btn.dataset.nav ?? '#/')
      },
      { signal },
    )
  })

  root.querySelectorAll<HTMLButtonElement>('[data-action="back"]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        if (window.history.length > 1) window.history.back()
        else navigate('#/')
      },
      { signal },
    )
  })

  root.querySelectorAll<HTMLButtonElement>('[data-action="toggle-offline"]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        const next = toggleForceOffline()
        const icon = btn.querySelector<HTMLSpanElement>('.material-symbols-outlined')
        if (icon) {
          icon.textContent = next ? 'wifi_off' : 'wifi'
          icon.classList.toggle('fill', next)
        }
        btn.setAttribute('aria-pressed', String(!next))
        btn.setAttribute('aria-label', next ? 'Go online' : 'Go offline')
        const adminShell = root.dataset.shellVariant === 'admin'
        btn.classList.toggle('bg-primary/15', next)
        btn.classList.toggle('text-primary', next)
        if (adminShell) {
          btn.classList.toggle('hover:bg-white/10', !next)
          btn.classList.toggle('text-slate-400', !next)
        } else {
          btn.classList.toggle('hover:bg-surface-container-low', !next)
          btn.classList.toggle('text-on-surface-variant', !next)
        }
      },
      { signal },
    )
  })

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape') return
      const menu = root.querySelector('#atlas-shell-menu')
      if (!menu?.classList.contains('atlas-shell-menu--open')) return
      e.preventDefault()
      closeHamburgerMenu()
    },
    { signal },
  )
}
