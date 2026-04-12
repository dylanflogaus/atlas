import { ballotChasers, getPriorityTargets } from '../data'

type AdminWindow = '24h' | '7d' | '30d'
type AdminRegion = 'all' | 'new-castle' | 'kent' | 'sussex'
type AdminRegionOnly = Exclude<AdminRegion, 'all'>
type AlertSeverity = 'critical' | 'watch' | 'info'

interface AdminViewState {
  window: AdminWindow
  region: AdminRegion
}

interface RegionBaseline {
  activeVolunteers: number
  assignedVolunteers: number
  doorsKnocked: number
  conversations: number
  ballotPlans: number
  donationRevenue: number
  adSpend: number
  retentionRate: number
  shiftsCovered: number
  shiftsPlanned: number
  undecidedUniverse: number
  noContactRate: number
  dataLagCases: number
}

interface ChannelBaseline {
  key: string
  label: string
  reached: number
  conversions: number
  spend: number
}

interface DistrictBaseline {
  district: string
  region: AdminRegionOnly
  goal: number
  contacts: number
  ballotPlans: number
  persuasionIndex: number
}

interface VolunteerBaseline {
  name: string
  region: AdminRegionOnly
  shifts: number
  contacts: number
  ballotPlans: number
  reliability: number
}

interface OperationBaseline {
  id: string
  title: string
  windowHint: AdminWindow | 'all'
  region: AdminRegion
  startLabel: string
  volunteersNeeded: number
  volunteersAssigned: number
}

interface AlertBaseline {
  id: string
  severity: AlertSeverity
  region: AdminRegion
  title: string
  detail: string
}

interface ChannelRow extends ChannelBaseline {
  conversionRate: number
  costPerConversion: number
}

interface DistrictRow {
  district: string
  contacts: number
  goal: number
  contactPace: number
  ballotPlans: number
  persuasionIndex: number
  risk: AlertSeverity
}

interface VolunteerRow {
  name: string
  shifts: number
  contacts: number
  ballotPlans: number
  conversionRate: number
  reliability: number
}

interface OperationRow {
  title: string
  startLabel: string
  volunteersNeeded: number
  volunteersAssigned: number
  fillRate: number
  status: AlertSeverity
}

interface AlertRow {
  severity: AlertSeverity
  title: string
  detail: string
}

interface AdminSnapshot {
  activeVolunteers: number
  assignedVolunteers: number
  doorsKnocked: number
  conversations: number
  conversationRate: number
  ballotPlans: number
  commitmentRate: number
  retentionRate: number
  persuasionLift: number
  donationRevenue: number
  adSpend: number
  burnPerDay: number
  shiftsCovered: number
  shiftsPlanned: number
  undecidedUniverse: number
  noContactRate: number
  dataLagCases: number
  channelRows: ChannelRow[]
  districtRows: DistrictRow[]
  volunteerRows: VolunteerRow[]
  operations: OperationRow[]
  alerts: AlertRow[]
  recommendations: string[]
}

const ADMIN_STATE_STORAGE_KEY = 'atlas-admin-dashboard-state-v1'
const NUMBER_FMT = new Intl.NumberFormat('en-US')
const COMPACT_FMT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const CURRENCY_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const WINDOW_LABEL: Record<AdminWindow, string> = {
  '24h': 'Last 24h',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

const WINDOW_SCALE: Record<AdminWindow, number> = {
  '24h': 0.2,
  '7d': 1,
  '30d': 4.15,
}

const WINDOW_GOAL_SCALE: Record<AdminWindow, number> = {
  '24h': 0.22,
  '7d': 1,
  '30d': 4.05,
}

const WINDOW_DAYS: Record<AdminWindow, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
}

const REGION_LABEL: Record<AdminRegion, string> = {
  all: 'Statewide',
  'new-castle': 'New Castle',
  kent: 'Kent',
  sussex: 'Sussex',
}

const REGION_BASELINES: Record<AdminRegionOnly, RegionBaseline> = {
  'new-castle': {
    activeVolunteers: 146,
    assignedVolunteers: 178,
    doorsKnocked: 3320,
    conversations: 1284,
    ballotPlans: 486,
    donationRevenue: 36240,
    adSpend: 20890,
    retentionRate: 82,
    shiftsCovered: 118,
    shiftsPlanned: 134,
    undecidedUniverse: 16800,
    noContactRate: 0.31,
    dataLagCases: 42,
  },
  kent: {
    activeVolunteers: 89,
    assignedVolunteers: 104,
    doorsKnocked: 1890,
    conversations: 702,
    ballotPlans: 251,
    donationRevenue: 21460,
    adSpend: 14200,
    retentionRate: 79,
    shiftsCovered: 71,
    shiftsPlanned: 82,
    undecidedUniverse: 9800,
    noContactRate: 0.34,
    dataLagCases: 29,
  },
  sussex: {
    activeVolunteers: 102,
    assignedVolunteers: 128,
    doorsKnocked: 2265,
    conversations: 774,
    ballotPlans: 265,
    donationRevenue: 25780,
    adSpend: 16740,
    retentionRate: 76,
    shiftsCovered: 81,
    shiftsPlanned: 97,
    undecidedUniverse: 11250,
    noContactRate: 0.36,
    dataLagCases: 35,
  },
}

const CHANNEL_BASELINES: Record<AdminRegionOnly, ChannelBaseline[]> = {
  'new-castle': [
    { key: 'door', label: 'Door-to-door canvass', reached: 1720, conversions: 424, spend: 8060 },
    { key: 'phone', label: 'Volunteer phone bank', reached: 1040, conversions: 214, spend: 3620 },
    { key: 'sms', label: 'Peer-to-peer SMS', reached: 2980, conversions: 342, spend: 4310 },
    { key: 'rel', label: 'Relational organizing', reached: 620, conversions: 189, spend: 1290 },
  ],
  kent: [
    { key: 'door', label: 'Door-to-door canvass', reached: 1010, conversions: 238, spend: 5120 },
    { key: 'phone', label: 'Volunteer phone bank', reached: 760, conversions: 161, spend: 2810 },
    { key: 'sms', label: 'Peer-to-peer SMS', reached: 1820, conversions: 207, spend: 2770 },
    { key: 'rel', label: 'Relational organizing', reached: 420, conversions: 121, spend: 970 },
  ],
  sussex: [
    { key: 'door', label: 'Door-to-door canvass', reached: 1140, conversions: 252, spend: 5660 },
    { key: 'phone', label: 'Volunteer phone bank', reached: 810, conversions: 146, spend: 3140 },
    { key: 'sms', label: 'Peer-to-peer SMS', reached: 1940, conversions: 194, spend: 3010 },
    { key: 'rel', label: 'Relational organizing', reached: 460, conversions: 112, spend: 1060 },
  ],
}

const DISTRICT_BASELINES: DistrictBaseline[] = [
  { district: 'Wilmington East — HD 03', region: 'new-castle', goal: 720, contacts: 548, ballotPlans: 181, persuasionIndex: 67 },
  { district: 'Brandywine Arc — HD 07', region: 'new-castle', goal: 640, contacts: 421, ballotPlans: 129, persuasionIndex: 56 },
  { district: 'Middletown South — HD 08', region: 'new-castle', goal: 590, contacts: 444, ballotPlans: 152, persuasionIndex: 63 },
  { district: 'Dover Core — HD 28', region: 'kent', goal: 520, contacts: 367, ballotPlans: 116, persuasionIndex: 58 },
  { district: 'Camden-Wyoming — HD 34', region: 'kent', goal: 480, contacts: 301, ballotPlans: 99, persuasionIndex: 52 },
  { district: 'Milford Belt — HD 36', region: 'kent', goal: 430, contacts: 287, ballotPlans: 86, persuasionIndex: 54 },
  { district: 'Georgetown Seat — HD 37', region: 'sussex', goal: 510, contacts: 318, ballotPlans: 102, persuasionIndex: 49 },
  { district: 'Lewes Coast — HD 20', region: 'sussex', goal: 470, contacts: 333, ballotPlans: 117, persuasionIndex: 61 },
  { district: 'Seaford West — HD 39', region: 'sussex', goal: 445, contacts: 259, ballotPlans: 76, persuasionIndex: 45 },
]

const VOLUNTEER_BASELINES: VolunteerBaseline[] = [
  ...ballotChasers.map((chaser, idx): VolunteerBaseline => ({
    name: chaser.name,
    region: regionFromZone(chaser.zone),
    shifts: Math.max(4, Math.round(chaser.doorsGoal / 6)),
    contacts: chaser.doorsKnocked * 4 + idx * 7,
    ballotPlans: chaser.ballotsSecured * 4 + idx * 2,
    reliability: clamp(70 + chaser.streakDays * 2 + Math.round(chaser.doorsKnocked / 12), 68, 98),
  })),
  { name: 'Imani Carter', region: 'new-castle', shifts: 9, contacts: 172, ballotPlans: 57, reliability: 96 },
  { name: 'Logan Pierce', region: 'new-castle', shifts: 8, contacts: 165, ballotPlans: 49, reliability: 91 },
  { name: 'Priya Nandakumar', region: 'kent', shifts: 8, contacts: 149, ballotPlans: 46, reliability: 90 },
  { name: 'Caleb Monroe', region: 'kent', shifts: 7, contacts: 133, ballotPlans: 39, reliability: 87 },
  { name: 'Naomi Fletcher', region: 'sussex', shifts: 9, contacts: 158, ballotPlans: 52, reliability: 94 },
  { name: 'Victor Salazar', region: 'sussex', shifts: 8, contacts: 143, ballotPlans: 41, reliability: 86 },
]

const OPERATION_BASELINES: OperationBaseline[] = [
  {
    id: 'ops-standup',
    title: 'Morning volunteer stand-up',
    windowHint: '24h',
    region: 'all',
    startLabel: 'Today · 8:30 AM',
    volunteersNeeded: 42,
    volunteersAssigned: 35,
  },
  {
    id: 'ops-text-bank',
    title: 'High-priority chase text bank',
    windowHint: '24h',
    region: 'new-castle',
    startLabel: 'Today · 6:00 PM',
    volunteersNeeded: 28,
    volunteersAssigned: 24,
  },
  {
    id: 'ops-dover-blitz',
    title: 'Dover persuasion blitz',
    windowHint: '7d',
    region: 'kent',
    startLabel: 'Tue · 5:30 PM',
    volunteersNeeded: 36,
    volunteersAssigned: 29,
  },
  {
    id: 'ops-coastal-weekend',
    title: 'Coastal weekend knock launch',
    windowHint: '7d',
    region: 'sussex',
    startLabel: 'Sat · 9:00 AM',
    volunteersNeeded: 44,
    volunteersAssigned: 31,
  },
  {
    id: 'ops-early-vote',
    title: 'Early vote ride-share command',
    windowHint: '30d',
    region: 'all',
    startLabel: 'Oct 14 · 7:00 AM',
    volunteersNeeded: 96,
    volunteersAssigned: 71,
  },
  {
    id: 'ops-debate-watch',
    title: 'Post-debate rapid response',
    windowHint: '30d',
    region: 'all',
    startLabel: 'Oct 18 · 8:00 PM',
    volunteersNeeded: 52,
    volunteersAssigned: 38,
  },
]

const ALERT_BASELINES: AlertBaseline[] = [
  {
    id: 'alert-housing',
    severity: 'watch',
    region: 'new-castle',
    title: 'Address churn clustering in student blocks',
    detail: 'Dorm-adjacent precincts show elevated stale records; trigger verification knock flow.',
  },
  {
    id: 'alert-data-lag',
    severity: 'critical',
    region: 'all',
    title: 'Sync lag over 90 minutes in two canvass pods',
    detail: 'Offline queue is delaying commitment visibility in command view.',
  },
  {
    id: 'alert-call-coverage',
    severity: 'watch',
    region: 'kent',
    title: 'Phone-bank coverage below staffing target',
    detail: 'Evening dial block has 18% fewer volunteers than plan.',
  },
  {
    id: 'alert-coastal-weather',
    severity: 'info',
    region: 'sussex',
    title: 'Weather may suppress coastal walk rate',
    detail: 'Reassign extra relational outreach before Saturday launch.',
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function regionFromZone(zone: string): AdminRegionOnly {
  const z = zone.toLowerCase()
  if (z.includes('wilmington') || z.includes('newark')) return 'new-castle'
  if (z.includes('dover') || z.includes('central')) return 'kent'
  return 'sussex'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readState(): AdminViewState {
  const fallback: AdminViewState = { window: '7d', region: 'all' }
  try {
    const raw = sessionStorage.getItem(ADMIN_STATE_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<AdminViewState>
    if (!parsed || typeof parsed !== 'object') return fallback
    const nextWindow = parsed.window
    const nextRegion = parsed.region
    if (
      (nextWindow === '24h' || nextWindow === '7d' || nextWindow === '30d') &&
      (nextRegion === 'all' ||
        nextRegion === 'new-castle' ||
        nextRegion === 'kent' ||
        nextRegion === 'sussex')
    ) {
      return { window: nextWindow, region: nextRegion }
    }
  } catch {
    /* ignore */
  }
  return fallback
}

function writeState(state: AdminViewState): void {
  try {
    sessionStorage.setItem(ADMIN_STATE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function regionBaseline(region: AdminRegion): RegionBaseline {
  if (region !== 'all') return REGION_BASELINES[region]
  const rows = Object.values(REGION_BASELINES)
  const assigned = rows.reduce((sum, row) => sum + row.assignedVolunteers, 0)
  const weightedRetention = rows.reduce((sum, row) => sum + row.retentionRate * row.assignedVolunteers, 0)
  const weightedNoContact = rows.reduce((sum, row) => sum + row.noContactRate * row.assignedVolunteers, 0)
  return {
    activeVolunteers: rows.reduce((sum, row) => sum + row.activeVolunteers, 0),
    assignedVolunteers: assigned,
    doorsKnocked: rows.reduce((sum, row) => sum + row.doorsKnocked, 0),
    conversations: rows.reduce((sum, row) => sum + row.conversations, 0),
    ballotPlans: rows.reduce((sum, row) => sum + row.ballotPlans, 0),
    donationRevenue: rows.reduce((sum, row) => sum + row.donationRevenue, 0),
    adSpend: rows.reduce((sum, row) => sum + row.adSpend, 0),
    retentionRate: assigned > 0 ? weightedRetention / assigned : 0,
    shiftsCovered: rows.reduce((sum, row) => sum + row.shiftsCovered, 0),
    shiftsPlanned: rows.reduce((sum, row) => sum + row.shiftsPlanned, 0),
    undecidedUniverse: rows.reduce((sum, row) => sum + row.undecidedUniverse, 0),
    noContactRate: assigned > 0 ? weightedNoContact / assigned : 0,
    dataLagCases: rows.reduce((sum, row) => sum + row.dataLagCases, 0),
  }
}

function scaleCount(value: number, window: AdminWindow, extra = 1): number {
  return Math.max(0, Math.round(value * WINDOW_SCALE[window] * extra))
}

function goalScale(value: number, window: AdminWindow, extra = 1): number {
  return Math.max(1, Math.round(value * WINDOW_GOAL_SCALE[window] * extra))
}

function channelBaselineForRegion(region: AdminRegion): ChannelBaseline[] {
  if (region !== 'all') return CHANNEL_BASELINES[region]
  const merged = new Map<string, ChannelBaseline>()
  ;(['new-castle', 'kent', 'sussex'] as AdminRegionOnly[]).forEach((regionKey) => {
    CHANNEL_BASELINES[regionKey].forEach((row) => {
      const current = merged.get(row.key)
      if (!current) {
        merged.set(row.key, { ...row })
        return
      }
      current.reached += row.reached
      current.conversions += row.conversions
      current.spend += row.spend
    })
  })
  return [...merged.values()]
}

/** Skews channel mix so region/window swaps read clearly in the stacked bar. */
function channelVisualTilt(region: AdminRegion, window: AdminWindow, key: string): number {
  const tilt: Record<string, number> =
    region === 'all'
      ? { door: 1, phone: 1, sms: 1, rel: 1 }
      : region === 'new-castle'
        ? { door: 1, phone: 0.88, sms: 1.28, rel: 1.06 }
        : region === 'kent'
          ? { door: 1.22, phone: 1.08, sms: 0.78, rel: 0.92 }
          : { door: 1.12, phone: 1.2, sms: 0.82, rel: 0.86 }
  const windowTilt =
    window === '24h'
      ? { door: 1.14, phone: 1.02, sms: 0.72, rel: 1.1 }
      : window === '30d'
        ? { door: 0.94, phone: 1.06, sms: 1.18, rel: 1.04 }
        : { door: 1, phone: 1, sms: 1, rel: 1 }
  return (tilt[key] ?? 1) * (windowTilt[key as keyof typeof windowTilt] ?? 1)
}

function buildChannelRows(region: AdminRegion, window: AdminWindow): ChannelRow[] {
  const conversionAdj = window === '24h' ? 0.78 : window === '30d' ? 1.24 : 1
  return channelBaselineForRegion(region)
    .map((row) => {
      const reached = scaleCount(row.reached, window)
      const tilt = channelVisualTilt(region, window, row.key)
      const conversions = Math.min(
        reached,
        Math.max(0, Math.round(row.conversions * WINDOW_SCALE[window] * conversionAdj * tilt)),
      )
      const spend = Math.max(0, Math.round(row.spend * WINDOW_SCALE[window] * (window === '30d' ? 1.1 : 1)))
      const conversionRate = reached > 0 ? (conversions / reached) * 100 : 0
      return {
        ...row,
        reached,
        conversions,
        spend,
        conversionRate,
        costPerConversion: conversions > 0 ? spend / conversions : 0,
      }
    })
    .sort((a, b) => b.conversions - a.conversions)
}

function buildDistrictRows(region: AdminRegion, window: AdminWindow): DistrictRow[] {
  const baselines =
    region === 'all' ? DISTRICT_BASELINES : DISTRICT_BASELINES.filter((row) => row.region === region)
  const contactWindowBoost = window === '24h' ? 0.78 : window === '30d' ? 1.14 : 1.02
  return baselines
    .map((row) => {
      const goal = goalScale(row.goal, window)
      const regionBoost =
        region === 'all'
          ? row.region === 'new-castle'
            ? 1.02
            : row.region === 'kent'
              ? 0.96
              : 0.94
          : 1.06
      const contacts = Math.min(
        goal,
        scaleCount(row.contacts, window, contactWindowBoost * regionBoost),
      )
      const ballotPlans = Math.min(contacts, scaleCount(row.ballotPlans, window, 1.04))
      const contactPace = goal > 0 ? (contacts / goal) * 100 : 0
      const persuasionIndex = clamp(
        row.persuasionIndex + (window === '24h' ? 4 : window === '30d' ? -3.5 : 0),
        35,
        92,
      )
      const risk: AlertSeverity = contactPace < 58 ? 'critical' : contactPace < 76 ? 'watch' : 'info'
      return {
        district: row.district,
        contacts,
        goal,
        contactPace,
        ballotPlans,
        persuasionIndex,
        risk,
      }
    })
    .sort((a, b) => a.contactPace - b.contactPace)
}

function buildVolunteerRows(region: AdminRegion, window: AdminWindow): VolunteerRow[] {
  const set =
    region === 'all' ? VOLUNTEER_BASELINES : VOLUNTEER_BASELINES.filter((row) => row.region === region)
  return set
    .map((row) => {
      const shifts = Math.max(1, Math.round(row.shifts * (window === '24h' ? 0.35 : window === '30d' ? 3.8 : 1)))
      const contacts = scaleCount(row.contacts, window, 1.02)
      const ballotPlans = Math.min(contacts, scaleCount(row.ballotPlans, window, 1.05))
      const conversionRate = contacts > 0 ? (ballotPlans / contacts) * 100 : 0
      const reliability = clamp(row.reliability + (window === '24h' ? 1 : window === '30d' ? -2 : 0), 55, 99)
      return { name: row.name, shifts, contacts, ballotPlans, conversionRate, reliability }
    })
    .sort((a, b) => b.ballotPlans - a.ballotPlans || b.reliability - a.reliability)
    .slice(0, 7)
}

function buildOperations(region: AdminRegion, window: AdminWindow): OperationRow[] {
  const filtered = OPERATION_BASELINES.filter((item) => {
    const regionMatch = item.region === 'all' || region === 'all' || item.region === region
    const windowMatch = item.windowHint === 'all' || item.windowHint === window || window === '30d'
    return regionMatch && windowMatch
  })
  return filtered
    .map((item) => {
      const mod = window === '24h' ? 0.62 : window === '30d' ? 1.16 : 1
      const volunteersNeeded = Math.max(4, Math.round(item.volunteersNeeded * mod))
      const volunteersAssigned = Math.max(0, Math.round(item.volunteersAssigned * mod * 0.98))
      const fillRate = volunteersNeeded > 0 ? (volunteersAssigned / volunteersNeeded) * 100 : 0
      const status: AlertSeverity = fillRate < 68 ? 'critical' : fillRate < 86 ? 'watch' : 'info'
      return {
        title: item.title,
        startLabel: item.startLabel,
        volunteersNeeded,
        volunteersAssigned,
        fillRate,
        status,
      }
    })
    .slice(0, window === '24h' ? 3 : 5)
}

function buildAlerts(region: AdminRegion, snapshot: AdminSnapshot): AlertRow[] {
  const base = ALERT_BASELINES.filter((alert) => alert.region === 'all' || region === 'all' || alert.region === region)
    .map((alert) => ({ severity: alert.severity, title: alert.title, detail: alert.detail }))
  if (snapshot.noContactRate >= 34) {
    base.push({
      severity: 'critical',
      title: 'No-contact ratio crossed escalation threshold',
      detail: 'Run targeted revisit list and switch underperforming blocks to relational contacts.',
    })
  }
  if (snapshot.retentionRate <= 74) {
    base.push({
      severity: 'watch',
      title: 'Volunteer retention trend cooling',
      detail: 'Schedule mentor pairing and shorter shifts to reduce burnout before weekend surge.',
    })
  }
  if (snapshot.commitmentRate >= 39) {
    base.push({
      severity: 'info',
      title: 'Commitment conversion is outperforming benchmark',
      detail: 'Capture successful script variants and replicate in lower-performing districts.',
    })
  }
  return base.slice(0, 5)
}

function buildRecommendations(snapshot: AdminSnapshot, region: AdminRegion): string[] {
  const recs: string[] = []
  if (snapshot.commitmentRate < 34) {
    recs.push('Shift 15% of phone-bank volunteers into door follow-up windows between 5:30-7:30 PM.')
  } else {
    recs.push('Scale the best-performing persuasion script to all district pods before the next shift.')
  }
  if (snapshot.noContactRate > 33) {
    recs.push('Activate relational outreach in high no-contact blocks and pre-seed neighbor referrals.')
  }
  if (snapshot.burnPerDay > 8800) {
    recs.push('Pause low-yield paid acquisition creatives and reallocate budget toward volunteer-led channels.')
  } else {
    recs.push('Budget pacing is healthy; reserve spend for absentee-deadline countdown flight.')
  }
  const regionName = REGION_LABEL[region]
  recs.push(`Data confidence on ${regionName} remains simulation-grade; validate shifts with nightly data quality spot checks.`)
  return recs
}

function buildSnapshot(state: AdminViewState): AdminSnapshot {
  const base = regionBaseline(state.region)
  const doorsKnocked = scaleCount(base.doorsKnocked, state.window, state.window === '24h' ? 0.95 : 1)
  const conversations = Math.min(
    doorsKnocked,
    scaleCount(base.conversations, state.window, state.window === '30d' ? 1.04 : 1.01),
  )
  const ballotPlans = Math.min(conversations, scaleCount(base.ballotPlans, state.window, 1.05))
  const activeVolunteers = scaleCount(base.activeVolunteers, state.window, state.window === '24h' ? 0.72 : 1)
  const assignedVolunteers = scaleCount(base.assignedVolunteers, state.window, state.window === '24h' ? 0.67 : 1)
  const retentionRate = clamp(
    base.retentionRate + (state.window === '24h' ? 1.6 : state.window === '30d' ? -2.1 : 0),
    52,
    97,
  )
  const donationRevenue = Math.max(
    0,
    Math.round(base.donationRevenue * WINDOW_SCALE[state.window] * (state.window === '30d' ? 1.13 : 1)),
  )
  const adSpend = Math.max(
    0,
    Math.round(base.adSpend * WINDOW_SCALE[state.window] * (state.window === '24h' ? 0.88 : 1.02)),
  )
  const burnPerDay = adSpend / WINDOW_DAYS[state.window]
  const shiftsCovered = scaleCount(base.shiftsCovered, state.window, state.window === '24h' ? 0.44 : 1)
  const shiftsPlanned = goalScale(base.shiftsPlanned, state.window, state.window === '24h' ? 0.45 : 1)
  const undecidedUniverse = goalScale(base.undecidedUniverse, state.window, state.window === '24h' ? 0.1 : 1)
  const noContactRate = clamp(
    base.noContactRate * 100 + (state.window === '24h' ? -2.2 : state.window === '30d' ? 1.5 : 0),
    14,
    56,
  )
  const dataLagCases = scaleCount(base.dataLagCases, state.window, state.window === '24h' ? 0.58 : 1)
  const conversationRate = doorsKnocked > 0 ? (conversations / doorsKnocked) * 100 : 0
  const commitmentRate = conversations > 0 ? (ballotPlans / conversations) * 100 : 0
  const persuasionLift = clamp(
    (commitmentRate - 31.5) * 0.55 + (state.window === '24h' ? 0.8 : state.window === '30d' ? -0.6 : 0),
    -6,
    12,
  )

  const partialSnapshot: AdminSnapshot = {
    activeVolunteers,
    assignedVolunteers,
    doorsKnocked,
    conversations,
    conversationRate,
    ballotPlans,
    commitmentRate,
    retentionRate,
    persuasionLift,
    donationRevenue,
    adSpend,
    burnPerDay,
    shiftsCovered,
    shiftsPlanned,
    undecidedUniverse,
    noContactRate,
    dataLagCases,
    channelRows: buildChannelRows(state.region, state.window),
    districtRows: buildDistrictRows(state.region, state.window),
    volunteerRows: buildVolunteerRows(state.region, state.window),
    operations: [],
    alerts: [],
    recommendations: [],
  }

  partialSnapshot.operations = buildOperations(state.region, state.window)
  partialSnapshot.alerts = buildAlerts(state.region, partialSnapshot)
  partialSnapshot.recommendations = buildRecommendations(partialSnapshot, state.region)
  return partialSnapshot
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function riskClassName(level: AlertSeverity): string {
  if (level === 'critical') return 'admin-badge admin-badge--critical'
  if (level === 'watch') return 'admin-badge admin-badge--watch'
  return 'admin-badge admin-badge--info'
}

function revealDelay(i: number, step = 0.04, cap = 0.36): string {
  return `${Math.min(i * step, cap)}s`
}

function renderKpis(snapshot: AdminSnapshot): string {
  const cards: { label: string; value: string; meta: string }[] = [
    {
      label: 'Active volunteers',
      value: NUMBER_FMT.format(snapshot.activeVolunteers),
      meta: `${NUMBER_FMT.format(snapshot.assignedVolunteers)} assigned this window`,
    },
    {
      label: 'Doors knocked',
      value: COMPACT_FMT.format(snapshot.doorsKnocked),
      meta: `${formatPercent(snapshot.conversationRate)} conversation yield`,
    },
    {
      label: 'Ballot plans secured',
      value: NUMBER_FMT.format(snapshot.ballotPlans),
      meta: `${formatPercent(snapshot.commitmentRate)} commitment conversion`,
    },
    {
      label: 'Volunteer retention',
      value: formatPercent(snapshot.retentionRate),
      meta: `${NUMBER_FMT.format(snapshot.shiftsCovered)} / ${NUMBER_FMT.format(snapshot.shiftsPlanned)} shifts covered`,
    },
    {
      label: 'Small-dollar revenue',
      value: CURRENCY_FMT.format(snapshot.donationRevenue),
      meta: `Paid media spend ${CURRENCY_FMT.format(snapshot.adSpend)}`,
    },
    {
      label: 'Persuasion momentum',
      value: formatSignedPercent(snapshot.persuasionLift),
      meta: `${formatPercent(snapshot.noContactRate)} no-contact risk`,
    },
  ]
  return cards
    .map(
      (c, i) => `
    <article class="admin-kpi-card admin-reveal" style="--admin-reveal-delay:${revealDelay(i)}">
      <p class="admin-kpi-card__label">${c.label}</p>
      <p class="admin-kpi-card__value">${c.value}</p>
      <p class="admin-kpi-card__meta">${c.meta}</p>
    </article>`,
    )
    .join('')
}

const CHANNEL_BAR_GRADIENT: Record<string, string> = {
  door: 'linear-gradient(180deg, rgb(56 189 248) 0%, rgb(3 105 161) 100%)',
  phone: 'linear-gradient(180deg, rgb(167 139 250) 0%, rgb(109 40 217) 100%)',
  sms: 'linear-gradient(180deg, rgb(251 146 60) 0%, rgb(234 88 12) 100%)',
  rel: 'linear-gradient(180deg, rgb(74 222 128) 0%, rgb(21 128 61) 100%)',
}

const CHANNEL_CHART_SHORT: Record<string, string> = {
  door: 'Canvass',
  phone: 'Phones',
  sms: 'SMS',
  rel: 'Relational',
}

function velocityPointCount(window: AdminWindow): number {
  if (window === '24h') return 8
  if (window === '30d') return 24
  return 16
}

function velocityWaveSeed(window: AdminWindow, region: AdminRegion, doorsEnd: number): number {
  const regionSalt =
    region === 'all' ? 1.1 : region === 'new-castle' ? 2.3 : region === 'kent' ? 3.7 : 4.9
  const windowSalt = window === '24h' ? 0.4 : window === '30d' ? 2.1 : 1
  return doorsEnd * 0.0006 + regionSalt * 1.15 + windowSalt
}

function velocityDoorEasePow(window: AdminWindow, region: AdminRegion): number {
  const base = window === '24h' ? 0.88 : window === '30d' ? 1.72 : 1.38
  const reg =
    region === 'kent' ? 0.12 : region === 'sussex' ? 0.08 : region === 'new-castle' ? -0.06 : 0
  return base + reg
}

function velocityConvEasePow(window: AdminWindow, region: AdminRegion): number {
  const doorPow = velocityDoorEasePow(window, region)
  const lag =
    region === 'kent' ? 0.28 : region === 'sussex' ? 0.18 : region === 'new-castle' ? -0.04 : 0.06
  return doorPow + lag + (window === '24h' ? 0.14 : window === '30d' ? -0.08 : 0)
}

function buildVelocitySeries(
  snapshot: AdminSnapshot,
  window: AdminWindow,
  region: AdminRegion,
): { doors: number[]; conversations: number[] } {
  const doorsEnd = snapshot.doorsKnocked
  const convEnd = snapshot.conversations
  const doors: number[] = []
  const conversations: number[] = []
  const n = Math.max(2, velocityPointCount(window))
  const seed = velocityWaveSeed(window, region, doorsEnd)
  const doorPow = velocityDoorEasePow(window, region)
  const convPow = velocityConvEasePow(window, region)
  const waveAmp = window === '24h' ? 0.13 : window === '30d' ? 0.034 : 0.078
  const harmonic =
    window === '24h' ? 0.055 : window === '30d' ? 0.022 : 0.038
  const lateSurge =
    region === 'kent' ? 1.12 : region === 'sussex' ? 1.06 : region === 'new-castle' ? 1.02 : 1.04
  const flatHead = window === '24h' ? 0.22 : window === '30d' ? 0.06 : 0.1

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const headDamp = t < flatHead ? (t / flatHead) ** (window === '24h' ? 1.8 : 0.9) : 1
    const easeD = (1 - (1 - t) ** doorPow) * headDamp
    const surge = 1 + (lateSurge - 1) * t ** (window === '24h' ? 2.4 : 1.6)
    const wave =
      1 +
      waveAmp * Math.sin(i * 0.9 + seed) +
      harmonic * Math.sin(i * 2.05 + seed * 1.4 + (region === 'sussex' ? 0.9 : 0))
    doors.push(Math.max(0, Math.round(doorsEnd * easeD * wave * surge * (0.52 + 0.48 * t))))

    const easeC = 1 - (1 - t) ** convPow
    const convWave =
      1 +
      waveAmp * 0.85 * Math.sin(i * 0.88 + seed + 0.6) +
      harmonic * 0.7 * Math.sin(i * 1.95 + seed)
    const gap =
      1 +
      (window === '24h' ? 0.06 : window === '30d' ? -0.02 : 0.02) *
        Math.sin(Math.PI * t) *
        (region === 'kent' ? 1.25 : region === 'sussex' ? 1.1 : 1)
    conversations.push(
      Math.min(
        doors[i]!,
        Math.max(
          0,
          Math.round(convEnd * easeC * (0.48 + 0.52 * t) * convWave * gap),
        ),
      ),
    )
  }
  doors[n - 1] = doorsEnd
  conversations[n - 1] = convEnd
  return { doors, conversations }
}

function buildLinePath(
  values: number[],
  maxV: number,
  w: number,
  h: number,
  padL: number,
  padT: number,
  padR: number,
  padB: number,
): string {
  const iw = w - padL - padR
  const ih = h - padT - padB
  const n = values.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = padL + (i / Math.max(1, n - 1)) * iw
    const y = padT + ih - (values[i] / maxV) * ih
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

function buildAreaPath(
  values: number[],
  maxV: number,
  w: number,
  h: number,
  padL: number,
  padT: number,
  padR: number,
  padB: number,
): string {
  const line = buildLinePath(values, maxV, w, h, padL, padT, padR, padB)
  const iw = w - padL - padR
  const ih = h - padT - padB
  const y0 = padT + ih
  const x0 = padL
  const x1 = padL + iw
  return `${line} L${x1.toFixed(1)},${y0.toFixed(1)} L${x0.toFixed(1)},${y0.toFixed(1)} Z`
}

function shortDistrictLabel(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name
  return `${name.slice(0, maxLen - 1)}…`
}

function velocityWindowTickStart(window: AdminWindow): string {
  if (window === '24h') return '24h ago'
  if (window === '30d') return '30d ago'
  return '7d ago'
}

function renderVelocityChart(snapshot: AdminSnapshot, window: AdminWindow, region: AdminRegion): string {
  const { doors, conversations } = buildVelocitySeries(snapshot, window, region)
  const maxV = Math.max(1, ...doors, ...conversations) * 1.06
  const w = 420
  const h = 172
  const padL = 4
  const padT = 8
  const padR = 8
  const padB = 6
  const areaDoors = buildAreaPath(doors, maxV, w, h, padL, padT, padR, padB)
  const lineDoors = buildLinePath(doors, maxV, w, h, padL, padT, padR, padB)
  const lineConv = buildLinePath(conversations, maxV, w, h, padL, padT, padR, padB)
  const lastIdx = doors.length - 1
  const iw = w - padL - padR
  const ih = h - padT - padB
  const xLast = padL + iw
  const yD = padT + ih - (doors[lastIdx]! / maxV) * ih
  const yC = padT + ih - (conversations[lastIdx]! / maxV) * ih
  const tickStart = velocityWindowTickStart(window)

  return `
    <div class="admin-chart admin-chart--velocity">
      <div class="admin-chart__legend" aria-hidden="true">
        <span class="admin-chart__legend-item admin-chart__legend-item--doors"><i></i> Doors knocked</span>
        <span class="admin-chart__legend-item admin-chart__legend-item--conv"><i></i> Conversations</span>
      </div>
      <div class="admin-chart__clip">
        <svg class="admin-chart__svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cumulative doors and conversations across the selected window">
          <defs>
            <linearGradient id="adminVelArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgb(56 189 248)" stop-opacity="0.45" />
              <stop offset="100%" stop-color="rgb(15 23 42)" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="adminVelStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgb(125 211 252)" />
              <stop offset="100%" stop-color="rgb(14 165 233)" />
            </linearGradient>
            <filter id="adminVelGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g class="admin-chart__layer">
            <path d="${areaDoors}" fill="url(#adminVelArea)" />
            <path
              d="${lineDoors}"
              fill="none"
              stroke="url(#adminVelStroke)"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="${lineConv}"
              fill="none"
              stroke="rgb(251 191 36)"
              stroke-width="2.1"
              stroke-linecap="round"
              stroke-linejoin="round"
              filter="url(#adminVelGlow)"
            />
            <circle class="admin-chart__dot admin-chart__dot--doors" cx="${xLast.toFixed(1)}" cy="${yD.toFixed(1)}" r="4.5" />
            <circle class="admin-chart__dot admin-chart__dot--conv" cx="${xLast.toFixed(1)}" cy="${yC.toFixed(1)}" r="4.2" />
          </g>
        </svg>
      </div>
      <div class="admin-chart__ticks" aria-hidden="true">
        <span>${tickStart}</span>
        <span>Now</span>
      </div>
    </div>`
}

function renderChannelMixChart(snapshot: AdminSnapshot, state: AdminViewState): string {
  const rows = snapshot.channelRows
  const totalRaw = rows.reduce((sum, r) => sum + r.conversions, 0)
  const denom = Math.max(totalRaw, 1)
  const shares = rows.map((r) => (r.conversions / denom) * 100)
  const drift = 100 - shares.reduce((a, b) => a + b, 0)
  if (rows.length && Math.abs(drift) > 0.0001) {
    shares[rows.length - 1] = Math.max(0, shares[rows.length - 1] + drift)
  }
  const mix = rows
    .map((row, i) => {
      const bg = CHANNEL_BAR_GRADIENT[row.key] ?? CHANNEL_BAR_GRADIENT.door
      const label = CHANNEL_CHART_SHORT[row.key] ?? row.label
      const share = shares[i]!.toFixed(1)
      return `<span class="admin-channel-lift__seg" style="--lift-share:${shares[i]!.toFixed(3)}%;--lift-i:${i};background:${bg}" title="${escapeHtml(label)} · ${NUMBER_FMT.format(row.conversions)} commitments (${share}% of mix)"></span>`
    })
    .join('')
  const legend = rows
    .map((row, i) => {
      const bg = CHANNEL_BAR_GRADIENT[row.key] ?? CHANNEL_BAR_GRADIENT.door
      const name = escapeHtml(CHANNEL_CHART_SHORT[row.key] ?? row.label)
      const share = shares[i]!.toFixed(1)
      return `<li class="admin-channel-lift__row" style="--lift-i:${i}">
        <span class="admin-channel-lift__swatch" style="background:${bg}" aria-hidden="true"></span>
        <span class="admin-channel-lift__name">${name}</span>
        <span class="admin-channel-lift__stat">${NUMBER_FMT.format(row.conversions)} <span class="admin-channel-lift__stat-note">cmts</span></span>
        <span class="admin-channel-lift__share">${share}%</span>
        <span class="admin-channel-lift__conv">${formatPercent(row.conversionRate)} yield</span>
      </li>`
    })
    .join('')
  const scope = `${WINDOW_LABEL[state.window]} · ${REGION_LABEL[state.region]}`
  return `
    <div class="admin-channel-lift">
      <p class="admin-channel-lift__kicker">
        <span class="admin-channel-lift__total">${NUMBER_FMT.format(totalRaw)}</span>
        <span class="admin-channel-lift__kicker-label">commitments in channel mix · ${escapeHtml(scope)}</span>
      </p>
      <div class="admin-channel-lift__track" role="img" aria-label="Share of commitments by outreach program">${mix}</div>
      <ul class="admin-channel-lift__legend">${legend}</ul>
    </div>`
}

function renderDistrictPaceChart(snapshot: AdminSnapshot, state: AdminViewState): string {
  const sorted = [...snapshot.districtRows].sort((a, b) => b.contactPace - a.contactPace).slice(0, 6)
  const scope = `${WINDOW_LABEL[state.window]} · ${REGION_LABEL[state.region]}`
  return `
    <div class="admin-hbar-list" role="img" aria-label="District contact pace ranking · ${escapeHtml(scope)}">
      ${sorted
        .map(
          (row, i) => `
        <div class="admin-hbar">
          <span class="admin-hbar__label" title="${escapeHtml(row.district)}">${escapeHtml(shortDistrictLabel(row.district))}</span>
          <div class="admin-hbar__track">
            <span class="admin-hbar__fill" style="--w:${clamp(row.contactPace, 0, 100).toFixed(1)}%;--i:${i}"></span>
          </div>
          <span class="admin-hbar__pct">${formatPercent(row.contactPace)}</span>
        </div>`,
        )
        .join('')}
    </div>`
}

function renderAnalyticsCharts(snapshot: AdminSnapshot, state: AdminViewState): string {
  const scopeLine = `${WINDOW_LABEL[state.window]} · ${REGION_LABEL[state.region]}`
  return `
    <div class="admin-analytics-grid grid gap-4 xl:grid-cols-2">
      <article class="admin-panel admin-panel--chart p-4 admin-reveal" style="--admin-reveal-delay:0s">
        <div class="admin-panel__header">
          <h3>Field velocity</h3>
          <p>${escapeHtml(scopeLine)} · cumulative doors vs. conversations · ${formatPercent(snapshot.conversationRate)} yield</p>
        </div>
        ${renderVelocityChart(snapshot, state.window, state.region)}
      </article>
      <article class="admin-panel admin-panel--chart admin-panel--channel-lift p-4 admin-reveal" style="--admin-reveal-delay:0.06s">
        <div class="admin-panel__header">
          <h3>Channel lift</h3>
          <p>${escapeHtml(scopeLine)} · share of commitments · conversion yield by program</p>
        </div>
        ${renderChannelMixChart(snapshot, state)}
      </article>
      <article class="admin-panel admin-panel--chart admin-panel--chart-wide p-4 xl:col-span-2 admin-reveal" style="--admin-reveal-delay:0.11s">
        <div class="admin-panel__header">
          <h3>District pace leaders</h3>
          <p>${escapeHtml(scopeLine)} · top districts by contact pace · ${NUMBER_FMT.format(snapshot.ballotPlans)} ballot plans in view</p>
        </div>
        ${renderDistrictPaceChart(snapshot, state)}
      </article>
    </div>`
}

function renderPipeline(snapshot: AdminSnapshot): string {
  const recruited = Math.round(snapshot.assignedVolunteers * 1.34)
  const onboarded = Math.round(snapshot.assignedVolunteers * 1.08)
  const active = snapshot.activeVolunteers
  const captains = Math.max(3, Math.round(active * 0.17))
  const maxValue = Math.max(recruited, onboarded, active, captains, 1)
  const rows = [
    { label: 'Recruited', value: recruited },
    { label: 'Onboarded', value: onboarded },
    { label: 'Active this window', value: active },
    { label: 'Shift captains', value: captains },
  ]
  return rows
    .map(
      (row, i) => `
      <div class="admin-meter-row admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.045, 0.2)}">
        <div class="admin-meter-row__header">
          <span>${row.label}</span>
          <span>${NUMBER_FMT.format(row.value)}</span>
        </div>
        <div class="admin-meter">
          <span style="width:${((row.value / maxValue) * 100).toFixed(2)}%"></span>
        </div>
      </div>`,
    )
    .join('')
}

function renderChannels(snapshot: AdminSnapshot): string {
  const maxReached = Math.max(...snapshot.channelRows.map((row) => row.reached), 1)
  return snapshot.channelRows
    .map(
      (row, i) => `
      <article class="admin-channel-row admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.05, 0.25)}">
        <div class="admin-channel-row__top">
          <p class="admin-channel-row__label">${escapeHtml(row.label)}</p>
          <p class="admin-channel-row__stat">${NUMBER_FMT.format(row.conversions)} commitments</p>
        </div>
        <div class="admin-meter"><span style="width:${((row.reached / maxReached) * 100).toFixed(2)}%"></span></div>
        <p class="admin-channel-row__meta">
          Reach ${NUMBER_FMT.format(row.reached)} · Conv ${formatPercent(row.conversionRate)} · CPA ${CURRENCY_FMT.format(row.costPerConversion)}
        </p>
      </article>`,
    )
    .join('')
}

function renderDistrictRows(snapshot: AdminSnapshot): string {
  return snapshot.districtRows
    .map(
      (row, i) => `
      <tr class="admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.03, 0.32)}">
        <td class="admin-table__district">${escapeHtml(row.district)}</td>
        <td>${NUMBER_FMT.format(row.contacts)} / ${NUMBER_FMT.format(row.goal)}</td>
        <td>${NUMBER_FMT.format(row.ballotPlans)}</td>
        <td>${formatPercent(row.persuasionIndex)}</td>
        <td>
          <span class="${riskClassName(row.risk)}">${row.risk === 'critical' ? 'Critical' : row.risk === 'watch' ? 'Watch' : 'Stable'}</span>
        </td>
      </tr>`,
    )
    .join('')
}

function renderVolunteerRows(snapshot: AdminSnapshot): string {
  return snapshot.volunteerRows
    .map(
      (row, idx) => `
      <tr class="admin-reveal" style="--admin-reveal-delay:${revealDelay(idx, 0.03, 0.32)}">
        <td class="admin-table__district">
          <span class="admin-rank">${idx + 1}</span>
          ${escapeHtml(row.name)}
        </td>
        <td>${NUMBER_FMT.format(row.shifts)}</td>
        <td>${NUMBER_FMT.format(row.contacts)}</td>
        <td>${NUMBER_FMT.format(row.ballotPlans)}</td>
        <td>${formatPercent(row.conversionRate)}</td>
        <td>${row.reliability}</td>
      </tr>`,
    )
    .join('')
}

function renderOperations(snapshot: AdminSnapshot): string {
  return snapshot.operations
    .map(
      (op, i) => `
      <article class="admin-operation-card admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.055, 0.28)}">
        <p class="admin-operation-card__title">${escapeHtml(op.title)}</p>
        <p class="admin-operation-card__time">${escapeHtml(op.startLabel)}</p>
        <p class="admin-operation-card__meta">${NUMBER_FMT.format(op.volunteersAssigned)} / ${NUMBER_FMT.format(op.volunteersNeeded)} volunteers assigned</p>
        <div class="admin-meter"><span style="width:${clamp(op.fillRate, 0, 100).toFixed(2)}%"></span></div>
        <p class="admin-operation-card__status">
          <span class="${riskClassName(op.status)}">${op.status === 'critical' ? 'Needs staffing' : op.status === 'watch' ? 'Watchlist' : 'On track'}</span>
        </p>
      </article>`,
    )
    .join('')
}

function renderAlerts(snapshot: AdminSnapshot): string {
  return snapshot.alerts
    .map(
      (alert, i) => `
      <article class="admin-alert-card admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.06, 0.24)}">
        <div class="admin-alert-card__header">
          <span class="${riskClassName(alert.severity)}">${alert.severity === 'critical' ? 'Critical' : alert.severity === 'watch' ? 'Watch' : 'Info'}</span>
          <h4>${escapeHtml(alert.title)}</h4>
        </div>
        <p>${escapeHtml(alert.detail)}</p>
      </article>`,
    )
    .join('')
}

function renderRecommendations(snapshot: AdminSnapshot): string {
  return snapshot.recommendations
    .map(
      (item, i) => `
      <li class="admin-reveal" style="--admin-reveal-delay:${revealDelay(i, 0.05, 0.35)}">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_right_alt</span>
        <span>${escapeHtml(item)}</span>
      </li>`,
    )
    .join('')
}

function revealAdminChartsIfInViewport(root: HTMLElement): void {
  const charts = root.querySelector<HTMLElement>('[data-admin-charts]')
  if (!charts) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    charts.querySelectorAll<HTMLElement>('.admin-reveal').forEach((el) => el.classList.add('admin-reveal--visible'))
    return
  }
  const vh = window.innerHeight
  charts.querySelectorAll<HTMLElement>('.admin-reveal').forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.bottom > 0 && rect.top < vh) {
      el.classList.add('admin-reveal--visible')
    }
  })
}

function syncFilterButtons(root: HTMLElement, state: AdminViewState): void {
  root.querySelectorAll<HTMLButtonElement>('[data-admin-window-btn]').forEach((btn) => {
    const on = btn.dataset.adminWindowBtn === state.window
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    btn.classList.toggle('admin-filter-btn--active', on)
  })
  root.querySelectorAll<HTMLButtonElement>('[data-admin-region-btn]').forEach((btn) => {
    const on = btn.dataset.adminRegionBtn === state.region
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    btn.classList.toggle('admin-filter-btn--active', on)
  })
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const el = root.querySelector<HTMLElement>(selector)
  if (el) el.textContent = value
}

function syncDashboard(root: HTMLElement, state: AdminViewState): void {
  const snapshot = buildSnapshot(state)
  syncFilterButtons(root, state)
  setText(root, '[data-admin-window-label]', WINDOW_LABEL[state.window])
  setText(root, '[data-admin-region-label]', REGION_LABEL[state.region])
  setText(
    root,
    '[data-admin-generated-at]',
    new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  )

  const kpis = root.querySelector<HTMLElement>('[data-admin-kpis]')
  if (kpis) kpis.innerHTML = renderKpis(snapshot)
  const pipeline = root.querySelector<HTMLElement>('[data-admin-pipeline]')
  if (pipeline) pipeline.innerHTML = renderPipeline(snapshot)
  const channels = root.querySelector<HTMLElement>('[data-admin-channels]')
  if (channels) channels.innerHTML = renderChannels(snapshot)
  const districts = root.querySelector<HTMLElement>('[data-admin-district-rows]')
  if (districts) districts.innerHTML = renderDistrictRows(snapshot)
  const volunteers = root.querySelector<HTMLElement>('[data-admin-volunteer-rows]')
  if (volunteers) volunteers.innerHTML = renderVolunteerRows(snapshot)
  const operations = root.querySelector<HTMLElement>('[data-admin-operations]')
  if (operations) operations.innerHTML = renderOperations(snapshot)
  const alerts = root.querySelector<HTMLElement>('[data-admin-alerts]')
  if (alerts) alerts.innerHTML = renderAlerts(snapshot)
  const recommendations = root.querySelector<HTMLElement>('[data-admin-recommendations]')
  if (recommendations) recommendations.innerHTML = renderRecommendations(snapshot)
  const charts = root.querySelector<HTMLElement>('[data-admin-charts]')
  if (charts) {
    charts.innerHTML = renderAnalyticsCharts(snapshot, state)
    revealAdminChartsIfInViewport(root)
  }

  setText(root, '[data-admin-undecided]', NUMBER_FMT.format(snapshot.undecidedUniverse))
  setText(root, '[data-admin-burn]', CURRENCY_FMT.format(snapshot.burnPerDay))
  setText(root, '[data-admin-data-lag]', NUMBER_FMT.format(snapshot.dataLagCases))
}

function filterButton(label: string, dataAttr: string, value: string, active: boolean): string {
  return `<button type="button" class="admin-filter-btn ${active ? 'admin-filter-btn--active' : ''}" ${dataAttr}="${value}" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`
}

export function renderAdminDashboard(): string {
  const state = readState()
  const targetCount = getPriorityTargets().length
  return `
    <main class="admin-command-center min-h-[calc(100dvh-4rem)] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <section class="admin-hero admin-hero--compact rounded-2xl p-4 sm:p-5">
        <div class="admin-hero__grid" aria-hidden="true"></div>
        <div class="admin-hero__content">
          <p class="admin-overline admin-reveal" style="--admin-reveal-delay:0s">Administrator command center</p>
          <div class="admin-hero__headline-row admin-reveal" style="--admin-reveal-delay:0.06s">
            <h2>Volunteer campaign intelligence</h2>
            <span class="admin-chip">Campaign voter data</span>
          </div>
          <div class="admin-hero__meta admin-reveal" style="--admin-reveal-delay:0.12s">
            <span><span class="material-symbols-outlined" aria-hidden="true">shield_lock</span> Access level: Admin</span>
            <span><span class="material-symbols-outlined" aria-hidden="true">group</span> ${targetCount} priority households tracked</span>
            <span><span class="material-symbols-outlined" aria-hidden="true">schedule</span> Refreshed <span data-admin-generated-at>now</span></span>
          </div>
        </div>
      </section>

      <section class="admin-panel mt-2 p-3 admin-reveal" style="--admin-reveal-delay:0s">
        <div class="admin-filter-grid">
          <div>
            <p class="admin-section-label">Time window</p>
            <div class="admin-filter-row">
              ${filterButton('24h', 'data-admin-window-btn', '24h', state.window === '24h')}
              ${filterButton('7d', 'data-admin-window-btn', '7d', state.window === '7d')}
              ${filterButton('30d', 'data-admin-window-btn', '30d', state.window === '30d')}
            </div>
          </div>
          <div>
            <p class="admin-section-label">Region focus</p>
            <div class="admin-filter-row">
              ${filterButton('Statewide', 'data-admin-region-btn', 'all', state.region === 'all')}
              ${filterButton('New Castle', 'data-admin-region-btn', 'new-castle', state.region === 'new-castle')}
              ${filterButton('Kent', 'data-admin-region-btn', 'kent', state.region === 'kent')}
              ${filterButton('Sussex', 'data-admin-region-btn', 'sussex', state.region === 'sussex')}
            </div>
          </div>
        </div>
      </section>

      <section class="admin-charts-spotlight mt-3" data-admin-charts aria-label="Live analytics charts"></section>

      <section class="mt-4 grid gap-4 xl:grid-cols-3">
        <article class="admin-panel p-4 xl:col-span-2">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Executive metrics</h3>
            <p><span data-admin-window-label>${WINDOW_LABEL[state.window]}</span> · <span data-admin-region-label>${REGION_LABEL[state.region]}</span></p>
          </div>
          <div class="admin-kpi-grid" data-admin-kpis></div>
        </article>

        <article class="admin-panel p-4 admin-reveal" style="--admin-reveal-delay:0s">
          <div class="admin-panel__header">
            <h3>Strategic pulse</h3>
            <p>Fast-look command stats</p>
          </div>
          <dl class="admin-quick-pulse">
            <div>
              <dt>Undecided universe</dt>
              <dd data-admin-undecided>0</dd>
            </div>
            <div>
              <dt>Daily burn</dt>
              <dd data-admin-burn>$0</dd>
            </div>
            <div>
              <dt>Data lag cases</dt>
              <dd data-admin-data-lag>0</dd>
            </div>
          </dl>
          <p class="admin-footnote">Mirror this view with nightly voter-file QA before publishing strategic memos.</p>
        </article>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-2">
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Volunteer pipeline health</h3>
            <p>Recruitment through captain readiness</p>
          </div>
          <div data-admin-pipeline></div>
        </article>
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Channel effectiveness</h3>
            <p>Reach, conversion, and cost efficiency</p>
          </div>
          <div class="admin-channel-list" data-admin-channels></div>
        </article>
      </section>

      <section class="mt-4">
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>District performance board</h3>
            <p>Contact pace and persuasion pressure by district</p>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Contacts</th>
                  <th>Ballot plans</th>
                  <th>Persuasion index</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody data-admin-district-rows></tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-2">
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Volunteer leaderboard</h3>
            <p>Top field outputs from current filters</p>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table admin-table--compact">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Shifts</th>
                  <th>Contacts</th>
                  <th>Plans</th>
                  <th>Conv%</th>
                  <th>Reliability</th>
                </tr>
              </thead>
              <tbody data-admin-volunteer-rows></tbody>
            </table>
          </div>
        </article>
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Operations schedule</h3>
            <p>Upcoming execution blocks requiring staffing</p>
          </div>
          <div class="admin-operation-list" data-admin-operations></div>
        </article>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-2">
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Risk and alert queue</h3>
            <p>Highest-priority anomalies and blockers</p>
          </div>
          <div class="admin-alert-list" data-admin-alerts></div>
        </article>
        <article class="admin-panel p-4">
          <div class="admin-panel__header admin-reveal" style="--admin-reveal-delay:0s">
            <h3>Intelligent recommendations</h3>
            <p>Suggested next actions from current telemetry</p>
          </div>
          <ul class="admin-recommendation-list" data-admin-recommendations></ul>
        </article>
      </section>
    </main>
  `
}

function createAdminScrollReveal(root: HTMLElement): { refresh: () => void } {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('admin-reveal--visible')
        observer.unobserve(entry.target)
      }
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )

  return {
    refresh(): void {
      if (reduceMotion) {
        root.querySelectorAll<HTMLElement>('.admin-reveal').forEach((el) => el.classList.add('admin-reveal--visible'))
        return
      }
      root.querySelectorAll<HTMLElement>('.admin-reveal:not(.admin-reveal--visible)').forEach((el) => observer.observe(el))
    },
  }
}

export function bindAdminDashboard(root: HTMLElement): void {
  let state = readState()
  const scrollReveal = createAdminScrollReveal(root)
  syncDashboard(root, state)
  scrollReveal.refresh()

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    const windowBtn = target.closest<HTMLButtonElement>('[data-admin-window-btn]')
    if (windowBtn) {
      const next = windowBtn.dataset.adminWindowBtn
      if (next === '24h' || next === '7d' || next === '30d') {
        state = { ...state, window: next }
        writeState(state)
        syncDashboard(root, state)
        scrollReveal.refresh()
      }
      return
    }

    const regionBtn = target.closest<HTMLButtonElement>('[data-admin-region-btn]')
    if (regionBtn) {
      const next = regionBtn.dataset.adminRegionBtn
      if (next === 'all' || next === 'new-castle' || next === 'kent' || next === 'sussex') {
        state = { ...state, region: next }
        writeState(state)
        syncDashboard(root, state)
        scrollReveal.refresh()
      }
      return
    }
  })
}
