import * as L from 'leaflet'
import {
  DASHBOARD_SECTOR_STORAGE_KEY,
  dashboardMapConfig,
  dashboardStats,
  delawareVerifiedHousePins,
  getVoter,
  readDashboardSectorSelection,
  representativeDistrictMapCentroids,
  type DelawareHousePin,
} from '../data'
import { cardAccent, priorityTargetBodyHtml } from '../views/priorityTargetMarkup'

const DASHBOARD_MAP_VIEW_STORAGE_KEY = 'atlas-dashboard-map-view'

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
  if (!v) {
    const safeAddr = pin.address
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<div class="atlas-map-popup"><p style="font-weight:700;margin:0 0 8px">${safeAddr}</p><p style="margin:0 0 10px;color:#3f4446;font-size:12px">No voter record for this pin.</p><a href="${voterFileHref}" style="color:#9e001f;font-weight:700;font-size:14px;text-decoration:underline;text-underline-offset:2px">Open voter file →</a></div>`
  }

  return `<div class="atlas-map-popup" style="font:500 13px/1.35 var(--font-body,Inter,sans-serif);color:#191c1d;min-width:260px">
    <article class="bg-surface-container-low p-4 flex flex-col ${cardAccent(v.party)} shadow-sm rounded-lg -m-1">
      ${priorityTargetBodyHtml(v)}
      <a href="#/voters/${v.id}" class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline mt-1 w-fit">
        Open voter file<span class="text-[0.92em] opacity-90" aria-hidden="true">→</span>
      </a>
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

function nearestRepresentativeDistrictIndex(lat: number, lng: number): number {
  let nearest = 0
  let minDistanceSq = Number.POSITIVE_INFINITY
  for (let i = 0; i < representativeDistrictMapCentroids.length; i++) {
    const c = representativeDistrictMapCentroids[i]
    const dLat = lat - c.lat
    const dLng = lng - c.lng
    const distanceSq = dLat * dLat + dLng * dLng
    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq
      nearest = i
    }
  }
  return nearest
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
      className: 'atlas-map-popup-wrap',
      closeButton: true,
    })

    const districtIndex = nearestRepresentativeDistrictIndex(pin.lat, pin.lng)
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

  if (!restorePreviousView && pinLayers.length > 0) {
    map.fitBounds(L.featureGroup(pinLayers).getBounds(), { padding: [28, 28], maxZoom: 11 })
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
    map.off('locationfound', onLocateSuccess)
    map.off('locationerror', onLocateError)
    map.off('zoomend', syncPinLayerVisibility)
    map.remove()
  }
}
