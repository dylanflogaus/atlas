import * as L from 'leaflet'
import type { Voter } from '../data'
import { getVoterApproxCoords } from '../data'
import {
  clearCanvassTourOrder,
  consumeCanvassAchievementRevealForStop,
  readCanvassTourOrder,
  WALK_SIM_ACHIEVEMENT_STORAGE_KEY,
} from '../canvassFlow'
import { navigate } from '../router'
import { bindInlineLogContact, renderInlineLogContact } from './log'

let walkMapTeardown: (() => void) | null = null

export type WalkSimAchievementTier = 'gold' | 'silver' | 'bronze' | 'campaign'

export interface WalkSimAchievement {
  title: string
  description: string
  icon: string
  tier: WalkSimAchievementTier
}

const WALK_SIM_ACHIEVEMENT_POOL: WalkSimAchievement[] = [
  {
    title: 'Streak spark',
    description: 'Back-to-back quality contacts on this route',
    icon: 'local_fire_department',
    tier: 'bronze',
  },
  {
    title: 'Turf tracker',
    description: 'Every knock logged with a clear outcome',
    icon: 'where_to_vote',
    tier: 'silver',
  },
  {
    title: 'Neighbor nod',
    description: 'Warm intro that kept the door open',
    icon: 'waving_hand',
    tier: 'campaign',
  },
  {
    title: 'Clipboard ace',
    description: 'Notes that the next shift can use',
    icon: 'edit_note',
    tier: 'bronze',
  },
  {
    title: 'Route rhythm',
    description: 'On pace through tonight’s turf slice',
    icon: 'route',
    tier: 'silver',
  },
  {
    title: 'Golden knock',
    description: 'A standout conversation on the doors',
    icon: 'star',
    tier: 'gold',
  },
  {
    title: 'Lit & lift',
    description: 'Left materials with a friendly handoff',
    icon: 'description',
    tier: 'campaign',
  },
  {
    title: 'Closing cadence',
    description: 'Clean wrap-up and thank-you at the stoop',
    icon: 'campaign',
    tier: 'bronze',
  },
]

function pickRandomWalkSimAchievement(): WalkSimAchievement {
  const i = Math.floor(Math.random() * WALK_SIM_ACHIEVEMENT_POOL.length)
  return WALK_SIM_ACHIEVEMENT_POOL[i]!
}

function queuePendingWalkSimAchievement(a: WalkSimAchievement): void {
  try {
    sessionStorage.setItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY, JSON.stringify(a))
  } catch {
    /* private mode */
  }
}

export function consumePendingWalkSimAchievement(): WalkSimAchievement | null {
  try {
    const raw = sessionStorage.getItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
    sessionStorage.removeItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    const title = o.title
    const description = o.description
    const icon = o.icon
    const tier = o.tier
    if (typeof title !== 'string' || typeof description !== 'string' || typeof icon !== 'string') return null
    const t =
      tier === 'gold' || tier === 'silver' || tier === 'bronze' || tier === 'campaign' ? tier : 'campaign'
    return { title, description, icon, tier: t }
  } catch {
    return null
  }
}

function walkSimTierToastClasses(tier: WalkSimAchievementTier): { shell: string; iconBox: string; icon: string } {
  if (tier === 'gold') {
    return {
      shell:
        'border-amber-400/80 bg-gradient-to-br from-amber-100/95 via-yellow-50/90 to-amber-500/35 shadow-[0_12px_36px_-8px_rgba(245,158,11,0.55)] ring-2 ring-amber-300/90',
      iconBox: 'bg-gradient-to-br from-amber-200 to-amber-600 shadow-md ring-1 ring-amber-100',
      icon: 'text-amber-50 drop-shadow-sm',
    }
  }
  if (tier === 'silver') {
    return {
      shell:
        'border-sky-300/80 bg-gradient-to-br from-white via-sky-50/90 to-slate-400/40 shadow-[0_12px_36px_-8px_rgba(56,189,248,0.4)] ring-2 ring-sky-200/90',
      iconBox: 'bg-gradient-to-br from-slate-200 to-slate-600 shadow-md ring-1 ring-white',
      icon: 'text-white drop-shadow-sm',
    }
  }
  if (tier === 'bronze') {
    return {
      shell:
        'border-orange-400/75 bg-gradient-to-br from-orange-50/95 via-amber-50/85 to-orange-700/35 shadow-[0_12px_36px_-8px_rgba(249,115,22,0.45)] ring-2 ring-orange-300/85',
      iconBox: 'bg-gradient-to-br from-orange-300 to-orange-800 shadow-md ring-1 ring-orange-100',
      icon: 'text-orange-50 drop-shadow-sm',
    }
  }
  return {
    shell:
      'border-primary/50 bg-gradient-to-br from-primary/25 via-fuchsia-500/20 to-secondary/30 shadow-[0_12px_36px_-8px_rgba(200,16,46,0.38)] ring-2 ring-primary/70',
    iconBox: 'bg-gradient-to-br from-primary-container to-primary shadow-md ring-1 ring-white/30',
    icon: 'text-on-primary drop-shadow-sm',
  }
}

function renderWalkSimAchievementToast(a: WalkSimAchievement): string {
  const v = walkSimTierToastClasses(a.tier)
  return `
    <div
      data-walk-achievement-toast
      class="atlas-walk-achievement-toast relative overflow-hidden rounded-2xl border-2 px-3 py-3 sm:px-4 sm:py-3.5 ${v.shell}"
      role="status"
      aria-live="polite"
    >
      <div class="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/35 blur-2xl" aria-hidden="true"></div>
      <div class="relative flex items-start gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${v.iconBox}">
          <span class="material-symbols-outlined text-[26px] fill ${v.icon}" aria-hidden="true">${a.icon}</span>
        </div>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Achievement unlocked · demo</p>
          <p class="mt-1 font-headline text-sm font-black uppercase tracking-tight text-on-surface">${a.title}</p>
          <p class="mt-0.5 text-[11px] font-medium leading-snug text-on-surface-variant">${a.description}</p>
        </div>
        <span class="material-symbols-outlined shrink-0 text-2xl text-amber-500 atlas-walk-achievement-sparkle" aria-hidden="true">auto_awesome</span>
      </div>
    </div>`
}

export function renderCurrentVoterAchievementOverlay(a: WalkSimAchievement): string {
  const v = walkSimTierToastClasses(a.tier)
  return `
    <div
      class="atlas-achievements-fixed-overlay border-b border-outline-variant/25 bg-surface-container-low/98 pt-[max(0.4rem,env(safe-area-inset-top,0px))] pb-2 shadow-[0_12px_40px_rgb(0_0_0_/_0.14)] backdrop-blur-md"
      data-current-voter-achievement-overlay
      role="status"
      aria-live="polite"
    >
      <div class="mx-auto w-full max-w-lg px-3 sm:px-6">
        <div class="relative overflow-hidden rounded-2xl border-2 px-3 py-3 sm:px-4 sm:py-3.5 ${v.shell}">
          <div class="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/35 blur-2xl" aria-hidden="true"></div>
          <div class="relative flex items-start gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${v.iconBox}">
              <span class="material-symbols-outlined text-[26px] fill ${v.icon}" aria-hidden="true">${a.icon}</span>
            </div>
            <div class="min-w-0 flex-1 pt-0.5">
              <p class="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Achievement unlocked · current voter</p>
              <p class="mt-1 font-headline text-sm font-black uppercase tracking-tight text-on-surface">${a.title}</p>
              <p class="mt-0.5 text-[11px] font-medium leading-snug text-on-surface-variant">${a.description}</p>
            </div>
            <span class="material-symbols-outlined shrink-0 text-2xl text-amber-500 atlas-walk-achievement-sparkle" aria-hidden="true">auto_awesome</span>
          </div>
        </div>
      </div>
    </div>`
}

export function renderCanvassWalkProgressStrip(index: number, total: number): string {
  if (total <= 0) return ''
  const completed = index
  const remaining = Math.max(0, total - index)
  const fillPct = Math.min(100, Math.round((completed / total) * 100))
  return `
    <div class="atlas-canvass-progress-strip px-4 py-2.5">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span>Voters in route</span>
        <span class="tabular-nums text-on-surface">${remaining} left in this route</span>
      </div>
      <div class="mx-auto mt-2 max-w-6xl h-2 overflow-hidden rounded-full bg-surface-container-highest ring-1 ring-outline-variant/20">
        <div class="atlas-canvass-progress-strip__fill h-full rounded-full bg-gradient-to-r from-primary to-secondary shadow-sm" style="width: ${fillPct}%"></div>
      </div>
      <p class="mx-auto mt-1.5 max-w-6xl text-center text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Stop ${index + 1} of ${total}</p>
    </div>`
}

export function renderCanvassWalk(v: Voter, pendingAchievement: WalkSimAchievement | null = null): string {
  const coords = getVoterApproxCoords(v.id)
  const lat = coords?.lat ?? 39.67
  const lng = coords?.lng ?? -75.75
  const toastHtml = pendingAchievement ? renderWalkSimAchievementToast(pendingAchievement) : ''

  return `
    <main class="canvass-walk atlas-route-flow-page mx-auto w-full max-w-lg space-y-4 px-4 pb-28 pt-3 sm:px-6">
      <div class="atlas-route-flow-rise flex justify-end -mt-0.5" style="--atlas-rf-d: 0ms">
        <button
          type="button"
          data-canvass-walk-skip
          class="font-headline text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/55 hover:text-on-surface-variant/80 py-1.5 px-2 -mr-1 rounded-md hover:bg-surface-container-highest/55 active:scale-[0.98] transition-colors"
          aria-label="Skip this stop without submitting a log"
        >
          Skip stop
        </button>
      </div>
      ${toastHtml}
      <section class="atlas-route-flow-rise overflow-hidden rounded-2xl shadow-md ring-1 ring-outline-variant/20" style="--atlas-rf-d: 58ms">
        <div id="atlas-walk-map" class="atlas-walk-map z-0 min-h-[200px] w-full" style="height:220px" role="img" aria-label="Map near voter"></div>
        <p class="bg-surface-container-low px-3 py-2 font-mono text-[10px] text-on-surface-variant">Approximate stop · ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
      </section>

      <section class="atlas-route-flow-rise rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 ring-1 ring-outline-variant/10" style="--atlas-rf-d: 115ms">
        <p class="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">Current voter</p>
        <h2 class="mt-1 font-headline text-xl font-black text-on-surface">${v.name}</h2>
        <p class="mt-1 text-sm text-on-surface-variant">${v.address}, ${v.cityState}</p>
        <p class="mt-2 text-xs text-on-surface-variant">${v.subtitle}</p>
        <div class="mt-3 flex flex-wrap gap-2 font-mono text-[10px] font-bold uppercase">
          <span class="rounded-md bg-surface-container-high px-2 py-1 text-on-surface-variant">${v.district}</span>
          <span class="rounded-md bg-primary/12 px-2 py-1 text-primary tabular-nums">Support ${v.supportScore}%</span>
          <span class="rounded-md bg-secondary-container/80 px-2 py-1 text-on-secondary-container">${v.reliability} rel.</span>
        </div>
        <p class="mt-3 border-l-2 border-primary/25 pl-3 text-xs italic text-on-surface-variant">“${v.canvassingNote}”</p>
      </section>

      ${renderInlineLogContact()}

      <div class="atlas-route-flow-rise pt-2" style="--atlas-rf-d: 220ms">
        <button type="button" data-inline-log-submit class="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-4 font-headline text-sm font-bold uppercase tracking-widest text-on-primary shadow-lg transition-all active:scale-[0.98]">
          <span>Submit &amp; next</span>
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </main>`
}

export function mountWalkVoterMap(root: HTMLElement, voterLat: number, voterLng: number): void {
  walkMapTeardown?.()
  walkMapTeardown = null
  const el = root.querySelector<HTMLElement>('#atlas-walk-map')
  if (!el) return

  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([voterLat, voterLng], 16)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map)

  L.marker([voterLat, voterLng], { title: 'Voter stop' }).addTo(map)

  map.locate({ setView: false, maxZoom: 16, watch: false, enableHighAccuracy: true })
  map.once('locationfound', (e) => {
    const ll = e.latlng
    L.circleMarker(ll, {
      radius: 8,
      color: '#9e001f',
      fillColor: '#c8102e',
      fillOpacity: 0.35,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip('You', { direction: 'top' })
    try {
      map.fitBounds(L.latLngBounds([ll, [voterLat, voterLng]]), { padding: [44, 44], maxZoom: 17 })
    } catch {
      /* ignore */
    }
  })

  requestAnimationFrame(() => map.invalidateSize())

  walkMapTeardown = () => {
    map.remove()
    walkMapTeardown = null
  }
}

export function unmountWalkVoterMap(): void {
  walkMapTeardown?.()
}

export function bindCanvassWalk(root: HTMLElement, index: number, voter: Voter): void {
  const coords = getVoterApproxCoords(voter.id)
  const lat = coords?.lat ?? 39.67
  const lng = coords?.lng ?? -75.75
  mountWalkVoterMap(root, lat, lng)

  const toast = root.querySelector<HTMLElement>('[data-walk-achievement-toast]')
  if (toast) {
    window.setTimeout(() => {
      toast.classList.add('atlas-walk-achievement-toast--dismiss')
    }, 7200)
  }

  const advance = (): void => {
    const tour = readCanvassTourOrder()
    if (!tour) {
      navigate('#/')
      return
    }
    const nextIdx = index + 1
    if (nextIdx >= tour.length) {
      try {
        sessionStorage.removeItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      clearCanvassTourOrder()
      navigate(`#/mission-complete?voter=${encodeURIComponent(voter.id)}`)
      return
    }
    if (consumeCanvassAchievementRevealForStop(nextIdx)) {
      queuePendingWalkSimAchievement(pickRandomWalkSimAchievement())
    } else {
      try {
        sessionStorage.removeItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
    navigate(`#/canvass/walk/${nextIdx}`)
  }

  root.querySelector('[data-canvass-walk-skip]')?.addEventListener('click', () => {
    advance()
  })

  bindInlineLogContact(root, advance)
}