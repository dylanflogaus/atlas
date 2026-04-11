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
import { bindSignIn, isSignedIn, renderSignIn } from './views/signIn'
import { bindVotersList, renderVotersList } from './views/votersList'

const app = document.querySelector<HTMLDivElement>('#app')!
const defaultVoterId = voters[0]?.id ?? 'jameson-sterling'
const ACHIEVEMENTS_OVERLAY_HOST_ID = 'atlas-achievements-overlay-host'

let lastRenderedRouteKey = ''

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

function mountFixedAchievementOverlay(path: string, currentVoterAchievement: WalkSimAchievement | null): boolean {
  document.getElementById(ACHIEVEMENTS_OVERLAY_HOST_ID)?.remove()
  const overlayHtml = fixedAchievementOverlayHtml(path, currentVoterAchievement)
  if (!overlayHtml) return false
  const host = document.createElement('div')
  host.id = ACHIEVEMENTS_OVERLAY_HOST_ID
  host.innerHTML = overlayHtml
  document.body.appendChild(host)
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
  if (!isSignedIn() && pathEarly !== '/sign-in') {
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
  bindShell(app)
  mountFixedAchievementOverlay(path, currentVoterAchievement)

  const viewRoot = app.querySelector<HTMLElement>('#view-root')
  if (!viewRoot) return

  if (path === '/' || path === '') bindDashboard(viewRoot)
  else if (path === '/sign-in') bindSignIn(viewRoot)
  else if (path === '/voters') bindVotersList(viewRoot)
  else if (path.startsWith('/voters/')) bindProfile(viewRoot)
  else if (path === '/intel') bindIntel(viewRoot)
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

  lastRenderedRouteKey = routeRenderKey(readRoute())
}

render()
onRouteChange(render)
