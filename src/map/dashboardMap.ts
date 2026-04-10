import * as L from 'leaflet'
import {
  DASHBOARD_SECTOR_STORAGE_KEY,
  dashboardMapConfig,
  dashboardStats,
  delawareVerifiedHousePins,
  getDelawareHousePinsForDashboardSector,
  getVoter,
  houseDistrictIndexAtLatLng,
  readDashboardSectorSelection,
  representativeDistrictMapCentroids,
  type DelawareHousePin,
} from '../data'
import { cardAccent, priorityTargetBodyHtml } from '../views/priorityTargetMarkup'

const DASHBOARD_MAP_VIEW_STORAGE_KEY = 'atlas-dashboard-map-view'

/** Above default tiles/markers so the canvass route stays readable. */
const ATLAS_ROUTE_PANE = 'atlasRoutePane'

/** Zoom when a house district is selected — high enough that tactical pins read clearly. */
const REPRESENTATIVE_DISTRICT_FOCUS_ZOOM = 16
/** Below this zoom, markers collapse into one point per representative district. */
const DISTRICT_GROUPING_MAX_ZOOM = 10

let activeDashboardMap: L.Map | null = null
const PIN_COLORS: Record<string, string> = {
  REP: '#9e001f',
  PERS: '#f59e0b',
  SENT: '#059669',
}

let teardown: (() => void) | null = null

/** Cleared layers + route UI; lives for one map mount. */
let routeLayerGroup: L.LayerGroup | null = null
let routePulseMarker: L.CircleMarker | null = null
let routeAnimToken = 0
let routeLoadingOverlayEl: HTMLElement | null = null
let routeLoadingMessageInterval: ReturnType<typeof setInterval> | null = null
let routeExcludedVoterIds = new Set<string>()

function addRouteExcludedVoterId(voterId: string): void {
  routeExcludedVoterIds.add(voterId)
}

function removeRouteExcludedVoterId(voterId: string): void {
  routeExcludedVoterIds.delete(voterId)
}

/** After a successful draw; used to rebuild the tour when excluding a stop. */
let lastCanvassRouteRecalc: { startVoterId?: string; startDistrictIndex?: number } | null = null

let canvassRoutePolylineActive = false

const OSRM_MAX_WAYPOINTS = 26
const OSRM_REQUEST_TIMEOUT_MS = 7000
const ROUTE_PROVIDERS = [
  { kind: 'osrm-get', endpoint: 'https://router.project-osrm.org/route/v1/driving/' },
  { kind: 'valhalla-osrm', endpoint: 'https://valhalla1.openstreetmap.de/route' },
] as const

function pinDistSq(a: DelawareHousePin, b: DelawareHousePin): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return dLat * dLat + dLng * dLng
}

/** Greedy nearest-neighbor tour — reasonable heuristic for short canvass loops. */
function orderPinsNearestNeighbor(pins: DelawareHousePin[], start: DelawareHousePin): DelawareHousePin[] {
  const remaining = pins.filter((p) => p !== start)
  const ordered: DelawareHousePin[] = [start]
  let current = start
  while (remaining.length) {
    let bestI = 0
    let bestD = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = pinDistSq(current, remaining[i])
      if (d < bestD) {
        bestD = d
        bestI = i
      }
    }
    current = remaining.splice(bestI, 1)[0]
    ordered.push(current)
  }
  return ordered
}

/** Meters along a polyline (haversine / geodesic per Leaflet segment). */
function pathLengthMeters(path: L.LatLngTuple[]): number {
  let m = 0
  for (let i = 0; i < path.length - 1; i++) {
    m += L.latLng(path[i]!).distanceTo(L.latLng(path[i + 1]!))
  }
  return m
}

/** When the router returns no duration, approximate driving time from path length (~25 mph avg). */
function estimateDriveSecondsFromPath(path: L.LatLngTuple[]): number {
  const meters = pathLengthMeters(path)
  const averageMps = 11.18
  return Math.max(0, Math.round(meters / averageMps))
}

export type DashboardRouteEstimateListener = (totalSeconds: number | null) => void

let routeEstimateListener: DashboardRouteEstimateListener | null = null

/** Sync sector selection before route generation (dashboard wires this). */
export type DashboardCanvassRoutePrepareFn = (
  startVoterId?: string,
  startDistrictIndex?: number,
) => void

let canvassRoutePrepare: DashboardCanvassRoutePrepareFn | null = null

export function setDashboardCanvassRoutePrepare(fn: DashboardCanvassRoutePrepareFn | null): void {
  canvassRoutePrepare = fn
}

/** Wired from the dashboard so the status bar can show route duration; cleared on unmount. */
export function setDashboardRouteEstimateListener(fn: DashboardRouteEstimateListener | null): void {
  routeEstimateListener = fn
}

function notifyRouteEstimate(totalSeconds: number | null): void {
  routeEstimateListener?.(totalSeconds)
}

interface OsrmRouteResponse {
  routes?: {
    duration?: number
    geometry?: { coordinates?: [number, number][] }
  }[]
}

async function fetchOsrmDrivingRoute(
  latlngs: L.LatLngTuple[],
): Promise<{ path: L.LatLngTuple[]; durationSeconds: number } | null> {
  if (latlngs.length < 2) return null
  const slice = latlngs.slice(0, OSRM_MAX_WAYPOINTS)
  const coordStr = slice.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const suffix = `${coordStr}?overview=full&geometries=geojson`

  for (const provider of ROUTE_PROVIDERS) {
    try {
      const res =
        provider.kind === 'osrm-get'
          ? await fetch(`${provider.endpoint}${suffix}`, {
              signal: AbortSignal.timeout(OSRM_REQUEST_TIMEOUT_MS),
            })
          : await fetch(provider.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                locations: slice.map(([lat, lng]) => ({ lat, lon: lng })),
                costing: 'auto',
                format: 'osrm',
                shape_format: 'geojson',
              }),
              signal: AbortSignal.timeout(OSRM_REQUEST_TIMEOUT_MS),
            })
      if (!res.ok) continue
      const data = (await res.json()) as OsrmRouteResponse
      const route0 = data.routes?.[0]
      const coords = route0?.geometry?.coordinates
      if (!route0 || !Array.isArray(coords) || coords.length < 2) continue
      const path = coords.map((c) => [c[1], c[0]] as L.LatLngTuple)
      const fromApi =
        typeof route0.duration === 'number' && Number.isFinite(route0.duration)
          ? route0.duration
          : null
      const durationSeconds = Math.round(fromApi ?? estimateDriveSecondsFromPath(path))
      return { path, durationSeconds }
    } catch {
      // Try next provider.
    }
  }
  return null
}

function interpolateAlongPolyline(path: L.LatLngTuple[], t: number): L.LatLng {
  if (path.length === 0) return L.latLng(0, 0)
  if (path.length === 1) return L.latLng(path[0])
  const latlngs = path.map((p) => L.latLng(p[0], p[1]))
  let total = 0
  const legLens: number[] = []
  for (let i = 0; i < latlngs.length - 1; i++) {
    const d = latlngs[i].distanceTo(latlngs[i + 1])
    legLens.push(d)
    total += d
  }
  if (total <= 0) return latlngs[0]
  let dist = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < legLens.length; i++) {
    const leg = legLens[i]
    if (dist <= leg || i === legLens.length - 1) {
      const f = leg > 0 ? Math.min(1, dist / leg) : 0
      const a = latlngs[i]
      const b = latlngs[i + 1]
      return L.latLng(a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f)
    }
    dist -= leg
  }
  return latlngs[latlngs.length - 1]
}

function routeStartLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'atlas-dashboard-route-start-wrap',
    html: `<div class="atlas-dashboard-route-start" aria-hidden="true">
      <span class="atlas-dashboard-route-start__pulse"></span>
      <span class="atlas-dashboard-route-start__core"></span>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

/** Blue blinking “current location” style marker at the first point of the path. */
function addRouteStartMarker(path: L.LatLngTuple[]): void {
  if (path.length < 1 || !routeLayerGroup) return
  const start = path[0]
  L.marker(start, {
    icon: routeStartLocationIcon(),
    interactive: false,
    keyboard: false,
    pane: ATLAS_ROUTE_PANE,
    zIndexOffset: 350,
  }).addTo(routeLayerGroup)
}

function animatePulseAlongRoute(path: L.LatLngTuple[], durationMs: number, token: number): void {
  routePulseMarker?.remove()
  if (path.length < 2) return
  routePulseMarker = L.circleMarker(path[0], {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    fillColor: '#c8102e',
    fillOpacity: 1,
    opacity: 1,
    className: 'atlas-dashboard-route-pulse',
    pane: ATLAS_ROUTE_PANE,
  }).addTo(routeLayerGroup!)

  const t0 = performance.now()
  const step = (now: number): void => {
    if (token !== routeAnimToken) return
    const u = Math.min(1, (now - t0) / durationMs)
    const ll = interpolateAlongPolyline(path, u)
    routePulseMarker?.setLatLng(ll)
    if (u < 1) {
      requestAnimationFrame(step)
    }
  }
  requestAnimationFrame(step)
}

const START_ROUTE_POPUP_BTN_CLASS =
  'w-full mt-3 bg-gradient-to-b from-primary to-primary-container text-on-primary font-black py-3 text-xs tracking-widest uppercase rounded-lg active:scale-[0.98] transition-transform shadow-sm border-0 cursor-pointer'

const REMOVE_FROM_ROUTE_POPUP_BTN_CLASS =
  'w-full mt-2 bg-transparent text-on-surface font-bold py-2.5 text-xs tracking-widest uppercase rounded-lg border border-outline-variant active:scale-[0.98] transition-transform cursor-pointer'

const RESTORE_ROUTE_POPUP_BTN_CLASS =
  'w-full mt-2 bg-secondary-container text-on-secondary-container font-bold py-2.5 text-xs tracking-widest uppercase rounded-lg active:scale-[0.98] transition-transform cursor-pointer border-0'

function tacticalPinPopupClassName(pin: DelawareHousePin): string {
  const base = 'atlas-map-popup-wrap'
  const v = getVoter(pin.voterId)
  if (!v) return `${base} atlas-popup-accent-none`
  switch (v.party) {
    case 'REP':
      return `${base} atlas-popup-accent-rep`
    case 'DEM':
      return `${base} atlas-popup-accent-dem`
    case 'IND':
      return `${base} atlas-popup-accent-ind`
    case 'PERS':
      return `${base} atlas-popup-accent-pers`
    default:
      return `${base} atlas-popup-accent-none`
  }
}

function tacticalDivIcon(tag: string): L.DivIcon {
  const color = PIN_COLORS[tag] ?? '#4e5d86'
  return L.divIcon({
    className: 'atlas-map-pin',
    html: `
      <div class="atlas-map-pin-inner">
        <span class="material-symbols-outlined fill atlas-map-pin-glyph" style="color:${color}">location_on</span>
        <span style="background:${color};font-size:8px;font-weight:800;padding:2px 6px;border-radius:4px;box-shadow:0 2px 6px rgb(0 0 0 / 0.25);color:#fff;margin-top:4px">${tag}</span>
      </div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46],
  })
}

function tacticalPinRouteAdjustHtml(pin: DelawareHousePin): string {
  const pinDistrictIndex = houseDistrictIndexAtLatLng(pin.lat, pin.lng)
  const activeDistrictIndex = readActiveRouteDistrictIndex()
  if (activeDistrictIndex == null || activeDistrictIndex !== pinDistrictIndex) return ''
  const esc = pin.voterId.replace(/"/g, '&quot;')
  const excluded = routeExcludedVoterIds.has(pin.voterId)
  if (excluded) {
    return `<button type="button" data-dashboard-route-restore="${esc}" data-dashboard-route-district="${pinDistrictIndex}" class="${RESTORE_ROUTE_POPUP_BTN_CLASS}">Include in route</button>`
  }
  return `<button type="button" data-dashboard-route-remove="${esc}" data-dashboard-route-district="${pinDistrictIndex}" class="${REMOVE_FROM_ROUTE_POPUP_BTN_CLASS}">Remove from route</button>`
}

function tacticalPinPopupHtml(pin: DelawareHousePin): string {
  const v = getVoter(pin.voterId)
  const voterFileHref = `#/voters/${encodeURIComponent(pin.voterId)}`
  const pinDistrictIndex = houseDistrictIndexAtLatLng(pin.lat, pin.lng)
  const startRouteBtn = `<button type="button" data-dashboard-route="${pin.voterId.replace(/"/g, '&quot;')}" data-dashboard-route-district="${pinDistrictIndex}" class="${START_ROUTE_POPUP_BTN_CLASS}">Start Route</button>`
  const routeAdjustBtn = tacticalPinRouteAdjustHtml(pin)

  if (!v) {
    const safeAddr = pin.address
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<div class="atlas-map-popup atlas-map-popup-panel bg-surface-container-low p-4 rounded-lg" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d"><p style="font-weight:700;margin:0 0 8px">${safeAddr}</p><p style="margin:0 0 10px;color:#3f4446;font-size:12px">No voter record for this pin.</p><a href="${voterFileHref}" style="color:#9e001f;font-weight:700;font-size:14px;text-decoration:underline;text-underline-offset:2px">Open voter file →</a>${startRouteBtn}${routeAdjustBtn}</div>`
  }

  return `<div class="atlas-map-popup" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d;min-width:260px">
    <article class="atlas-map-popup-card bg-surface-container-low p-4 flex flex-col ${cardAccent(v.party)} rounded-lg">
      ${priorityTargetBodyHtml(v)}
      <a href="#/voters/${v.id}" class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline mt-1 w-fit">
        Open voter file<span class="text-[0.92em] opacity-90" aria-hidden="true">→</span>
      </a>
      ${startRouteBtn}
      ${routeAdjustBtn}
    </article>
  </div>`
}

function districtDivIcon(total: number, color: string): L.DivIcon {
  return L.divIcon({
    className: 'atlas-map-district-pin',
    html: `<div class="atlas-map-district-pin-inner" style="background:${color};border-color:${color}">
      <span class="atlas-map-district-pin-count">${total}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  })
}

interface PersistedDashboardMapView {
  sector: string
  lat: number
  lng: number
  zoom: number
}

function readPersistedDashboardMapView(): PersistedDashboardMapView | null {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_MAP_VIEW_STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<PersistedDashboardMapView>
    if (
      typeof v.sector !== 'string' ||
      typeof v.lat !== 'number' ||
      typeof v.lng !== 'number' ||
      typeof v.zoom !== 'number'
    ) {
      return null
    }
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng) || !Number.isFinite(v.zoom)) return null
    return { sector: v.sector, lat: v.lat, lng: v.lng, zoom: v.zoom }
  } catch {
    return null
  }
}

function isRepresentativeDistrictSector(sector: string): boolean {
  return /District\s+\d+/i.test(sector)
}

function persistDashboardMapView(sector: string, lat: number, lng: number, zoom: number): void {
  try {
    sessionStorage.setItem(
      DASHBOARD_MAP_VIEW_STORAGE_KEY,
      JSON.stringify({ sector, lat, lng, zoom }),
    )
  } catch {
    // ignore quota / private mode
  }
}

const ROUTE_PULSE_MS = 2800

const ROUTE_LOADING_MESSAGES: readonly string[] = [
  'Calculating shortest route.',
  'Bribing the map with good vibes (and math).',
  'Negotiating with one-way streets.',
  'Teaching GPS about doors, not detours.',
  'Asking the satellite very politely.',
  'Fewer zigzags than your last turf sketch—hopefully.',
  'Road math in progress. Hydrate.',
  'Convincing turn restrictions you’re with the good guys.',
  'Still faster than folding a walk sheet.',
  'Plotting the red line… respectfully.',
  'Almost as quick as you between porches.',
  'The routing gods are speed-walking.',
  'Snapping this mess to something you can actually walk.',
  'Hang tight—great turf takes a hot second.',
]

const ROUTE_LOADING_MESSAGE_MS = 3500

function shuffleRouteLoadingMessages(): string[] {
  const q = [...ROUTE_LOADING_MESSAGES]
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = q[i]!
    q[i] = q[j]!
    q[j] = a
  }
  return q
}

function stopRouteLoadingMessageCycle(): void {
  if (routeLoadingMessageInterval != null) {
    clearInterval(routeLoadingMessageInterval)
    routeLoadingMessageInterval = null
  }
}

function startRouteLoadingMessageCycle(): void {
  stopRouteLoadingMessageCycle()
  const textEl = routeLoadingOverlayEl?.querySelector<HTMLElement>('.atlas-dashboard-route-loading__text')
  if (!textEl) return

  let queue = shuffleRouteLoadingMessages()
  let qi = 0
  textEl.textContent = queue[qi] ?? ''

  routeLoadingMessageInterval = window.setInterval(() => {
    qi++
    if (qi >= queue.length) {
      const lastShown = queue[queue.length - 1]
      queue = shuffleRouteLoadingMessages()
      if (queue.length > 1 && queue[0] === lastShown) {
        const swapWith = queue.findIndex((m, i) => i > 0 && m !== lastShown)
        if (swapWith > 0) {
          const tmp = queue[0]!
          queue[0] = queue[swapWith]!
          queue[swapWith] = tmp
        }
      }
      qi = 0
    }
    textEl.textContent = queue[qi] ?? ''
  }, ROUTE_LOADING_MESSAGE_MS)
}

function ensureRouteLoadingOverlay(map: L.Map): HTMLElement {
  const host = map.getContainer()
  const parent = host.parentElement
  if (!parent) {
    return document.createElement('div')
  }
  if (
    routeLoadingOverlayEl &&
    routeLoadingOverlayEl.isConnected &&
    routeLoadingOverlayEl.parentElement === parent
  ) {
    return routeLoadingOverlayEl
  }
  routeLoadingOverlayEl?.remove()
  const el = document.createElement('div')
  el.className = 'atlas-dashboard-route-loading'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'off')
  el.setAttribute('aria-label', 'Calculating route, please wait.')
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `
    <div class="atlas-dashboard-route-loading__panel">
      <span class="material-symbols-outlined atlas-dashboard-route-loading__spinner" aria-hidden="true">progress_activity</span>
      <p class="atlas-dashboard-route-loading__text">Calculating shortest route.</p>
    </div>`
  parent.appendChild(el)
  routeLoadingOverlayEl = el
  return el
}

function showDashboardRouteLoading(map: L.Map): void {
  const el = ensureRouteLoadingOverlay(map)
  el.classList.add('atlas-dashboard-route-loading--visible')
  el.setAttribute('aria-hidden', 'false')
  startRouteLoadingMessageCycle()
}

function hideDashboardRouteLoading(): void {
  stopRouteLoadingMessageCycle()
  routeLoadingOverlayEl?.classList.remove('atlas-dashboard-route-loading--visible')
  routeLoadingOverlayEl?.setAttribute('aria-hidden', 'true')
}

function destroyRouteLoadingOverlay(): void {
  stopRouteLoadingMessageCycle()
  routeLoadingOverlayEl?.remove()
  routeLoadingOverlayEl = null
}

export function clearDashboardCanvassRoute(): void {
  routeAnimToken++
  routeLayerGroup?.clearLayers()
  routePulseMarker = null
  hideDashboardRouteLoading()
  notifyRouteEstimate(null)
  canvassRoutePolylineActive = false
  lastCanvassRouteRecalc = null
}

function hasDistrictIndexHint(startDistrictIndex?: number): startDistrictIndex is number {
  return (
    startDistrictIndex != null &&
    Number.isInteger(startDistrictIndex) &&
    startDistrictIndex >= 0 &&
    startDistrictIndex < representativeDistrictMapCentroids.length
  )
}

function districtIndexFromSectorLabel(sectorLabel: string): number | null {
  const m = sectorLabel.match(/District\s+(\d+)/i)
  if (!m) return null
  const idx = Number(m[1]) - 1
  if (!Number.isFinite(idx)) return null
  if (idx < 0 || idx >= representativeDistrictMapCentroids.length) return null
  return idx
}

function readActiveRouteDistrictIndex(): number | null {
  if (!canvassRoutePolylineActive || !lastCanvassRouteRecalc) return null
  if (hasDistrictIndexHint(lastCanvassRouteRecalc.startDistrictIndex)) {
    return lastCanvassRouteRecalc.startDistrictIndex
  }
  return districtIndexFromSectorLabel(readDashboardSectorSelection())
}

function getCanvassRoutePinsRaw(startDistrictIndex: number | undefined): DelawareHousePin[] {
  const useDistrict = hasDistrictIndexHint(startDistrictIndex)
  return useDistrict
    ? delawareVerifiedHousePins.filter(
        (p) => houseDistrictIndexAtLatLng(p.lat, p.lng) === startDistrictIndex,
      )
    : getDelawareHousePinsForDashboardSector(readDashboardSectorSelection())
}

function getCanvassRoutePinsEligible(startDistrictIndex: number | undefined): DelawareHousePin[] {
  return getCanvassRoutePinsRaw(startDistrictIndex).filter((p) => !routeExcludedVoterIds.has(p.voterId))
}

/** Driving directions (OSRM) when ≤26 stops; otherwise straight segments. Animated polyline + pulse. */
export async function runDashboardCanvassRoute(
  startVoterId?: string,
  startDistrictIndex?: number,
  opts?: { resetExcludedPins?: boolean },
): Promise<void> {
  const map = activeDashboardMap
  if (!map || !routeLayerGroup) return
  const resetExcludedPins = opts?.resetExcludedPins === true
  if (resetExcludedPins) routeExcludedVoterIds = new Set()

  canvassRoutePrepare?.(startVoterId, startDistrictIndex)

  clearDashboardCanvassRoute()
  const myToken = routeAnimToken

  map.closePopup()

  const hasDistrictHint = hasDistrictIndexHint(startDistrictIndex)
  const pins = getCanvassRoutePinsEligible(startDistrictIndex)
  if (pins.length < 2) return

  const startPin =
    (startVoterId ? pins.find((p) => p.voterId === startVoterId) : undefined) ?? pins[0]
  const ordered = orderPinsNearestNeighbor(pins, startPin)
  const waypoints: L.LatLngTuple[] = ordered.map((p) => [p.lat, p.lng])

  if (map.getZoom() <= DISTRICT_GROUPING_MAX_ZOOM) {
    map.setZoom(DISTRICT_GROUPING_MAX_ZOOM + 1)
  }

  if (myToken !== routeAnimToken) return

  const polylineOptions: L.PolylineOptions = {
    color: '#c8102e',
    weight: 6,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
    className: 'atlas-dashboard-route-polyline',
    pane: ATLAS_ROUTE_PANE,
  }

  if (waypoints.length <= OSRM_MAX_WAYPOINTS) {
    showDashboardRouteLoading(map)
    try {
      try {
        const bounds = L.latLngBounds(waypoints)
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 17, animate: true })
      } catch {
        /* ignore empty bounds */
      }
      map.invalidateSize()

      const osrm = await fetchOsrmDrivingRoute(waypoints)
      if (myToken !== routeAnimToken) return

      const pathLatLngs: L.LatLngTuple[] = osrm?.path ?? waypoints
      const durationSeconds = osrm?.durationSeconds ?? estimateDriveSecondsFromPath(pathLatLngs)
      const line = L.polyline(pathLatLngs, polylineOptions)
      line.addTo(routeLayerGroup)
      line.bringToFront()
      addRouteStartMarker(pathLatLngs)

      try {
        map.fitBounds(line.getBounds(), { padding: [52, 52], maxZoom: 17, animate: true })
      } catch {
        /* ignore empty bounds */
      }
      map.invalidateSize()
      animatePulseAlongRoute(pathLatLngs, ROUTE_PULSE_MS, myToken)
      if (myToken === routeAnimToken) {
        notifyRouteEstimate(durationSeconds)
        lastCanvassRouteRecalc = {
          startVoterId: ordered[0]!.voterId,
          startDistrictIndex: hasDistrictHint ? startDistrictIndex : undefined,
        }
        canvassRoutePolylineActive = true
      }
    } finally {
      if (myToken === routeAnimToken) hideDashboardRouteLoading()
    }
  } else {
    const pathLatLngs: L.LatLngTuple[] = waypoints
    const durationSeconds = estimateDriveSecondsFromPath(pathLatLngs)
    const line = L.polyline(pathLatLngs, polylineOptions)
    line.addTo(routeLayerGroup)
    line.bringToFront()
    addRouteStartMarker(pathLatLngs)

    try {
      map.fitBounds(line.getBounds(), { padding: [52, 52], maxZoom: 17, animate: true })
    } catch {
      /* ignore empty bounds */
    }

    map.invalidateSize()
    animatePulseAlongRoute(pathLatLngs, ROUTE_PULSE_MS, myToken)
    if (myToken === routeAnimToken) {
      notifyRouteEstimate(durationSeconds)
      lastCanvassRouteRecalc = {
        startVoterId: ordered[0]!.voterId,
        startDistrictIndex: hasDistrictHint ? startDistrictIndex : undefined,
      }
      canvassRoutePolylineActive = true
    }
  }
}

/** Call after dashboard layout changes (e.g. collapsible panels) so tiles and size stay correct. */
export function invalidateDashboardMapSize(): void {
  const map = activeDashboardMap
  if (!map) return
  requestAnimationFrame(() => {
    map.invalidateSize()
  })
}

export function unmountDashboardMap(): void {
  const map = activeDashboardMap
  if (map) {
    const c = map.getCenter()
    try {
      const sector = sessionStorage.getItem(DASHBOARD_SECTOR_STORAGE_KEY) ?? dashboardStats.sector
      persistDashboardMapView(sector, c.lat, c.lng, map.getZoom())
    } catch {
      persistDashboardMapView(dashboardStats.sector, c.lat, c.lng, map.getZoom())
    }
  }
  teardown?.()
  teardown = null
  activeDashboardMap = null
}

export function focusDashboardMapOnRepresentativeDistrict(districtIndex: number): void {
  const map = activeDashboardMap
  if (!map) return
  const c = representativeDistrictMapCentroids[districtIndex]
  if (!c) return
  map.flyTo([c.lat, c.lng], REPRESENTATIVE_DISTRICT_FOCUS_ZOOM, { duration: 0.75 })
}

/** Fly map to a sector label (statewide = default center, or representative district N). */
export function flyDashboardMapForSectorLabel(sectorLabel: string): void {
  const map = activeDashboardMap
  if (!map) return
  const m = sectorLabel.match(/District\s+(\d+)/i)
  if (!m) {
    const { center, zoom } = dashboardMapConfig
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.65 })
    return
  }
  const idx = Number(m[1]) - 1
  if (idx >= 0 && idx < representativeDistrictMapCentroids.length) {
    focusDashboardMapOnRepresentativeDistrict(idx)
  }
}

export function mountDashboardMap(root: HTMLElement): void {
  unmountDashboardMap()

  const el = root.querySelector<HTMLElement>('#atlas-dashboard-map')
  if (!el) return

  const ac = new AbortController()
  const { signal } = ac

  const { center, zoom } = dashboardMapConfig
  const sectorKey = readDashboardSectorSelection()

  const persisted = readPersistedDashboardMapView()
  let initialCenter: L.LatLngExpression = [center.lat, center.lng]
  let initialZoom = zoom
  let restorePreviousView = false
  if (
    persisted &&
    persisted.sector === sectorKey &&
    persisted.zoom >= 1 &&
    persisted.zoom <= 22
  ) {
    initialCenter = [persisted.lat, persisted.lng]
    initialZoom = persisted.zoom
    restorePreviousView = true
  }

  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
  }).setView(initialCenter, initialZoom)
  activeDashboardMap = map

  if (!map.getPane(ATLAS_ROUTE_PANE)) {
    const rp = map.createPane(ATLAS_ROUTE_PANE)
    rp.style.zIndex = '650'
  }

  routeLayerGroup = L.layerGroup().addTo(map)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map)

  const individualPinsLayer = L.layerGroup()
  const groupedDistrictLayer = L.layerGroup()
  const pinLayers: L.Layer[] = []
  const districtBuckets = new Map<number, typeof delawareVerifiedHousePins>()
  for (const pin of delawareVerifiedHousePins) {
    const marker = L.marker([pin.lat, pin.lng], {
      icon: tacticalDivIcon(pin.tag),
    })
    marker.addTo(individualPinsLayer)
    pinLayers.push(marker)
    marker.bindPopup(tacticalPinPopupHtml(pin), {
      className: tacticalPinPopupClassName(pin),
      closeButton: true,
    })
    marker.on('popupopen', () => {
      marker.setPopupContent(tacticalPinPopupHtml(pin))
    })

    const districtIndex = houseDistrictIndexAtLatLng(pin.lat, pin.lng)
    const bucket = districtBuckets.get(districtIndex)
    if (bucket) {
      bucket.push(pin)
    } else {
      districtBuckets.set(districtIndex, [pin])
    }
  }

  for (const [districtIndex, pins] of districtBuckets) {
    const centroid = representativeDistrictMapCentroids[districtIndex]
    const byTag = pins.reduce<Record<string, number>>((acc, pin) => {
      acc[pin.tag] = (acc[pin.tag] ?? 0) + 1
      return acc
    }, {})
    const dominantTag = Object.entries(byTag).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'REP'
    const color = PIN_COLORS[dominantTag] ?? '#4e5d86'
    const districtMarker = L.marker([centroid.lat, centroid.lng], {
      icon: districtDivIcon(pins.length, color),
    })
    const breakdown = Object.entries(byTag)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => `${tag}: ${count}`)
      .join(' • ')
    districtMarker.bindTooltip(
      `<div class="atlas-map-popup" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d;min-width:190px"><p style="font-weight:700;margin:0 0 6px">Representative District ${districtIndex + 1}</p><p style="margin:0 0 4px">Pins grouped: ${pins.length}</p><p style="margin:0;color:#3f4446">${breakdown}</p></div>`,
      { className: 'atlas-map-tooltip-wrap', direction: 'top', opacity: 1 },
    )
    districtMarker.on('click', () => {
      focusDashboardMapOnRepresentativeDistrict(districtIndex)
    })
    districtMarker.addTo(groupedDistrictLayer)
  }

  const syncPinLayerVisibility = (): void => {
    if (map.getZoom() <= DISTRICT_GROUPING_MAX_ZOOM) {
      if (map.hasLayer(individualPinsLayer)) map.removeLayer(individualPinsLayer)
      if (!map.hasLayer(groupedDistrictLayer)) groupedDistrictLayer.addTo(map)
      return
    }
    if (map.hasLayer(groupedDistrictLayer)) map.removeLayer(groupedDistrictLayer)
    if (!map.hasLayer(individualPinsLayer)) individualPinsLayer.addTo(map)
  }

  const hasRepresentativeDistrictSelection = isRepresentativeDistrictSector(sectorKey)
  if (!restorePreviousView && !hasRepresentativeDistrictSelection && pinLayers.length > 0) {
    map.fitBounds(L.featureGroup(pinLayers).getBounds(), { padding: [28, 28], maxZoom: 11 })
  }
  if (!restorePreviousView && hasRepresentativeDistrictSelection) {
    flyDashboardMapForSectorLabel(sectorKey)
  }
  syncPinLayerVisibility()
  map.on('zoomend', syncPinLayerVisibility)

  root.querySelector<HTMLButtonElement>('[data-map-zoom="in"]')?.addEventListener(
    'click',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      map.zoomIn()
    },
    { signal },
  )
  root.querySelector<HTMLButtonElement>('[data-map-zoom="out"]')?.addEventListener(
    'click',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      map.zoomOut()
    },
    { signal },
  )
  let userDot: L.CircleMarker | null = null

  const onLocateSuccess = (e: L.LocationEvent): void => {
    const ll = e.latlng
    if (userDot) {
      map.removeLayer(userDot)
      userDot = null
    }
    userDot = L.circleMarker(ll, {
      radius: 8,
      color: '#9e001f',
      fillColor: '#c8102e',
      fillOpacity: 0.35,
      weight: 2,
    }).addTo(map)
    map.flyTo(ll, Math.max(map.getZoom(), 16), { duration: 0.7 })
  }

  const onLocateError = (): void => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 })
  }

  // Leaflet popup containers stop click propagation by default.
  // Capture route-button clicks inside the map subtree before Leaflet cancels bubbling.
  root.addEventListener(
    'click',
    (e) => {
      const removeBtn = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-dashboard-route-remove]',
      )
      if (removeBtn && el.contains(removeBtn)) {
        e.preventDefault()
        e.stopPropagation()
        const voterId = removeBtn.dataset.dashboardRouteRemove?.trim()
        if (!voterId) return
        addRouteExcludedVoterId(voterId)
        map.closePopup()
        if (canvassRoutePolylineActive && lastCanvassRouteRecalc) {
          const remaining = getCanvassRoutePinsEligible(lastCanvassRouteRecalc.startDistrictIndex)
          if (remaining.length < 2) {
            clearDashboardCanvassRoute()
          } else {
            void runDashboardCanvassRoute(
              lastCanvassRouteRecalc.startVoterId,
              lastCanvassRouteRecalc.startDistrictIndex,
            )
          }
        }
        return
      }

      const restoreBtn = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-dashboard-route-restore]',
      )
      if (restoreBtn && el.contains(restoreBtn)) {
        e.preventDefault()
        e.stopPropagation()
        const voterId = restoreBtn.dataset.dashboardRouteRestore?.trim()
        if (!voterId) return
        removeRouteExcludedVoterId(voterId)
        map.closePopup()
        if (canvassRoutePolylineActive && lastCanvassRouteRecalc) {
          void runDashboardCanvassRoute(
            lastCanvassRouteRecalc.startVoterId,
            lastCanvassRouteRecalc.startDistrictIndex,
          )
        }
        return
      }

      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dashboard-route]')
      if (!btn) return
      if (!el.contains(btn)) return
      e.preventDefault()
      e.stopPropagation()
      const voterId = btn.dataset.dashboardRoute?.trim()
      const districtRaw = btn.dataset.dashboardRouteDistrict
      const districtIndex =
        districtRaw != null && districtRaw !== '' && Number.isFinite(Number(districtRaw))
          ? Number(districtRaw)
          : undefined
      void runDashboardCanvassRoute(voterId || undefined, districtIndex, { resetExcludedPins: true })
    },
    { signal, capture: true },
  )

  root.querySelector<HTMLButtonElement>('[data-map-locate]')?.addEventListener(
    'click',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      map.locate({ setView: false, watch: false, maxZoom: 17, enableHighAccuracy: true })
    },
    { signal },
  )
  map.on('locationfound', onLocateSuccess)
  map.on('locationerror', onLocateError)

  const onResize = (): void => {
    map.invalidateSize()
  }
  window.addEventListener('resize', onResize, { signal })
  requestAnimationFrame(() => {
    map.invalidateSize()
  })

  teardown = () => {
    ac.abort()
    routeAnimToken++
    routeLayerGroup?.clearLayers()
    routePulseMarker = null
    routeLayerGroup = null
    destroyRouteLoadingOverlay()
    notifyRouteEstimate(null)
    canvassRoutePolylineActive = false
    lastCanvassRouteRecalc = null
    map.off('locationfound', onLocateSuccess)
    map.off('locationerror', onLocateError)
    map.off('zoomend', syncPinLayerVisibility)
    map.remove()
  }
}
