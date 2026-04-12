import './style.css'
import { getVoter, voters } from './data'
import { unmountDashboardMap } from './map/dashboardMap'
import { navigate, onRouteChange, readRoute } from './router'
import { bindShell, renderShell } from './shell'
import { readCanvassTourOrder } from './canvassFlow'
import { bindChaserProgress, renderChaserProgress } from './views/chaserProgress'
import { bindConfirmation, renderConfirmation } from './views/confirmation'
import { bindCanvassBriefing, renderCanvassBriefing } from './views/canvassBriefing'
import { bindCanvassGoals, renderCanvassGoals } from './views/canvassGoals'
import {
  bindCanvassWalk,
  consumePendingWalkSimAchievement,
  type WalkSimAchievement,
  renderCurrentVoterAchievementOverlay,
  renderCanvassWalk,
  renderCanvassWalkProgressStrip,
  unmountWalkVoterMap,
} from './views/canvassWalk'
import { bindDashboard, renderDashboard, unmountDashboardBindings } from './views/dashboard'
import { closeLogModal } from './views/log'
import { bindProfile, renderProfile } from './views/profile'
import { bindIntel, renderIntel } from './views/intel'
import { bindAccountProfile, renderAccountProfile } from './views/accountProfile'
import { bindAdminDashboard, renderAdminDashboard } from './views/adminDashboard'
import { bindSignIn, isSignedIn, renderSignIn } from './views/signIn'
import { bindVotersList, renderVotersList } from './views/votersList'

const app = document.querySelector<HTMLDivElement>('#app')!
const defaultVoterId = voters[0]?.id ?? 'jameson-sterling'
const ACHIEVEMENTS_OVERLAY_HOST_ID = 'atlas-achievements-overlay-host'
const CURRENT_VOTER_ACHIEVEMENT_VISIBLE_MS = 2500

let lastRenderedRouteKey = ''
let overlayDismissTimer: number | null = null
let overlayRemoveTimer: number | null = null
let achievementAudioCtx: AudioContext | null = null
/** Coalesces duplicate synchronous renders (e.g. stacked hashchange listeners after HMR). */
let missionFanfareCoalesceKey: string | null = null

function resetPageScrollToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  const scrollingElement = document.scrollingElement
  if (scrollingElement) scrollingElement.scrollTop = 0
}

function routeRenderKey(r: ReturnType<typeof readRoute>): string {
  return `${r.path}\0${r.voterId ?? ''}\0${r.logRevealForm ? 1 : 0}\0${isSignedIn() ? 1 : 0}`
}

function fixedAchievementOverlayHtml(
  path: string,
  currentVoterAchievement: WalkSimAchievement | null,
): string {
  if (!/^\/canvass\/walk\/\d+$/.test(path)) return ''
  if (!currentVoterAchievement) return ''
  return renderCurrentVoterAchievementOverlay(currentVoterAchievement)
}

function clearAchievementOverlayTimers(): void {
  if (overlayDismissTimer != null) {
    window.clearTimeout(overlayDismissTimer)
    overlayDismissTimer = null
  }
  if (overlayRemoveTimer != null) {
    window.clearTimeout(overlayRemoveTimer)
    overlayRemoveTimer = null
  }
}

function getAchievementAudioContext(): AudioContext | null {
  if (achievementAudioCtx) return achievementAudioCtx
  const AudioCtxCtor = window.AudioContext
  if (!AudioCtxCtor) return null
  try {
    achievementAudioCtx = new AudioCtxCtor()
    return achievementAudioCtx
  } catch {
    return null
  }
}

function playAchievementUnlockSound(): void {
  const ctx = getAchievementAudioContext()
  if (!ctx) return

  const start = ctx.currentTime + 0.01
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.65, start + 0.04)
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.92)
  master.connect(ctx.destination)

  const scheduleTone = (
    freq: number,
    when: number,
    length: number,
    type: OscillatorType,
    peak: number,
  ): void => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, when)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length)
    osc.connect(gain)
    gain.connect(master)
    osc.start(when)
    osc.stop(when + length + 0.03)
  }

  // Upward arpeggio + sparkle accent for a short motivational cue.
  scheduleTone(523.25, start, 0.22, 'triangle', 0.98)
  scheduleTone(659.25, start + 0.09, 0.24, 'triangle', 0.94)
  scheduleTone(783.99, start + 0.19, 0.28, 'triangle', 0.9)
  scheduleTone(1046.5, start + 0.28, 0.2, 'sine', 0.68)

  void ctx.resume().catch(() => undefined)
}

function playMissionCompleteSound(): void {
  const ctx = getAchievementAudioContext()
  if (!ctx) return

  const start = ctx.currentTime + 0.02
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.52, start + 0.07)
  master.gain.exponentialRampToValueAtTime(0.0001, start + 1.42)
  master.connect(ctx.destination)

  const scheduleTone = (
    freq: number,
    when: number,
    length: number,
    type: OscillatorType,
    peak: number,
  ): void => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, when)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length)
    osc.connect(gain)
    gain.connect(master)
    osc.start(when)
    osc.stop(when + length + 0.04)
  }

  // Triumphant major fanfare + bright finish (distinct from walk achievement arpeggio).
  scheduleTone(392.0, start, 0.14, 'triangle', 0.52)
  scheduleTone(523.25, start + 0.11, 0.16, 'triangle', 0.7)
  scheduleTone(659.25, start + 0.24, 0.18, 'triangle', 0.66)
  scheduleTone(783.99, start + 0.38, 0.22, 'triangle', 0.62)
  scheduleTone(1046.5, start + 0.52, 0.32, 'triangle', 0.76)
  scheduleTone(1318.51, start + 0.78, 0.2, 'sine', 0.48)
  scheduleTone(1567.98, start + 0.96, 0.12, 'sine', 0.32)

  void ctx.resume().catch(() => undefined)
}

function scheduleMissionCompleteFanfare(routeKey: string): void {
  if (routeKey === missionFanfareCoalesceKey) return
  missionFanfareCoalesceKey = routeKey
  queueMicrotask(() => {
    missionFanfareCoalesceKey = null
    if (readRoute().path !== '/mission-complete') return
    playMissionCompleteSound()
  })
}

function mountFixedAchievementOverlay(path: string, currentVoterAchievement: WalkSimAchievement | null): boolean {
  clearAchievementOverlayTimers()
  document.getElementById(ACHIEVEMENTS_OVERLAY_HOST_ID)?.remove()
  const overlayHtml = fixedAchievementOverlayHtml(path, currentVoterAchievement)
  if (!overlayHtml) return false
  const host = document.createElement('div')
  host.id = ACHIEVEMENTS_OVERLAY_HOST_ID
  host.innerHTML = overlayHtml
  document.body.appendChild(host)
  playAchievementUnlockSound()

  overlayDismissTimer = window.setTimeout(() => {
    const overlay = host.querySelector<HTMLElement>('[data-current-voter-achievement-overlay]')
    if (!overlay) return
    overlay.classList.add('atlas-achievement-overlay--dismiss')
    overlayRemoveTimer = window.setTimeout(() => {
      host.remove()
      overlayRemoveTimer = null
    }, 550)
    overlayDismissTimer = null
  }, CURRENT_VOTER_ACHIEVEMENT_VISIBLE_MS)

  return true
}

function render(): void {
  let route = readRoute()

  if (route.path === '/close') {
    navigate('#/')
    return
  }

  const pathEarly = route.path
  if (isSignedIn() && pathEarly === '/sign-in') {
    navigate('#/')
    return
  }
  if (!isSignedIn() && pathEarly !== '/sign-in' && pathEarly !== '/admin') {
    navigate('#/sign-in')
    return
  }

  const incomingKey = routeRenderKey(route)
  if (incomingKey === lastRenderedRouteKey) {
    return
  }

  closeLogModal()
  unmountWalkVoterMap()
  unmountDashboardMap()
  unmountDashboardBindings()

  const path = route.path
  let currentVoterAchievement: WalkSimAchievement | null = null

  let mainHtml = ''
  let shellOpts: Parameters<typeof renderShell>[1] = {
    nav: route.nav,
    title: 'Project Atlas',
    showBack: false,
    hideNav: false,
  }

  if (path === '/' || path === '') {
    shellOpts = { ...shellOpts, fullBleedMain: true }
    mainHtml = renderDashboard()
  } else if (path === '/sign-in') {
    shellOpts = {
      ...shellOpts,
      title: 'Sign in',
      hideNav: true,
      hideHeaderNav: true,
    }
    mainHtml = renderSignIn()
  } else if (path === '/voters') {
    shellOpts = { ...shellOpts, showBack: true, nav: 'voters' }
    mainHtml = renderVotersList()
  } else if (path.startsWith('/voters/')) {
    const id = path.split('/')[2]
    const v = id ? getVoter(id) : undefined
    if (!v) {
      navigate('#/voters')
      return
    }
    shellOpts = { ...shellOpts, showBack: true, nav: 'voters' }
    mainHtml = renderProfile(v)
  } else if (path === '/intel') {
    shellOpts = { ...shellOpts, showBack: true, nav: 'intel', title: 'Field brief' }
    mainHtml = renderIntel()
  } else if (path === '/account') {
    shellOpts = { ...shellOpts, showBack: true, nav: 'account', title: 'Profile' }
    mainHtml = renderAccountProfile()
  } else if (path === '/admin') {
    shellOpts = {
      ...shellOpts,
      showBack: true,
      hideNav: true,
      title: 'Admin Command',
      nav: 'route',
      headerVariant: 'admin',
    }
    mainHtml = renderAdminDashboard()
  } else if (path === '/log' || path.startsWith('/log/')) {
    shellOpts = {
      ...shellOpts,
      nav: 'log',
      title: 'Your progress',
      showBack: false,
    }
    mainHtml = renderChaserProgress()
  } else if (path === '/canvass/briefing') {
    shellOpts = {
      ...shellOpts,
      nav: 'route',
      title: 'Intel briefing',
      showBack: true,
    }
    mainHtml = renderCanvassBriefing()
  } else if (path === '/canvass/goals') {
    shellOpts = {
      ...shellOpts,
      nav: 'route',
      title: 'Shift goals',
      showBack: true,
    }
    mainHtml = renderCanvassGoals()
  } else if (/^\/canvass\/walk\/\d+$/.test(path)) {
    const walkIdx = Number(path.split('/')[3])
    const tour = readCanvassTourOrder()
    const voterId = tour && walkIdx >= 0 && walkIdx < tour.length ? tour[walkIdx] : null
    const v = voterId ? getVoter(voterId) : undefined
    if (!tour || !voterId || !v || !Number.isInteger(walkIdx) || walkIdx < 0) {
      navigate('#/')
      return
    }
    shellOpts = {
      ...shellOpts,
      nav: 'route',
      title: v.name.split(' ')[0] ?? 'Walk',
      showBack: true,
      belowHeader: renderCanvassWalkProgressStrip(walkIdx, tour.length),
    }
    currentVoterAchievement = consumePendingWalkSimAchievement()
    // Route overlay now owns achievement presentation.
    mainHtml = renderCanvassWalk(v, null)
  } else if (path === '/mission-complete') {
    const id = route.voterId ?? defaultVoterId
    const v = getVoter(id) ?? getVoter(defaultVoterId)
    if (!v) {
      navigate('#/')
      return
    }
    shellOpts = {
      nav: 'log',
      title: 'Mission Update',
      showBack: true,
      hideNav: true,
    }
    mainHtml = renderConfirmation(v)
  } else {
    navigate('#/')
    return
  }

  app.innerHTML = renderShell(mainHtml, shellOpts)
  resetPageScrollToTop()
  bindShell(app)
  mountFixedAchievementOverlay(path, currentVoterAchievement)

  const viewRoot = app.querySelector<HTMLElement>('#view-root')
  if (!viewRoot) return

  if (path === '/mission-complete') scheduleMissionCompleteFanfare(incomingKey)

  if (path === '/' || path === '') bindDashboard(viewRoot)
  else if (path === '/sign-in') bindSignIn(viewRoot)
  else if (path === '/voters') bindVotersList(viewRoot)
  else if (path.startsWith('/voters/')) bindProfile(viewRoot)
  else if (path === '/intel') bindIntel(viewRoot)
  else if (path === '/admin') bindAdminDashboard(viewRoot)
  else if (path === '/account') bindAccountProfile(viewRoot)
  else if (path === '/log' || path.startsWith('/log/')) bindChaserProgress(viewRoot)
  else if (path === '/canvass/briefing') bindCanvassBriefing(viewRoot)
  else if (path === '/canvass/goals') bindCanvassGoals(viewRoot)
  else if (/^\/canvass\/walk\/\d+$/.test(path)) {
    const walkIdx = Number(path.split('/')[3])
    const tour = readCanvassTourOrder()
    const voterId = tour && walkIdx >= 0 && walkIdx < tour.length ? tour[walkIdx] : null
    const v = voterId ? getVoter(voterId) : undefined
    if (tour && v) bindCanvassWalk(viewRoot, walkIdx, v)
  } else if (path === '/mission-complete') bindConfirmation(viewRoot)

  lastRenderedRouteKey = incomingKey
}

render()
const unsubscribeRoute = onRouteChange(render)
if (import.meta.hot) {
  import.meta.hot.dispose(() => unsubscribeRoute())
}
