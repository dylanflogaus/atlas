import {
  DASHBOARD_SECTOR_STORAGE_KEY,
  dashboardStats,
  delawareRepresentativeDistricts,
  getDelawareHousePinsForDashboardSector,
  getPriorityTargetsForSector,
  houseDistrictIndexAtLatLng,
  readDashboardSectorSelection,
  type Voter,
} from '../data'
import {
  clearDashboardCanvassRoute,
  flyDashboardMapForSectorLabel,
  invalidateDashboardMapSize,
  mountDashboardMap,
  runDashboardCanvassRoute,
  setDashboardCanvassRoutePrepare,
  setDashboardRouteEstimateListener,
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
      <button type="button" data-dashboard-route="${v.id.replace(/"/g, '&quot;')}" class="w-full mt-3 bg-gradient-to-b from-primary to-primary-container text-on-primary font-black py-3 text-xs tracking-widest uppercase rounded-lg active:scale-[0.98] transition-transform shadow-sm">
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

/** Full-width headline for the map status bar (matches stakeholder mock typography). */
function sectorBarHeadline(value: string): string {
  if (value === dashboardStats.sector) return sectorLabelForValue(value)
  const m = value.match(/Representative District\s+(\d+)/i)
  if (m) return `Delaware — District ${m[1]}`
  return sectorLabelForValue(value)
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

/** Shown in the status bar; `null` or non-positive → `0:00`. */
function formatRouteEstimateLabel(totalSeconds: number | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0:00'
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function updateRouteEstimateDisplay(root: HTMLElement, totalSeconds: number | null): void {
  const el = root.querySelector<HTMLElement>('[data-dashboard-route-estimate]')
  if (el) el.textContent = formatRouteEstimateLabel(totalSeconds)
}

function districtIndexForSectorLabel(label: string): number | null {
  const m = label.match(/District\s+(\d+)/i)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 1 || n > delawareRepresentativeDistricts.length) return null
  return n - 1
}

function ensureSectorMatchesRouteStart(
  root: HTMLElement,
  startVoterId?: string,
  startDistrictIndex?: number,
): void {
  let resolvedDistrictIndex: number | null = null
  if (
    startDistrictIndex != null &&
    Number.isInteger(startDistrictIndex) &&
    startDistrictIndex >= 0 &&
    startDistrictIndex < delawareRepresentativeDistricts.length
  ) {
    resolvedDistrictIndex = startDistrictIndex
  } else if (startVoterId) {
    // Fallback for non-map route triggers (priority cards) where district hint is absent.
    const selectedPins = getDelawareHousePinsForDashboardSector(readDashboardSectorSelection())
    const match = selectedPins.find((p) => p.voterId === startVoterId)
    if (match) resolvedDistrictIndex = houseDistrictIndexAtLatLng(match.lat, match.lng)
  }
  if (resolvedDistrictIndex == null) return
  const selectedIndex = districtIndexForSectorLabel(readDashboardSectorSelection())
  if (selectedIndex === resolvedDistrictIndex) return
  const targetSector = delawareRepresentativeDistricts[resolvedDistrictIndex]
  if (!targetSector) return
  applyDashboardSectorSelection(root, targetSector)
}

export function renderDashboard(): string {
  const selectedSector = readDashboardSectorSelection()
  const targets = getPriorityTargetsForSector(selectedSector)
  const priorityCollapsed = readPriorityPanelInitiallyCollapsed()

  return `
    <main class="min-h-0">
      <section
        class="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-surface-dim"
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
        <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-3 pt-4 px-4 pb-[calc(1rem+4.5rem+env(safe-area-inset-bottom,0px))]">
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
          <div class="pointer-events-auto atlas-dashboard-status-bar flex min-w-0 items-stretch shadow-2xl shadow-black/40">
            <div class="flex min-h-0 min-w-0 flex-1 flex-col justify-center py-3 pl-5 pr-3">
              <span class="atlas-dashboard-status-label">Current sector</span>
              <div class="relative mt-1 min-w-0" data-dashboard-sector-wrap>
                <button
                  type="button"
                  id="atlas-dashboard-sector-trigger"
                  data-dashboard-sector-trigger
                  class="atlas-dashboard-sector-trigger w-full justify-start"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="atlas-dashboard-sector-listbox"
                  aria-label="Select map sector"
                >
                  <span class="atlas-dashboard-sector-value-row">
                    <span data-sector-label class="min-w-0 truncate text-left">${sectorBarHeadline(selectedSector).replace(/</g, '&lt;')}</span>
                    <span class="material-symbols-outlined atlas-dashboard-sector-chevron shrink-0" aria-hidden="true">chevron_right</span>
                  </span>
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
            <div class="atlas-dashboard-status-time flex shrink-0 flex-col items-end justify-center border-l border-white/[0.08] py-3 pl-6 pr-5 text-right">
              <span class="atlas-dashboard-status-label">Est. time remaining</span>
              <span class="atlas-dashboard-status-value mt-1 tabular-nums" data-dashboard-route-estimate aria-live="polite">0:00</span>
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
  chev?.classList.remove('atlas-dashboard-sector-chevron--open')
}

function openSectorListbox(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[data-dashboard-sector-list]')
  const trig = root.querySelector<HTMLButtonElement>('[data-dashboard-sector-trigger]')
  const chev = root.querySelector<HTMLElement>('.atlas-dashboard-sector-chevron')
  if (!list || !trig) return
  list.classList.remove('hidden')
  trig.setAttribute('aria-expanded', 'true')
  chev?.classList.add('atlas-dashboard-sector-chevron--open')
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
  if (labelEl) labelEl.textContent = sectorBarHeadline(value)
  try {
    sessionStorage.setItem(DASHBOARD_SECTOR_STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
  updateSectorListSelection(root, value)
  updatePriorityCarousel(root, value)
  clearDashboardCanvassRoute()
  flyDashboardMapForSectorLabel(value)
}

function syncPriorityCarouselChrome(root: HTMLElement): void {
  const carousel = root.querySelector<HTMLElement>('[data-priority-carousel]')
  const prev = root.querySelector<HTMLButtonElement>('#atlas-priority-prev')
  const next = root.querySelector<HTMLButtonElement>('#atlas-priority-next')
  if (!carousel || !prev || !next) return

  const show = carousel.scrollWidth > carousel.clientWidth + 8
  if (!show) {
    prev.style.display = 'none'
    next.style.display = 'none'
    return
  }

  const maxScrollLeft = Math.max(0, carousel.scrollWidth - carousel.clientWidth)
  // Give edge detection a little tolerance for fractional/smooth scroll positions.
  const edgeThresholdPx = 16
  const atStart = carousel.scrollLeft <= edgeThresholdPx
  const atEnd = carousel.scrollLeft >= maxScrollLeft - edgeThresholdPx
  prev.style.display = atStart ? 'none' : 'inline-flex'
  next.style.display = atEnd ? 'none' : 'inline-flex'

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

  setDashboardRouteEstimateListener((totalSeconds) => updateRouteEstimateDisplay(root, totalSeconds))
  setDashboardCanvassRoutePrepare((startVoterId, startDistrictIndex) =>
    ensureSectorMatchesRouteStart(root, startVoterId, startDistrictIndex),
  )
  mountDashboardMap(root)
  updateRouteEstimateDisplay(root, null)

  root.addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented) return
      const routeBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-dashboard-route]')
      if (routeBtn) {
        const mapEl = root.querySelector<HTMLElement>('#atlas-dashboard-map')
        if (mapEl?.contains(routeBtn)) return
        e.preventDefault()
        const vid = routeBtn.dataset.dashboardRoute?.trim()
        const districtRaw = routeBtn.dataset.dashboardRouteDistrict
        const districtIndex =
          districtRaw != null && districtRaw !== '' && Number.isFinite(Number(districtRaw))
            ? Number(districtRaw)
            : undefined
        void runDashboardCanvassRoute(vid || undefined, districtIndex)
        return
      }
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
  setDashboardRouteEstimateListener(null)
  setDashboardCanvassRoutePrepare(null)
  dashboardBindingsAbort?.abort()
  dashboardBindingsAbort = null
}
