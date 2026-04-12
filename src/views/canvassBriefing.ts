import { navigate } from '../router'
import { getPriorityTargets, getVoter, voters, type Voter } from '../data'
import { readCanvassTourOrder } from '../canvassFlow'
import {
  bindIntelChecklistInputs,
  INTEL_ROUTE_DEADLINES,
  INTEL_SCRIPT_PACKS,
  intelScriptPackKeyForSupportScore,
  readIntelChecklistState,
} from './intel'

const SAFETY_LINES = [
  'Stoop or walkway only — never inside.',
  'Loose dog or hostility → skip, log it.',
  'No on-camera debates; de-escalate, move on.',
  'Honor no-soliciting and polling-place rules.',
]

const GEAR_CHECKLIST: { id: string; label: string }[] = [
  { id: 'id', label: 'ID visible · campaign-authorized' },
  { id: 'lit', label: 'Lit + yard signs stocked' },
  { id: 'charge', label: 'Device charged · offline maps' },
  { id: 'safety', label: 'Buddy check-in · incident # saved' },
]

function gearChecklistAllChecked(saved: Set<string>): boolean {
  return GEAR_CHECKLIST.every((row) => saved.has(row.id))
}

function renderGearChecklist(saved: Set<string>): string {
  return GEAR_CHECKLIST.map(
    (row) => `
      <li class="min-w-0">
        <label class="intel-section-card flex cursor-pointer items-start gap-2.5 rounded-xl bg-surface-container-low px-3 py-2.5 ring-1 ring-outline-variant/12 transition-colors has-[:checked]:bg-emerald-50/70 has-[:checked]:ring-emerald-300/45 sm:min-h-[3.25rem]">
          <input
            type="checkbox"
            data-intel-check="${row.id}"
            class="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
            ${saved.has(row.id) ? 'checked' : ''}
          />
          <span class="text-sm font-medium leading-snug text-on-surface">${row.label}</span>
        </label>
      </li>`,
  ).join('')
}

function renderBriefingScriptSlide(voter: Voter, stopIndex: number, totalStops: number): string {
  const mode = intelScriptPackKeyForSupportScore(voter.supportScore)
  const script = INTEL_SCRIPT_PACKS[mode]
  const headline = script.headline
  return `
      <article
        class="w-full shrink-0 snap-start"
        data-briefing-script-slide="${stopIndex}"
        aria-label="Stop ${stopIndex + 1} of ${totalStops}, script for ${voter.name}"
        role="group"
        aria-roledescription="slide"
      >
        <div class="rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-3 ring-1 ring-outline-variant/8">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-mono text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                Stop ${stopIndex + 1} of ${totalStops} · <span class="text-primary/90">${headline}</span>
              </p>
              <p class="mt-0.5 truncate font-headline text-base font-black text-on-surface">${voter.name}</p>
              <p class="truncate text-[11px] text-on-surface-variant">${voter.cityState} · ${voter.supportScore}% model</p>
            </div>
            <a
              href="#/voters/${voter.id}"
              class="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/22 transition-colors hover:bg-primary/16"
            >File</a>
          </div>
          <div class="mt-3 space-y-2.5">
            <div class="rounded-xl border-l-4 border-primary/50 bg-surface-container-lowest px-3 py-2.5 ring-1 ring-outline-variant/8">
              <p class="text-[9px] font-black uppercase tracking-wider text-primary/90">Open</p>
              <p class="mt-1 text-sm leading-snug text-on-surface">${script.opener}</p>
            </div>
            <div class="rounded-xl border-l-4 border-secondary/55 bg-surface-container-lowest px-3 py-2.5 ring-1 ring-outline-variant/8">
              <p class="text-[9px] font-black uppercase tracking-wider text-secondary">Ask</p>
              <p class="mt-1 text-sm leading-snug text-on-surface">${script.ask}</p>
            </div>
          </div>
        </div>
      </article>`
}

function renderBriefingScriptsCarousel(tourVoters: Voter[]): string {
  const n = tourVoters.length
  if (n === 0) {
    return `
      <p class="mt-3 text-sm text-on-surface-variant">No voters on this route — build a route on the map first.</p>`
  }

  const slides = tourVoters.map((v, i) => renderBriefingScriptSlide(v, i, n)).join('')
  const dots = tourVoters
    .map(
      (_, i) => `
      <button
        type="button"
        data-briefing-scripts-dot="${i}"
        class="h-2 w-2 shrink-0 rounded-full transition-transform motion-reduce:transition-none ${
          i === 0 ? 'scale-125 bg-primary' : 'bg-on-surface-variant/35 hover:bg-on-surface-variant/50'
        }"
        aria-label="Show script for stop ${i + 1}"
        ${i === 0 ? 'aria-current="true"' : ''}
      ></button>`,
    )
    .join('')

  return `
      <div class="relative mt-3">
        <div class="relative">
          <button
            type="button"
            data-briefing-scripts-prev
            class="atlas-priority-arrow-btn absolute left-0 top-1/2 z-10 -translate-x-1 -translate-y-1/2"
            style="display: none"
            aria-label="Previous voter script"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            data-briefing-scripts-next
            class="atlas-priority-arrow-btn absolute right-0 top-1/2 z-10 translate-x-1 -translate-y-1/2"
            style="display: none"
            aria-label="Next voter script"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <div
            class="scrolling-hide-scrollbar flex snap-x snap-mandatory gap-0 overflow-x-auto pb-1 motion-reduce:scroll-auto"
            data-briefing-scripts-carousel
            tabindex="0"
            aria-label="Voter scripts on your route"
          >
            ${slides}
          </div>
        </div>
        <div class="mt-3 flex items-center justify-center gap-2" data-briefing-scripts-dots>
          ${dots}
        </div>
      </div>`
}

function deadlinesCompact(): string {
  return INTEL_ROUTE_DEADLINES.slice(0, 3)
    .map(
      (d) => `
      <li class="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-outline-variant/12 bg-surface-container-low px-3 py-2.5 text-center ring-1 ring-outline-variant/10 sm:text-left">
        <p class="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">${d.date}</p>
        <p class="font-headline text-xs font-bold leading-tight text-on-surface">${d.title}</p>
      </li>`,
    )
    .join('')
}

export function renderCanvassBriefing(): string {
  const tourIds = readCanvassTourOrder()
  if (!tourIds) {
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
  const tourVoters = tourIds.map((id) => getVoter(id)).filter((v): v is Voter => v != null)
  const gearComplete = gearChecklistAllChecked(saved)

  return `
    <main class="canvass-briefing atlas-route-flow-page mx-auto w-full max-w-lg space-y-4 px-4 pb-28 pt-4 sm:px-6">
      <section class="intel-hero relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ring-1 ring-white/10">
        <div class="intel-glow -right-6 -top-10 opacity-90" aria-hidden="true"></div>
        <div class="intel-glow bottom-2 left-1/4 h-20 w-20 opacity-60" aria-hidden="true"></div>
        <div class="relative z-[2]">
          <p class="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/90">Intel briefing</p>
          <h2 class="mt-1 font-headline text-xl font-black tracking-tight sm:text-2xl">Before you knock</h2>
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-white/10 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/15 backdrop-blur-[2px]">
              <p class="font-headline text-2xl font-black tabular-nums leading-none">${targets.length}</p>
              <p class="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/65">Priority</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/15 backdrop-blur-[2px]">
              <p class="font-headline text-2xl font-black tabular-nums leading-none">${rosterSize}</p>
              <p class="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/65">Modeled</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/15 backdrop-blur-[2px]">
              <p class="font-headline text-2xl font-black tabular-nums leading-none">${highProp}</p>
              <p class="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/65">Reliable</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary ring-1 ring-secondary/20">
            <span class="material-symbols-outlined text-[22px]">track_changes</span>
          </span>
          <div class="min-w-0 pt-0.5">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Objective</h3>
            <p class="mt-1 text-sm font-medium leading-snug text-on-surface">
              Turnout intent, ballot help, access issues — log every knock, including not home.
            </p>
          </div>
        </div>
      </section>

      ${
        featured
          ? `<section class="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-surface-container-lowest to-surface-container-lowest p-4 ring-1 ring-primary/12">
        <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" aria-hidden="true"></div>
        <div class="relative">
          <p class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            <span class="material-symbols-outlined text-[14px]">local_fire_department</span>
            First stop
          </p>
          <p class="mt-2 font-headline text-lg font-black leading-tight text-on-surface">${featured.name}</p>
          <p class="mt-0.5 text-xs text-on-surface-variant">${featured.address}, ${featured.cityState}</p>
          <p class="mt-3 border-l-[3px] border-primary/40 pl-3 text-sm italic leading-snug text-on-surface-variant">“${featured.canvassingNote}”</p>
        </div>
      </section>`
          : ''
      }

      <section
        data-briefing-gear-section
        class="atlas-briefing-gear relative overflow-hidden rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10 transition-[border-color,box-shadow,background-color] duration-500 ${
          gearComplete ? 'atlas-briefing-gear-complete' : ''
        }"
      >
        <h3 class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          <span
            class="material-symbols-outlined atlas-briefing-gear__icon text-lg text-on-surface-variant/70 transition-transform duration-500"
            data-briefing-gear-heading-icon
            aria-hidden="true"
          >checklist</span>
          Gear check
        </h3>
        <ul class="relative z-[1] mt-3 grid gap-2 sm:grid-cols-2">${renderGearChecklist(saved)}</ul>
      </section>

      <section class="relative overflow-hidden rounded-2xl border border-amber-300/45 bg-gradient-to-b from-amber-50 to-amber-50/70 p-4 ring-1 ring-amber-200/55">
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-900 ring-1 ring-amber-600/25">
            <span class="material-symbols-outlined text-[22px]">shield_person</span>
          </span>
          <div class="min-w-0">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-amber-950">Safety</h3>
            <ul class="mt-2 grid gap-1.5">
          ${SAFETY_LINES.map(
            (line) => `
            <li class="flex gap-2 text-xs font-medium leading-snug text-amber-950/95 sm:text-sm">
              <span class="mt-1.5 h-1 w-1 shrink-0 rounded-sm bg-amber-500"></span>
              ${line}
            </li>`,
          ).join('')}
            </ul>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <h3 class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          <span class="material-symbols-outlined text-lg text-on-surface-variant/70">event</span>
          Dates
        </h3>
        <ul class="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-2">${deadlinesCompact()}</ul>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Route scripts · at the door</h3>
          <a href="#/intel" class="shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary/8">All scripts</a>
        </div>
        <p class="mt-1.5 text-xs leading-snug text-on-surface-variant">Swipe or use arrows — each stop uses the pack that matches that voter’s model score.</p>
        ${renderBriefingScriptsCarousel(tourVoters)}
      </section>

      <div class="atlas-route-flow-cta-bar fixed bottom-16 left-0 right-0 z-30 border-t border-outline-variant/15 bg-surface/95 px-4 py-3 backdrop-blur-md safe-bottom">
        <div class="mx-auto flex max-w-lg flex-col gap-2">
          <p data-canvass-brief-scroll-hint class="text-center text-[11px] font-medium leading-snug text-on-surface-variant">
            Read to the end, then continue.
          </p>
          <div class="flex justify-center">
            <button
              type="button"
              data-canvass-brief-skip
              class="font-headline text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/55 hover:text-on-surface-variant/80 py-1.5 px-2 rounded-md hover:bg-surface-container-highest/55 active:scale-[0.98] transition-colors"
              aria-label="Skip intel briefing and go to shift goals"
            >
              Skip briefing
            </button>
          </div>
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

function syncBriefingScriptsCarousel(root: HTMLElement): void {
  const carousel = root.querySelector<HTMLElement>('[data-briefing-scripts-carousel]')
  const prev = root.querySelector<HTMLButtonElement>('[data-briefing-scripts-prev]')
  const next = root.querySelector<HTMLButtonElement>('[data-briefing-scripts-next]')
  if (!carousel || !prev || !next) return

  const slideW = carousel.clientWidth
  const showNav = carousel.scrollWidth > slideW + 8
  const maxScroll = Math.max(0, carousel.scrollWidth - slideW)
  const edge = 12
  const atStart = carousel.scrollLeft <= edge
  const atEnd = carousel.scrollLeft >= maxScroll - edge

  if (showNav) {
    prev.style.display = atStart ? 'none' : 'inline-flex'
    next.style.display = atEnd ? 'none' : 'inline-flex'
    prev.onclick = (e) => {
      e.preventDefault()
      carousel.scrollBy({ left: -slideW, behavior: 'smooth' })
    }
    next.onclick = (e) => {
      e.preventDefault()
      carousel.scrollBy({ left: slideW, behavior: 'smooth' })
    }
  } else {
    prev.style.display = 'none'
    next.style.display = 'none'
    prev.onclick = null
    next.onclick = null
  }

  const dots = root.querySelectorAll<HTMLButtonElement>('[data-briefing-scripts-dot]')
  const dotCount = dots.length
  const idx =
    slideW > 0 && dotCount > 0
      ? Math.min(dotCount - 1, Math.max(0, Math.round(carousel.scrollLeft / slideW)))
      : 0
  dots.forEach((dot, i) => {
    const on = i === idx
    dot.classList.toggle('scale-125', on)
    dot.classList.toggle('bg-primary', on)
    dot.classList.toggle('bg-on-surface-variant/35', !on)
    dot.classList.toggle('hover:bg-on-surface-variant/50', !on)
    if (on) dot.setAttribute('aria-current', 'true')
    else dot.removeAttribute('aria-current')
  })
}

function bindBriefingScriptsCarousel(root: HTMLElement): void {
  const carousel = root.querySelector<HTMLElement>('[data-briefing-scripts-carousel]')
  if (!carousel) return

  const sync = (): void => {
    if (!root.querySelector('.canvass-briefing')) return
    syncBriefingScriptsCarousel(root)
  }

  sync()
  carousel.addEventListener('scroll', sync, { passive: true })
  window.addEventListener('resize', sync, { passive: true })

  root.querySelector('[data-briefing-scripts-dots]')?.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-briefing-scripts-dot]')
    if (!t) return
    const raw = t.getAttribute('data-briefing-scripts-dot')
    const i = raw != null ? Number(raw) : NaN
    if (!Number.isFinite(i)) return
    const w = carousel.clientWidth
    if (w <= 0) return
    carousel.scrollTo({ left: i * w, behavior: 'smooth' })
  })

  requestAnimationFrame(sync)
}

function syncBriefingGearSection(root: HTMLElement, opts: { allowCelebrate: boolean }): void {
  const section = root.querySelector<HTMLElement>('[data-briefing-gear-section]')
  if (!section) return

  const inputs = section.querySelectorAll<HTMLInputElement>('[data-intel-check]')
  const allChecked = inputs.length > 0 && [...inputs].every((i) => i.checked)

  if (opts.allowCelebrate && allChecked && !section.classList.contains('atlas-briefing-gear-complete')) {
    section.classList.add('atlas-briefing-gear-complete--celebrate')
    const onEnd = (e: AnimationEvent): void => {
      if (e.target !== section || e.animationName !== 'atlas-briefing-gear-celebrate') return
      section.classList.remove('atlas-briefing-gear-complete--celebrate')
      section.removeEventListener('animationend', onEnd)
    }
    section.addEventListener('animationend', onEnd)
  }

  section.classList.toggle('atlas-briefing-gear-complete', allChecked)

  const icon = section.querySelector<HTMLElement>('[data-briefing-gear-heading-icon]')
  if (icon) {
    icon.textContent = allChecked ? 'verified' : 'checklist'
    icon.classList.toggle('atlas-briefing-gear__icon--done', allChecked)
    icon.classList.toggle('text-emerald-600', allChecked)
    icon.classList.toggle('text-on-surface-variant/70', !allChecked)
  }
}

function syncBriefingContinueScrollState(latch: { unlocked: boolean }): void {
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
  if (canContinue) latch.unlocked = true

  const active = latch.unlocked
  btn.disabled = !active
  btn.setAttribute('aria-disabled', String(!active))
  if (hint) hint.classList.toggle('hidden', active)
}

export function bindCanvassBriefing(root: HTMLElement): void {
  const continueLatch = { unlocked: false }

  bindIntelChecklistInputs(root)
  bindBriefingScriptsCarousel(root)

  const gearSection = root.querySelector<HTMLElement>('[data-briefing-gear-section]')
  if (gearSection) {
    gearSection.querySelectorAll<HTMLInputElement>('[data-intel-check]').forEach((input) => {
      input.addEventListener('change', () => syncBriefingGearSection(root, { allowCelebrate: true }))
    })
    syncBriefingGearSection(root, { allowCelebrate: false })
  }

  const onScrollOrResize = (): void => {
    if (!root.querySelector('.canvass-briefing')) {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      return
    }
    syncBriefingContinueScrollState(continueLatch)
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
  requestAnimationFrame(() => {
    syncBriefingContinueScrollState(continueLatch)
  })

  root.querySelector('[data-canvass-brief-skip]')?.addEventListener('click', () => {
    navigate('#/canvass/goals')
  })

  root.querySelector('[data-canvass-brief-continue]')?.addEventListener('click', () => {
    const btn = root.querySelector<HTMLButtonElement>('[data-canvass-brief-continue]')
    if (btn?.disabled) return
    navigate('#/canvass/goals')
  })
}
