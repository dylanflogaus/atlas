import './style.css'
import { getVoter, voters } from './data'
import { unmountDashboardMap } from './map/dashboardMap'
import { navigate, onRouteChange, readRoute } from './router'
import { bindShell, renderShell } from './shell'
import { bindChaserProgress, renderChaserProgress } from './views/chaserProgress'
import { bindConfirmation, renderConfirmation } from './views/confirmation'
import { bindDashboard, renderDashboard, unmountDashboardBindings } from './views/dashboard'
import { closeLogModal } from './views/log'
import { bindProfile, renderProfile } from './views/profile'
import { bindIntel, renderIntel } from './views/intel'
import { bindVotersList, renderVotersList } from './views/votersList'

const app = document.querySelector<HTMLDivElement>('#app')!
const defaultVoterId = voters[0]?.id ?? 'jameson-sterling'

let lastRenderedRouteKey = ''

function routeRenderKey(r: ReturnType<typeof readRoute>): string {
  return `${r.path}\0${r.voterId ?? ''}\0${r.logRevealForm ? 1 : 0}`
}

function render(): void {
  let route = readRoute()

  if (route.path === '/close') {
    navigate('#/')
    return
  }

  const incomingKey = routeRenderKey(route)
  if (incomingKey === lastRenderedRouteKey) {
    return
  }

  closeLogModal()
  unmountDashboardMap()
  unmountDashboardBindings()

  const path = route.path

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
  } else if (path === '/log' || path.startsWith('/log/')) {
    shellOpts = {
      ...shellOpts,
      nav: 'log',
      title: 'Your progress',
      showBack: false,
    }
    mainHtml = renderChaserProgress()
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

  const viewRoot = app.querySelector<HTMLElement>('#view-root')
  if (!viewRoot) return

  if (path === '/' || path === '') bindDashboard(viewRoot)
  else if (path === '/voters') bindVotersList(viewRoot)
  else if (path.startsWith('/voters/')) bindProfile(viewRoot)
  else if (path === '/intel') bindIntel(viewRoot)
  else if (path === '/log' || path.startsWith('/log/')) bindChaserProgress(viewRoot)
  else if (path === '/mission-complete') bindConfirmation(viewRoot)

  lastRenderedRouteKey = routeRenderKey(readRoute())
}

render()
onRouteChange(render)
