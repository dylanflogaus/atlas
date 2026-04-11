import { navigate } from '../router'
import { getPriorityTargets, voters } from '../data'
import { readCanvassTourOrder } from '../canvassFlow'
import { INTEL_ROUTE_DEADLINES, INTEL_SCRIPT_PACKS, readIntelChecklistState } from './intel'

const SAFETY_LINES = [
  'Never enter a residence; stay on the stoop or walkway.',
  'If a dog is loose or a resident is aggressive, skip the unit and note it.',
  'No debates on camera; de-escalate and move on.',
  'Respect “no soliciting” and campaign-free zones at polling sites.',
]

function checklistSummary(saved: Set<string>): string {
  const items: { id: string; label: string }[] = [
    { id: 'id', label: 'ID badge visible + campaign authorized' },
    { id: 'lit', label: 'Liter handouts & yard sign inventory' },
    { id: 'charge', label: 'Phone / tablet charged; maps offline' },
    { id: 'safety', label: 'Buddy check-in and incident number saved' },
  ]
  return items
    .map((row) => {
      const ok = saved.has(row.id)
      return `
        <li class="flex gap-2.5 text-sm ${ok ? 'text-emerald-800' : 'text-on-surface-variant'}">
          <span class="material-symbols-outlined text-lg shrink-0 ${ok ? 'text-emerald-600 fill' : 'text-on-surface-variant/50'}">${ok ? 'check_circle' : 'radio_button_unchecked'}</span>
          <span>${row.label}</span>
        </li>`
    })
    .join('')
}

function deadlinesCompact(): string {
  return INTEL_ROUTE_DEADLINES.slice(0, 3)
    .map(
      (d) => `
      <li class="rounded-xl border border-outline-variant/12 bg-surface-container-low px-3 py-2.5 ring-1 ring-outline-variant/10">
        <p class="font-headline text-sm font-bold text-on-surface">${d.title}</p>
        <p class="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">${d.date}</p>
      </li>`,
    )
    .join('')
}

export function renderCanvassBriefing(): string {
  if (!readCanvassTourOrder()) {
    return `
      <main class="mx-auto max-w-lg px-4 pb-nav pt-6">
        <p class="text-sm text-on-surface-variant">No active route order. Build a route on the map first.</p>
        <a href="#/" class="mt-4 inline-flex font-bold text-primary">Back to route →</a>
      </main>`
  }

  const targets = getPriorityTargets()
  const rosterSize = voters.length
  const highProp = voters.filter((v) => v.reliability === 'High').length
  const featured = targets[0]
  const saved = readIntelChecklistState()
  const script = INTEL_SCRIPT_PACKS.undecided

  return `
    <main class="canvass-briefing mx-auto w-full max-w-lg space-y-5 px-4 pb-28 pt-4 sm:px-6">
      <div class="rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary p-5 text-on-primary shadow-lg ring-1 ring-white/10">
        <p class="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Intel briefing</p>
        <h2 class="mt-1 font-headline text-xl font-black tracking-tight">Before you knock</h2>
        <p class="mt-2 text-sm font-medium leading-snug text-white/90">
          Snapshot from your field brief: ${targets.length} priority doors in this pack · ${rosterSize} modeled statewide · ${highProp} high-reliability contacts on file.
        </p>
      </div>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
          <span class="material-symbols-outlined text-secondary text-lg">track_changes</span>
          Operational objective
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Identify turnout intent, capture ballot assistance needs, and flag safety or access issues. Every knock should end with a clear outcome in the app—even “not home.”
        </p>
      </section>

      ${
        featured
          ? `<section class="rounded-2xl border border-primary/20 bg-primary/5 p-4 ring-1 ring-primary/10">
        <p class="text-[10px] font-black uppercase tracking-widest text-primary">Hot contact · start of route</p>
        <p class="mt-1 font-headline text-lg font-black text-on-surface">${featured.name}</p>
        <p class="mt-0.5 text-xs text-on-surface-variant">${featured.address}, ${featured.cityState}</p>
        <p class="mt-2 border-l-2 border-primary/30 pl-3 text-xs italic text-on-surface-variant">“${featured.canvassingNote}”</p>
      </section>`
          : ''
      }

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <h3 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Pre-walk checklist (this device)</h3>
        <ul class="mt-3 space-y-2">${checklistSummary(saved)}</ul>
      </section>

      <section class="rounded-2xl border border-amber-200/60 bg-amber-50/90 p-4 ring-1 ring-amber-200/50">
        <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-950">
          <span class="material-symbols-outlined text-amber-800 text-base">shield_person</span>
          Field safety
        </h3>
        <ul class="mt-3 space-y-2">
          ${SAFETY_LINES.map(
            (line) => `
            <li class="flex gap-2 text-sm text-amber-950/90">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
              ${line}
            </li>`,
          ).join('')}
        </ul>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <h3 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Key dates</h3>
        <ul class="mt-3 space-y-2">${deadlinesCompact()}</ul>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <h3 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Doorstep line · undecided</h3>
        <p class="mt-2 text-sm leading-relaxed text-on-surface-variant"><span class="font-headline font-semibold text-on-surface">Opener —</span> ${script.opener}</p>
        <p class="mt-2 text-sm leading-relaxed text-on-surface-variant"><span class="font-headline font-semibold text-on-surface">Ask —</span> ${script.ask}</p>
        <a href="#/intel" class="mt-3 inline-flex text-xs font-bold uppercase tracking-wider text-primary">Full scripts in Intel →</a>
      </section>

      <div class="fixed bottom-16 left-0 right-0 z-30 border-t border-outline-variant/15 bg-surface/95 px-4 py-3 backdrop-blur-md safe-bottom">
        <div class="mx-auto flex max-w-lg flex-col gap-2">
          <p data-canvass-brief-scroll-hint class="text-center text-[11px] font-medium leading-snug text-on-surface-variant">
            Scroll to the bottom of the briefing to continue.
          </p>
          <button
            type="button"
            data-canvass-brief-continue
            disabled
            aria-disabled="true"
            class="w-full rounded-xl bg-primary py-3.5 text-center font-headline text-sm font-black uppercase tracking-widest text-on-primary shadow-md transition-all opacity-45 cursor-not-allowed pointer-events-none enabled:pointer-events-auto enabled:cursor-pointer enabled:opacity-100 enabled:active:scale-[0.99]"
          >
            Continue
          </button>
        </div>
      </div>
    </main>`
}

function syncBriefingContinueScrollState(): void {
  if (!document.querySelector('.canvass-briefing')) return

  const btn = document.querySelector<HTMLButtonElement>('[data-canvass-brief-continue]')
  const hint = document.querySelector<HTMLElement>('[data-canvass-brief-scroll-hint]')
  if (!btn) return

  const doc = document.documentElement
  const bottomSlackPx = 72
  const scrollBottom = window.scrollY + window.innerHeight
  const docHeight = doc.scrollHeight
  const contentFitsWithoutScroll = docHeight <= window.innerHeight + 8
  const reachedEnd = scrollBottom >= docHeight - bottomSlackPx
  const canContinue = contentFitsWithoutScroll || reachedEnd

  btn.disabled = !canContinue
  btn.setAttribute('aria-disabled', String(!canContinue))
  if (hint) hint.classList.toggle('hidden', canContinue)
}

export function bindCanvassBriefing(root: HTMLElement): void {
  const onScrollOrResize = (): void => {
    if (!root.querySelector('.canvass-briefing')) {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      return
    }
    syncBriefingContinueScrollState()
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
  requestAnimationFrame(() => {
    syncBriefingContinueScrollState()
  })

  root.querySelector('[data-canvass-brief-continue]')?.addEventListener('click', () => {
    const btn = root.querySelector<HTMLButtonElement>('[data-canvass-brief-continue]')
    if (btn?.disabled) return
    navigate('#/canvass/goals')
  })
}
