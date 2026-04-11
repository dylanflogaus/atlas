const STORAGE_KEY = 'atlas-canvass-flow-v1'

/** Cleared when a new tour starts so no stale toast appears on walk/0. */
export const WALK_SIM_ACHIEVEMENT_STORAGE_KEY = 'atlas-walk-sim-achievement-v1'

export interface CanvassFlowPayload {
  voterIds: string[]
}

export function saveCanvassTourOrder(voterIds: string[]): void {
  try {
    const payload: CanvassFlowPayload = { voterIds }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    sessionStorage.removeItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
  } catch {
    /* private mode */
  }
}

export function readCanvassTourOrder(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || !('voterIds' in parsed)) return null
    const ids = (parsed as CanvassFlowPayload).voterIds
    if (!Array.isArray(ids) || !ids.every((x): x is string => typeof x === 'string')) return null
    return ids.length ? ids : null
  } catch {
    return null
  }
}

export function clearCanvassTourOrder(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(WALK_SIM_ACHIEVEMENT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
