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

async function fetchOsrmDrivingGeometry(latlngs: L.LatLngTuple[]): Promise<L.LatLngTuple[] | null> {
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
      const data = (await res.json()) as {
        routes?: { geometry?: { coordinates?: [number, number][] } }[]
      }
      const coords = data.routes?.[0]?.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) continue
      return coords.map((c) => [c[1], c[0]] as L.LatLngTuple)
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

function tacticalPinPopupHtml(pin: DelawareHousePin): string {
  const v = getVoter(pin.voterId)
  const voterFileHref = `#/voters/${encodeURIComponent(pin.voterId)}`
  const startRouteBtn = `<button type="button" data-dashboard-route="${pin.voterId.replace(/"/g, '&quot;')}" class="${START_ROUTE_POPUP_BTN_CLASS}">Start Route</button>`

  if (!v) {
    const safeAddr = pin.address
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<div class="atlas-map-popup atlas-map-popup-panel bg-surface-container-low p-4 rounded-lg" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d"><p style="font-weight:700;margin:0 0 8px">${safeAddr}</p><p style="margin:0 0 10px;color:#3f4446;font-size:12px">No voter record for this pin.</p><a href="${voterFileHref}" style="color:#9e001f;font-weight:700;font-size:14px;text-decoration:underline;text-underline-offset:2px">Open voter file →</a>${startRouteBtn}</div>`
  }

  return `<div class="atlas-map-popup" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d;min-width:260px">
    <article class="atlas-map-popup-card bg-surface-container-low p-4 flex flex-col ${cardAccent(v.party)} rounded-lg">
      ${priorityTargetBodyHtml(v)}
      <a href="#/voters/${v.id}" class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline mt-1 w-fit">
        Open voter file<span class="text-[0.92em] opacity-90" aria-hidden="true">→</span>
      </a>
      ${startRouteBtn}
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

export function clearDashboardCanvassRoute(): void {
  routeAnimToken++
  routeLayerGroup?.clearLayers()
  routePulseMarker = null
}

/** Driving directions (OSRM) when ≤26 stops; otherwise straight segments. Animated polyline + pulse. */
export async function runDashboardCanvassRoute(startVoterId?: string): Promise<void> {
  const map = activeDashboardMap
  if (!map || !routeLayerGroup) return

  clearDashboardCanvassRoute()
  const myToken = routeAnimToken

  map.closePopup()

  const pins = getDelawareHousePinsForDashboardSector(readDashboardSectorSelection())
  if (pins.length < 2) return

  const startPin =
    (startVoterId ? pins.find((p) => p.voterId === startVoterId) : undefined) ?? pins[0]
  const ordered = orderPinsNearestNeighbor(pins, startPin)
  const waypoints: L.LatLngTuple[] = ordered.map((p) => [p.lat, p.lng])

  if (map.getZoom() <= DISTRICT_GROUPING_MAX_ZOOM) {
    map.setZoom(DISTRICT_GROUPING_MAX_ZOOM + 1)
  }

  // Never block first paint of the route on remote routing.
  let pathLatLngs: L.LatLngTuple[] = waypoints

  if (myToken !== routeAnimToken) return

  const line = L.polyline(pathLatLngs, {
    color: '#c8102e',
    weight: 6,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
    className: 'atlas-dashboard-route-polyline',
    pane: ATLAS_ROUTE_PANE,
  })
  line.addTo(routeLayerGroup)
  line.bringToFront()

  try {
    map.fitBounds(line.getBounds(), { padding: [52, 52], maxZoom: 17, animate: true })
  } catch {
    /* ignore empty bounds */
  }

  map.invalidateSize()

  animatePulseAlongRoute(pathLatLngs, ROUTE_PULSE_MS, myToken)

  if (waypoints.length <= OSRM_MAX_WAYPOINTS) {
    void fetchOsrmDrivingGeometry(waypoints).then((osrmPath) => {
      if (!osrmPath || myToken !== routeAnimToken) return
      line.setLatLngs(osrmPath)
      line.bringToFront()
      animatePulseAlongRoute(osrmPath, ROUTE_PULSE_MS, myToken)
    })
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

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dashboard-route]')
      if (!btn) return
      if (!el.contains(btn)) return
      e.preventDefault()
      const voterId = btn.dataset.dashboardRoute?.trim()
      void runDashboardCanvassRoute(voterId || undefined)
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
    map.off('locationfound', onLocateSuccess)
    map.off('locationerror', onLocateError)
    map.off('zoomend', syncPinLayerVisibility)
    map.remove()
  }
}
