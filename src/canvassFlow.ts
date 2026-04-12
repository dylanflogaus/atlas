const STORAGE_KEY = 'atlas-canvass-flow-v1'

/** Cleared when a new tour starts so no stale toast appears on walk/0. */
export const WALK_SIM_ACHIEVEMENT_STORAGE_KEY = 'atlas-walk-sim-achievement-v1'

export interface CanvassFlowPayload {
  voterIds: string[]
  /** Stop index where the single route achievement should appear. */
  achievementRevealStopIndex: number | null
}

function pickAchievementRevealStopIndex(totalStops: number): number | null {
  if (totalStops <= 0) return null
  if (totalStops === 1) return 0
  if (totalStops === 2) return 1
  // Prefer not to show on first or last stop when possible.
  const min = 1
  const max = totalStops - 2
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function saveCanvassTourOrder(voterIds: string[]): void {
  try {
    const payload: CanvassFlowPayload = {
      voterIds,
      achievementRevealStopIndex: pickAchievementRevealStopIndex(voterIds.length),
    }
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
    const ids = (parsed as Record<string, unknown>).voterIds
    if (!Array.isArray(ids) || !ids.every((x): x is string => typeof x === 'string')) return null
    return ids.length ? ids : null
  } catch {
    return null
  }
}

/**
 * Returns true once for the planned stop index, then clears it so each route can
 * unlock at most one achievement.
 */
export function consumeCanvassAchievementRevealForStop(stopIndex: number): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return false
    const obj = parsed as Record<string, unknown>
    const ids = obj.voterIds
    if (!Array.isArray(ids) || !ids.every((x): x is string => typeof x === 'string')) return false
    const reveal = obj.achievementRevealStopIndex
    if (typeof reveal !== 'number' || !Number.isInteger(reveal) || reveal !== stopIndex) return false

    const payload: CanvassFlowPayload = {
      voterIds: ids,
      achievementRevealStopIndex: null,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
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
