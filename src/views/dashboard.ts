import {
  DASHBOARD_SECTOR_STORAGE_KEY,
  dashboardStats,
  delawareRepresentativeDistricts,
  getPriorityTargetsForSector,
  readDashboardSectorSelection,
  type Voter,
} from '../data'
import {
  flyDashboardMapForSectorLabel,
  invalidateDashboardMapSize,
  mountDashboardMap,
} from '../map/dashboardMap'
import { navigate } from '../router'
import { cardAccent, priorityTargetBodyHtml } from './priorityTargetMarkup'

const PRIORITY_PANEL_STORAGE_KEY = 'atlas-priority-panel-collapsed'

let dashboardBindingsAbort: AbortController | null = null

function readPriorityPanelInitiallyCollapsed(): boolean {
  try {
    return sessionStorage.getItem(PRIORITY_PANEL_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function dashboardPriorityCard(v: Voter): string {
  return `
    <article class="min-w-[280px] snap-start bg-surface-container-low/95 p-5 flex flex-col ${cardAccent(v.party)} shadow-lg shadow-black/20 ring-1 ring-black/10 backdrop-blur-md">
      ${priorityTargetBodyHtml(v)}
      <a href="#/voters/${v.id}" class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline mt-1 w-fit">
        Open voter file<span class="text-[0.92em] opacity-90" aria-hidden="true">→</span>
      </a>
      <button type="button" data-goto="/log/${v.id}" class="w-full mt-3 bg-gradient-to-b from-primary to-primary-container text-on-primary font-black py-3 text-xs tracking-widest uppercase rounded-lg active:scale-[0.98] transition-transform shadow-sm">
        Start Route
      </button>
    </article>`
}

function getSectorOptions(): { value: string; label: string }[] {
  return [
    { value: dashboardStats.sector, label: 'Statewide sweep' },
    ...delawareRepresentativeDistricts.map((d) => ({ value: d, label: d.replace(/^Delaware — /, '') })),
  ]
}

function sectorLabelForValue(value: string): string {
  const o = getSectorOptions().find((x) => x.value === value)
  return o?.label ?? value
}

function sectorListboxHtml(selected: string): string {
  return getSectorOptions()
    .map((o) => {
      const sel = o.value === selected ? 'true' : 'false'
      const v = o.value.replace(/"/g, '&quot;')
      const lab = o.label.replace(/</g, '&lt;')
      return `<li role="option" class="atlas-sector-option" data-sector-value="${v}" aria-selected="${sel}" tabindex="-1">${lab}</li>`
    })
    .join('')
}

function priorityCarouselHtml(targets: Voter[]): string {
  return targets.map(dashboardPriorityCard).join('')
}

export function renderDashboard(): string {
  const selectedSector = readDashboardSectorSelection()
  const targets = getPriorityTargetsForSector(selectedSector)
  const priorityCollapsed = readPriorityPanelInitiallyCollapsed()

  return `
    <main class="min-h-0">
      <section
        class="relative h-[calc(100dvh-4rem-4.5rem-env(safe-area-inset-bottom,0px))] w-full overflow-hidden bg-surface-dim"
        aria-label="Sector map and priority targets"
      >
        <div id="atlas-dashboard-map" class="absolute inset-0 z-0 min-h-[200px]" role="application" aria-label="Live sector map"></div>
        <div class="absolute right-4 top-4 z-20 flex flex-col gap-2">
          <button type="button" data-map-zoom="in" class="glass-panel flex h-10 w-10 items-center justify-center rounded-lg text-secondary shadow-sm active:scale-95 transition-transform" aria-label="Zoom in">
            <span class="material-symbols-outlined">add</span>
          </button>
          <button type="button" data-map-zoom="out" class="glass-panel flex h-10 w-10 items-center justify-center rounded-lg text-secondary shadow-sm active:scale-95 transition-transform" aria-label="Zoom out">
            <span class="material-symbols-outlined">remove</span>
          </button>
          <button type="button" data-map-locate class="glass-panel flex h-10 w-10 items-center justify-center rounded-lg text-primary shadow-sm active:scale-95 transition-transform" aria-label="Use my location or return to sector">
            <span class="material-symbols-outlined fill">my_location</span>
          </button>
        </div>
        <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-3 p-4">
          <div
            id="atlas-priority-panel"
            class="group pointer-events-auto space-y-2 ${priorityCollapsed ? 'is-collapsed' : ''}"
          >
            <div class="flex items-end justify-between gap-3 px-1 drop-shadow-[0_1px_8px_rgb(0_0_0/0.45)]">
              <h2 class="font-headline text-lg font-extrabold uppercase italic tracking-tight text-white text-shadow-[0_1px_2px_rgb(0_0_0/1),0_2px_12px_rgb(0_0_0/0.54)]">Priority Targets</h2>
              <button
                type="button"
                data-priority-panel-toggle
                class="atlas-priority-arrow-btn atlas-priority-arrow-btn--round shrink-0"
                aria-expanded="${priorityCollapsed ? 'false' : 'true'}"
                aria-controls="atlas-priority-carousel-region"
                aria-label="${priorityCollapsed ? 'Expand priority targets' : 'Collapse priority targets'}"
              >
                <span class="material-symbols-outlined transition-transform duration-300 ease-out motion-reduce:transition-none ${priorityCollapsed ? '-rotate-180' : ''}" aria-hidden="true">expand_more</span>
              </button>
            </div>
            <div
              id="atlas-priority-carousel-region"
              class="grid grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none group-[.is-collapsed]:grid-rows-[0fr]"
              role="region"
              aria-label="Priority target cards"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="relative">
                  <button
                    type="button"
                    id="atlas-priority-prev"
                    data-priority-scroll="prev"
                    class="atlas-priority-arrow-btn absolute left-0 top-1/2 z-20 -translate-y-1/2"
                    style="display: none"
                    aria-label="Scroll priority targets left"
                  >
                    <span class="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    id="atlas-priority-next"
                    data-priority-scroll="next"
                    class="atlas-priority-arrow-btn absolute right-0 top-1/2 z-20 -translate-y-1/2"
                    style="display: none"
                    aria-label="Scroll priority targets right"
                  >
                    <span class="material-symbols-outlined">chevron_right</span>
                  </button>
                  <div
                    id="atlas-priority-carousel"
                    class="flex gap-4 overflow-x-auto pb-2 scrolling-hide-scrollbar snap-x px-1 motion-reduce:scroll-auto"
                    data-priority-carousel
                    tabindex="0"
                    aria-label="Scrollable priority list"
                  >
                    ${priorityCarouselHtml(targets)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="pointer-events-auto rounded-lg border border-white/10 bg-slate-950/92 px-2 py-1 shadow-2xl shadow-black/35 backdrop-blur-xl">
            <div class="flex items-center gap-2">
              <div class="flex shrink-0 items-center gap-1.5">
                <span class="shrink-0 text-[8px] font-semibold uppercase tracking-wide text-slate-400 leading-none">Sector</span>
                <div class="relative w-[13rem] shrink-0" data-dashboard-sector-wrap>
                  <button
                    type="button"
                    id="atlas-dashboard-sector-trigger"
                    data-dashboard-sector-trigger
                    class="atlas-dashboard-sector-trigger w-full"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="atlas-dashboard-sector-listbox"
                    aria-label="Select map sector"
                  >
                    <span data-sector-label class="min-w-0 flex-1 truncate text-left font-headline text-[10px] leading-none text-white">${sectorLabelForValue(selectedSector).replace(/</g, '&lt;')}</span>
                    <span class="material-symbols-outlined atlas-dashboard-sector-chevron -rotate-180 shrink-0 text-[0.95rem] text-slate-400 transition-transform duration-200 motion-reduce:transition-none" aria-hidden="true">expand_more</span>
                  </button>
                  <ul
                    id="atlas-dashboard-sector-listbox"
                    data-dashboard-sector-list
                    class="atlas-sector-list scrolling-hide-scrollbar hidden"
                    role="listbox"
                    aria-labelledby="atlas-dashboard-sector-trigger"
                    tabindex="-1"
                  >
                    ${sectorListboxHtml(selectedSector)}
                  </ul>
                </div>
              </div>
              <div class="flex min-h-0 min-w-0 flex-1 items-center justify-end gap-2 border-l border-white/[0.06] pl-2">
                <div class="flex min-w-0 items-baseline justify-end gap-1.5">
                  <span class="shrink-0 text-[8px] font-semibold uppercase tracking-wide text-slate-500">Est.</span>
                  <span class="truncate font-mono text-[11px] tabular-nums leading-none text-white">${dashboardStats.timeRemaining}</span>
                </div>
                <button
                  type="button"
                  data-goto="/voters"
                  class="shrink-0 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary transition-colors hover:border-white/15 hover:bg-white/10"
                >
                  View all
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>`
}

function updatePriorityCarousel(root: HTMLElement, sector: string): void {
  const el = root.querySelector<HTMLElement>('[data-priority-carousel]')
  if (!el) return
  const targets = getPriorityTargetsForSector(sector)
  el.innerHTML = priorityCarouselHtml(targets)
  syncPriorityCarouselChrome(root)
}

function sectorListboxIsOpen(root: HTMLElement): boolean {
  const list = root.querySelector<HTMLElement>('[data-dashboard-sector-list]')
  return !!list && !list.classList.contains('hidden')
}

function closeSectorListbox(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[data-dashboard-sector-list]')
  const trig = root.querySelector<HTMLButtonElement>('[data-dashboard-sector-trigger]')
  const chev = root.querySelector<HTMLElement>('.atlas-dashboard-sector-chevron')
  if (!list || !trig) return
  list.classList.add('hidden')
  trig.setAttribute('aria-expanded', 'false')
  chev?.classList.add('-rotate-180')
}

function openSectorListbox(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[data-dashboard-sector-list]')
  const trig = root.querySelector<HTMLButtonElement>('[data-dashboard-sector-trigger]')
  const chev = root.querySelector<HTMLElement>('.atlas-dashboard-sector-chevron')
  if (!list || !trig) return
  list.classList.remove('hidden')
  trig.setAttribute('aria-expanded', 'true')
  chev?.classList.remove('-rotate-180')
}

function toggleSectorListbox(root: HTMLElement): void {
  if (sectorListboxIsOpen(root)) closeSectorListbox(root)
  else openSectorListbox(root)
}

function updateSectorListSelection(root: HTMLElement, value: string): void {
  root.querySelectorAll<HTMLElement>('[data-sector-value][role="option"]').forEach((el) => {
    const raw = el.getAttribute('data-sector-value')
    el.setAttribute('aria-selected', raw === value ? 'true' : 'false')
  })
}

function applyDashboardSectorSelection(root: HTMLElement, value: string): void {
  const labelEl = root.querySelector<HTMLElement>('[data-sector-label]')
  if (labelEl) labelEl.textContent = sectorLabelForValue(value)
  try {
    sessionStorage.setItem(DASHBOARD_SECTOR_STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
  updateSectorListSelection(root, value)
  updatePriorityCarousel(root, value)
  flyDashboardMapForSectorLabel(value)
}

function syncPriorityCarouselChrome(root: HTMLElement): void {
  const carousel = root.querySelector<HTMLElement>('[data-priority-carousel]')
  const prev = root.querySelector<HTMLButtonElement>('#atlas-priority-prev')
  const next = root.querySelector<HTMLButtonElement>('#atlas-priority-next')
  if (!carousel || !prev || !next) return

  const show = carousel.scrollWidth > carousel.clientWidth + 8
  prev.style.display = show ? 'inline-flex' : 'none'
  next.style.display = show ? 'inline-flex' : 'none'
  if (!show) return

  const gap = () => Math.max(280, carousel.clientWidth * 0.72)
  prev.onclick = (e) => {
    e.preventDefault()
    carousel.scrollBy({ left: -gap(), behavior: 'smooth' })
  }
  next.onclick = (e) => {
    e.preventDefault()
    carousel.scrollBy({ left: gap(), behavior: 'smooth' })
  }
}

export function bindDashboard(root: HTMLElement): void {
  unmountDashboardBindings()
  dashboardBindingsAbort = new AbortController()
  const { signal } = dashboardBindingsAbort

  mountDashboardMap(root)

  root.addEventListener(
    'click',
    (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]')
      if (!t) return
      e.preventDefault()
      const dest = t.dataset.goto
      if (dest) navigate('#' + dest)
    },
    { signal },
  )

  root.querySelector<HTMLButtonElement>('[data-dashboard-sector-trigger]')?.addEventListener(
    'click',
    (e) => {
      e.stopPropagation()
      toggleSectorListbox(root)
    },
    { signal },
  )

  root.addEventListener(
    'click',
    (e) => {
      const opt = (e.target as HTMLElement).closest<HTMLElement>('[data-sector-value][role="option"]')
      if (!opt || !root.querySelector('[data-dashboard-sector-list]')?.contains(opt)) return
      e.preventDefault()
      const v = opt.getAttribute('data-sector-value')
      if (!v) return
      applyDashboardSectorSelection(root, v)
      closeSectorListbox(root)
    },
    { signal },
  )

  document.addEventListener(
    'click',
    (e) => {
      if (!sectorListboxIsOpen(root)) return
      const wrap = root.querySelector('[data-dashboard-sector-wrap]')
      if (wrap?.contains(e.target as Node)) return
      closeSectorListbox(root)
    },
    { signal, capture: true },
  )

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !sectorListboxIsOpen(root)) return
      closeSectorListbox(root)
    },
    { signal },
  )

  root.querySelector<HTMLButtonElement>('[data-priority-panel-toggle]')?.addEventListener(
    'click',
    () => {
      const panel = root.querySelector('#atlas-priority-panel')
      const btn = root.querySelector<HTMLButtonElement>('[data-priority-panel-toggle]')
      const icon = btn?.querySelector<HTMLElement>('.material-symbols-outlined')
      if (!panel || !btn) return
      const collapsed = panel.classList.toggle('is-collapsed')
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
      btn.setAttribute(
        'aria-label',
        collapsed ? 'Expand priority targets' : 'Collapse priority targets',
      )
      icon?.classList.toggle('-rotate-180', collapsed)
      try {
        sessionStorage.setItem(PRIORITY_PANEL_STORAGE_KEY, collapsed ? '1' : '0')
      } catch {
        /* ignore */
      }
      invalidateDashboardMapSize()
    },
    { signal },
  )

  syncPriorityCarouselChrome(root)
  root.querySelector<HTMLElement>('[data-priority-carousel]')?.addEventListener(
    'scroll',
    () => syncPriorityCarouselChrome(root),
    { signal, passive: true },
  )
  window.addEventListener('resize', () => syncPriorityCarouselChrome(root), { signal })

  requestAnimationFrame(() => {
    syncPriorityCarouselChrome(root)
    invalidateDashboardMapSize()
  })
}

export function unmountDashboardBindings(): void {
  dashboardBindingsAbort?.abort()
  dashboardBindingsAbort = null
}
