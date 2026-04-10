import type { Voter } from '../data'
import { getVoter } from '../data'
import { navigate } from '../router'

export const ATLAS_LOG_MODAL_ID = 'atlas-log-modal'

const DEFAULT_VOTER_FALLBACK = 'jameson-sterling'

type OutcomeKey = 'not-home' | 'left-lit' | 'persuasion' | 'ballot'

const OUTCOME_STYLES: Record<
  OutcomeKey,
  { selected: string; unselected: string; iconSelected: string; iconUnselected: string }
> = {
  'not-home': {
    selected: 'bg-slate-700 text-white border-slate-800',
    unselected: 'bg-slate-200 border-transparent text-slate-700',
    iconSelected: 'text-white',
    iconUnselected: 'text-slate-600',
  },
  'left-lit': {
    selected: 'bg-blue-600 text-white border-blue-800',
    unselected: 'bg-white border-blue-500 text-blue-500 border-2',
    iconSelected: 'text-white',
    iconUnselected: 'text-blue-500',
  },
  persuasion: {
    selected: 'bg-yellow-500 text-yellow-950 border-2 border-yellow-700',
    unselected: 'bg-yellow-100 border-transparent text-yellow-950',
    iconSelected: 'text-yellow-950',
    iconUnselected: 'text-yellow-800',
  },
  ballot: {
    selected: 'bg-primary text-on-primary border-primary-container border-2 shadow-xl ring-2 ring-offset-2 ring-primary-container',
    unselected: 'bg-primary-container text-on-primary border-transparent border-2 shadow-sm',
    iconSelected: 'text-on-primary',
    iconUnselected: 'text-on-primary',
  },
}

const BTN_BASE =
  'outcome-btn flex flex-col items-center justify-center aspect-[4/3] rounded-lg transition-all p-3 text-center border-2'

let escapeModalHandler: ((e: KeyboardEvent) => void) | null = null

function splitCls(s: string): string[] {
  return s.split(/\s+/).filter(Boolean)
}

function setOutcomeState(btn: HTMLButtonElement, selected: boolean): void {
  const outcome = btn.dataset.outcome as OutcomeKey
  const c = OUTCOME_STYLES[outcome]
  const icon = btn.querySelector<HTMLElement>('.icon-span')!
  const label = btn.querySelector<HTMLElement>('.label-span')!

  const off = splitCls(c.unselected)
  const on = splitCls(c.selected)

  if (selected) {
    btn.classList.remove(...off)
    btn.classList.add(...on, 'selected-active')
    icon.classList.remove(c.iconUnselected)
    icon.classList.add(c.iconSelected)
    if (outcome === 'ballot') icon.classList.add('fill')
    else icon.classList.remove('fill')
    label.classList.remove('text-slate-700', 'text-blue-500', 'text-yellow-950', 'text-on-primary')
    if (outcome === 'persuasion') label.classList.add('text-yellow-950')
    else if (outcome === 'ballot') label.classList.add('text-on-primary')
    else label.classList.add('text-white')
  } else {
    btn.classList.remove(...on, 'selected-active')
    btn.classList.add(...off)
    icon.classList.remove(c.iconSelected)
    icon.classList.add(c.iconUnselected)
    if (outcome === 'ballot') icon.classList.add('fill')
    else icon.classList.remove('fill')
    label.classList.remove('text-white', 'text-yellow-950')
    if (outcome === 'ballot') label.classList.add('text-on-primary')
    else if (outcome === 'left-lit') label.classList.add('text-blue-500')
    else if (outcome === 'persuasion') label.classList.add('text-yellow-950')
    else label.classList.add('text-slate-700')
  }
}

function resetOutcomes(root: HTMLElement, except: HTMLButtonElement | null): void {
  root.querySelectorAll<HTMLButtonElement>('.outcome-btn').forEach((btn) => {
    if (btn !== except) setOutcomeState(btn, false)
  })
}

/** Inner panel markup (card only). */
export function renderLog(v: Voter): string {
  return `
      <div class="flex w-full max-w-md flex-col overflow-hidden bg-surface shadow-2xl md:rounded-xl rounded-t-xl max-h-[min(90dvh,calc(100dvh-2rem))] ring-1 ring-outline-variant/25">
        <header class="flex h-14 w-full shrink-0 items-center justify-between bg-surface-container-lowest px-4">
          <h1 class="font-headline text-lg font-black uppercase tracking-wider text-primary">Log Contact</h1>
          <button type="button" data-close class="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        <div data-log-gate class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
          <p class="text-center text-sm text-on-surface-variant font-medium max-w-[280px]">
            Start a ballot request log when you are ready to record this contact.
          </p>
          <button type="button" data-reveal-log class="w-full max-w-xs py-4 px-6 bg-primary-container text-on-primary rounded-xl font-extrabold text-base shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all min-h-[56px] uppercase tracking-wider font-headline">
            <span class="material-symbols-outlined">how_to_reg</span>
            Log Ballot Request
          </button>
        </div>
        <div data-log-main class="hidden flex flex-1 flex-col min-h-0">
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <section class="bg-surface-container-low p-5 rounded-lg shadow-sm" style="border-left: 4px solid var(--color-primary);">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Voter Identification</p>
                <h2 class="text-xl font-headline font-extrabold text-on-surface">${v.name}</h2>
                <p class="text-sm text-on-surface-variant font-medium flex items-center mt-1">
                  <span class="material-symbols-outlined icon-span text-[18px] mr-1 fill">location_on</span>
                  ${v.address}
                </p>
              </div>
              <div class="h-10 w-10 bg-surface-container-highest rounded-md flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-secondary">person</span>
              </div>
            </div>
          </section>
          <section>
            <h3 class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Field Action Outcome</h3>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" class="${BTN_BASE}" data-outcome="not-home">
                <span class="material-symbols-outlined icon-span mb-2">no_accounts</span>
                <span class="font-headline text-[11px] font-bold uppercase tracking-tight leading-tight label-span">Not Home</span>
              </button>
              <button type="button" class="${BTN_BASE}" data-outcome="left-lit">
                <span class="material-symbols-outlined icon-span mb-2">description</span>
                <span class="font-headline text-[11px] font-bold uppercase tracking-tight leading-tight label-span">Left Literature</span>
              </button>
              <button type="button" class="${BTN_BASE}" data-outcome="persuasion">
                <span class="material-symbols-outlined icon-span mb-2">campaign</span>
                <span class="font-headline text-[11px] font-bold uppercase tracking-tight leading-tight label-span">Persuasion Convo</span>
              </button>
              <button type="button" class="${BTN_BASE}" data-outcome="ballot">
                <span class="material-symbols-outlined icon-span mb-2 fill">check_circle</span>
                <span class="font-headline text-[11px] font-bold uppercase tracking-tight leading-tight label-span">Ballot Secured</span>
              </button>
            </div>
          </section>
          <section class="space-y-2">
            <label class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary" for="notes-area">Command Notes (Optional)</label>
            <div class="relative">
              <textarea class="w-full bg-surface-container-lowest rounded-lg p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 resize-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary focus:outline-none" id="notes-area" maxlength="150" placeholder="Add notes..." rows="3"></textarea>
              <div class="absolute bottom-3 right-3 text-[10px] font-bold text-on-surface-variant/60 font-label" id="char-count">0 / 150</div>
            </div>
          </section>
        </div>
        <footer class="p-6 bg-surface-container-lowest shrink-0">
          <button type="button" data-submit class="w-full py-4 px-6 bg-secondary text-on-primary rounded-lg font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] shadow-lg">
            <span>Submit & Next</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </footer>
        </div>
      </div>`
}

export function closeLogModal(): void {
  if (escapeModalHandler) {
    document.removeEventListener('keydown', escapeModalHandler)
    escapeModalHandler = null
  }
  document.getElementById(ATLAS_LOG_MODAL_ID)?.remove()
}

export function openLogModal(voterId: string, revealForm = false): void {
  const v = getVoter(voterId) ?? getVoter(DEFAULT_VOTER_FALLBACK)
  if (!v) return

  closeLogModal()

  const layer = document.createElement('div')
  layer.id = ATLAS_LOG_MODAL_ID
  layer.className = 'fixed inset-0 z-[100] font-body text-on-background'
  layer.setAttribute('role', 'dialog')
  layer.setAttribute('aria-modal', 'true')
  layer.setAttribute('aria-labelledby', 'log-contact-title')
  layer.innerHTML = `
    <div class="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" data-log-backdrop tabindex="-1"></div>
    <div class="relative z-10 flex h-full min-h-0 w-full items-end justify-center md:items-center p-0 md:p-6 pb-[max(4rem,env(safe-area-inset-bottom,0px))] md:pb-6 pointer-events-none">
      <div class="pointer-events-auto w-full max-w-md md:px-0">${renderLog(v)}</div>
    </div>`

  const heading = layer.querySelector('h1')
  if (heading) heading.id = 'log-contact-title'

  const app = document.querySelector('#app')
  if (app) app.appendChild(layer)
  else document.body.appendChild(layer)

  bindLog(layer, v.id, revealForm)
}

function revealLogForm(gate: Element | null, main: Element | null): void {
  gate?.classList.add('hidden')
  main?.classList.remove('hidden')
}

export function bindLog(root: HTMLElement, voterId: string, revealForm = false): void {
  const gate = root.querySelector('[data-log-gate]')
  const main = root.querySelector('[data-log-main]')
  if (revealForm) {
    revealLogForm(gate, main)
  }
  root.querySelector('[data-reveal-log]')?.addEventListener('click', () => {
    revealLogForm(gate, main)
  })

  root.querySelectorAll<HTMLButtonElement>('.outcome-btn').forEach((btn) => setOutcomeState(btn, false))

  root.querySelectorAll<HTMLButtonElement>('.outcome-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('selected-active')) {
        setOutcomeState(button, false)
        return
      }
      resetOutcomes(root, button)
      setOutcomeState(button, true)
    })
  })

  const notesArea = root.querySelector<HTMLTextAreaElement>('#notes-area')
  const charCount = root.querySelector('#char-count')
  notesArea?.addEventListener('input', () => {
    const len = notesArea.value.length
    if (charCount) {
      charCount.textContent = `${len} / 150`
      charCount.classList.toggle('text-error', len >= 150)
    }
  })

  const dismiss = (): void => {
    closeLogModal()
  }

  root.querySelector('[data-close]')?.addEventListener('click', dismiss)
  root.querySelector('[data-log-backdrop]')?.addEventListener('click', dismiss)

  escapeModalHandler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') dismiss()
  }
  document.addEventListener('keydown', escapeModalHandler)

  root.querySelector('[data-submit]')?.addEventListener('click', () => {
    closeLogModal()
    navigate('#/mission-complete?voter=' + encodeURIComponent(voterId))
  })
}
