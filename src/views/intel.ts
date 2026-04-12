import { getPriorityTargets, voters, type Voter } from '../data'
import { openLogModal } from './log'

const CHECKLIST_STORAGE_KEY = 'atlas-field-intel-checklist-v1'

interface ScriptPack {
  headline: string
  opener: string
  ask: string
  closer: string
  avoid: string
}

export const INTEL_SCRIPT_PACKS: Record<'supporter' | 'undecided' | 'opposed', ScriptPack> = {
  supporter: {
    headline: 'Confirm + mobilize',
    opener: 'Thanks for supporting [Candidate]. We’re making sure neighbors have a plan to vote.',
    ask: 'Can we count on you to vote early or on Election Day—and maybe grab one more yard sign?',
    closer: 'If anything shifts your schedule, text this number and we’ll help with ballot deadlines.',
    avoid: 'Don’t over-explain policy; lock turnout plan and thank them.',
  },
  undecided: {
    headline: 'Listen first',
    opener: 'I’m with [Campaign], quick question—what’s one local issue on your mind right now?',
    ask: 'If you’re open to it, would you consider [Candidate] when you compare plans on [their issue]?',
    closer: 'No pressure—if you want a one-page comparison we can text a link. Can I leave contact info?',
    avoid: 'Avoid arguing national talking heads; stay local, one issue, respectful exit.',
  },
  opposed: {
    headline: 'Graceful exit',
    opener: 'Thanks for your time—I know not everyone is with us.',
    ask: 'If you’d rather not discuss, I’ll step off—just wanted to leave hours for your polling place.',
    closer: 'Appreciate you opening the door. Have a good evening.',
    avoid: 'Never debate or film; don’t block the door; mark as declined in the app.',
  },
}

export type IntelScriptPackKey = keyof typeof INTEL_SCRIPT_PACKS

/** Map modeled support to the script pack shown on the briefing carousel and Intel tabs. */
export function intelScriptPackKeyForSupportScore(supportScore: number): IntelScriptPackKey {
  if (supportScore >= 72) return 'supporter'
  if (supportScore <= 42) return 'opposed'
  return 'undecided'
}

export const INTEL_ROUTE_DEADLINES: { id: string; title: string; date: string; detail: string }[] = [
  {
    id: 'reg',
    title: 'Voter registration cutoff',
    date: 'Oct 11, 2026',
    detail: 'Online & by-mail must be received by county deadline. Same-day rules vary—verify for DE before relying on it in the field.',
  },
  {
    id: 'abreq',
    title: 'Absentee request window',
    date: 'By Oct 31, 2026 (typical)',
    detail: 'Encourage early request. Track ballot request/return in the app when the voter asks for help.',
  },
  {
    id: 'vote',
    title: 'Election Day',
    date: 'Nov 03, 2026',
    detail: 'Polls 7am–8pm local (confirm signage). No campaigning inside the protected zone.',
  },
]

function readChecklist(): Set<string> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function writeChecklist(ids: Set<string>): void {
  localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify([...ids]))
}

function partyShort(party: Voter['party']): string {
  if (party === 'REP') return 'R'
  if (party === 'DEM') return 'D'
  if (party === 'IND') return 'I'
  return party
}

function renderScriptPanel(mode: keyof typeof INTEL_SCRIPT_PACKS): string {
  const s = INTEL_SCRIPT_PACKS[mode]
  return `
    <div class="intel-script-panel intel-section-card mt-3 space-y-0 overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-outline-variant/15">
      <div class="border-b border-outline-variant/10 bg-surface-container-high/40 px-4 py-3">
        <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">${s.headline}</p>
      </div>
      <ul class="divide-y divide-outline-variant/10 px-4 py-1 text-sm text-on-surface-variant">
        <li class="flex gap-3 py-3">
          <span class="shrink-0 font-mono text-[10px] font-bold uppercase tabular-nums text-primary">01</span>
          <span><span class="font-headline font-bold text-on-surface">Opener</span> — ${s.opener}</span>
        </li>
        <li class="flex gap-3 py-3">
          <span class="shrink-0 font-mono text-[10px] font-bold uppercase tabular-nums text-primary">02</span>
          <span><span class="font-headline font-bold text-on-surface">Ask</span> — ${s.ask}</span>
        </li>
        <li class="flex gap-3 py-3">
          <span class="shrink-0 font-mono text-[10px] font-bold uppercase tabular-nums text-primary">03</span>
          <span><span class="font-headline font-bold text-on-surface">Close</span> — ${s.closer}</span>
        </li>
      </ul>
      <div class="border-t border-amber-200/70 bg-amber-50/90 px-4 py-3">
        <p class="text-xs font-medium leading-relaxed text-amber-950">
          <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">Avoid</span>
          <span class="mx-1.5 text-amber-600/80">·</span>
          ${s.avoid}
        </p>
      </div>
      <div class="border-t border-outline-variant/10 p-3">
        <button
          type="button"
          data-copy-script="${mode}"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-surface-container-lowest py-2.5 text-xs font-black uppercase tracking-wider text-primary shadow-sm transition hover:bg-primary/5 active:scale-[0.99]"
        >
          <span class="material-symbols-outlined text-base">content_copy</span>
          Copy talking points
        </button>
      </div>
    </div>`
}

function renderFeaturedCard(voter: Voter): string {
  const precinct = voter.cityState.split(',')[0] || 'Turf'
  return `
    <section class="intel-featured-card intel-section-card relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/20">
      <div class="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/60 to-tertiary/80" aria-hidden="true"></div>
      <div class="p-4 pl-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
              <span class="material-symbols-outlined text-sm text-primary/90">bolt</span>
              Hot contact
            </p>
            <h3 class="mt-0.5 font-headline text-lg font-black tracking-tight text-on-surface truncate">${voter.name}</h3>
            <p class="mt-0.5 text-xs text-on-surface-variant line-clamp-2">${voter.address}, ${voter.cityState}</p>
            <p class="mt-2 border-l-2 border-primary/25 pl-3 text-xs font-medium leading-snug text-on-surface-variant italic">“${voter.canvassingNote}”</p>
          </div>
          <a
            href="#/voters/${voter.id}"
            class="shrink-0 rounded-lg bg-primary/12 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/25 transition hover:bg-primary/18"
          >File</a>
        </div>
        <div class="mt-3 flex flex-wrap gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          <span class="rounded-md bg-surface-container-high px-2 py-1 text-on-surface-variant">${precinct}</span>
          <span class="rounded-md bg-secondary-container/90 px-2 py-1 text-on-secondary-container">${voter.district}</span>
          <span class="rounded-md bg-primary/12 px-2 py-1 text-primary tabular-nums">Mdl ${voter.supportScore}%</span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-mark-visited
            data-voter-id="${voter.id}"
            class="min-h-11 rounded-lg border border-primary/35 bg-surface-container-lowest px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary shadow-sm transition hover:border-primary/55 active:scale-[0.98]"
          >Mark visited</button>
          <button
            type="button"
            data-log-ballot-request
            data-voter-id="${voter.id}"
            class="min-h-11 rounded-lg bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-wider text-on-primary shadow-md shadow-primary/20 active:scale-[0.98]"
          >Log ballot help</button>
        </div>
      </div>
    </section>`
}

function renderChecklistItem(id: string, label: string, checked: boolean): string {
  return `
    <label class="intel-section-card flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low px-3 py-3 ring-1 ring-outline-variant/12 transition-colors has-[:checked]:bg-emerald-50/70 has-[:checked]:ring-emerald-300/45">
      <input
        type="checkbox"
        data-intel-check="${id}"
        class="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
        ${checked ? 'checked' : ''}
      />
      <span class="text-sm font-medium leading-snug text-on-surface">${label}</span>
    </label>`
}

export function renderIntel(): string {
  const targets = getPriorityTargets()
  const featured = targets[0]
  const highProp = voters.filter((v) => v.reliability === 'High').length
  const rosterSize = voters.length
  const avgSupport =
    targets.length > 0
      ? Math.round(targets.reduce((acc, v) => acc + v.supportScore, 0) / targets.length)
      : 0

  const checklistHtml = [
    renderChecklistItem('id', 'ID badge visible + campaign authorized', false),
    renderChecklistItem('lit', 'Liter handouts & yard sign inventory', false),
    renderChecklistItem('charge', 'Phone / tablet charged; maps offline', false),
    renderChecklistItem('safety', 'Buddy check-in and incident number saved', false),
  ].join('')

  const packRows = targets
    .slice(0, 8)
    .map(
      (v, packIdx) => `
      <a
        href="#/voters/${v.id}"
        style="--intel-pack-i:${packIdx}"
        class="intel-pack-row intel-section-card group flex items-center justify-between gap-3 rounded-xl border border-outline-variant/8 bg-surface-container-low px-3 py-3 ring-1 ring-outline-variant/10 transition-all hover:border-primary/18 hover:bg-surface-container-high hover:ring-primary/12"
      >
        <div class="min-w-0 border-l-2 border-transparent pl-2 transition-colors group-hover:border-primary/35">
          <p class="truncate font-headline text-sm font-bold text-on-surface">${v.name}</p>
          <p class="truncate font-mono text-[11px] text-on-surface-variant">${v.cityState}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tabular-nums">
          <span class="rounded-md bg-surface-container-highest px-1.5 py-0.5 text-on-surface-variant">${partyShort(v.party)}</span>
          <span class="text-primary">${v.supportScore}%</span>
        </div>
      </a>`,
    )
    .join('')

  const deadlinesHtml = INTEL_ROUTE_DEADLINES.map(
    (d) => `
    <details class="group intel-section-card overflow-hidden rounded-xl border border-outline-variant/12 bg-surface-container-lowest shadow-sm open:border-primary/25 open:ring-1 open:ring-primary/15">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-headline text-sm font-bold text-on-surface marker:hidden hover:bg-surface-container-low/80">
        <span class="flex min-w-0 items-center gap-2">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary ring-1 ring-secondary/15">
            <span class="material-symbols-outlined text-lg">event</span>
          </span>
          <span>${d.title}</span>
        </span>
        <span class="material-symbols-outlined shrink-0 text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
      </summary>
      <div class="border-t border-outline-variant/10 px-4 pb-4 pt-1">
        <p class="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">${d.date}</p>
        <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">${d.detail}</p>
      </div>
    </details>`,
  ).join('')

  const featuredSection = featured ? renderFeaturedCard(featured) : ''

  return `
    <main class="intel-view mx-auto w-full max-w-6xl space-y-5 px-4 pb-nav pt-3 sm:px-6 lg:px-8">
      <section class="intel-hero relative overflow-hidden rounded-2xl p-5 text-white ring-1 ring-white/10">
        <div class="intel-glow -right-4 -top-8" aria-hidden="true"></div>
        <div class="intel-glow bottom-0 left-1/3 h-24 w-24 opacity-70" aria-hidden="true"></div>
        <div class="intel-hero__block intel-hero__block--lead flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-sky-200/85">Field intelligence brief</p>
            <h2 class="mt-1.5 font-headline text-xl font-black tracking-tight sm:text-2xl">Tonight’s canvass slice</h2>
            <p class="mt-2 max-w-xl text-sm font-medium leading-snug text-white/88">
              Newark cluster · Apr 9 shift · <span class="font-mono tabular-nums text-white">${targets.length}</span> priority doors · <span class="font-mono tabular-nums text-white">${rosterSize}</span> modeled statewide
            </p>
          </div>
          <div class="shrink-0 rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-right font-mono backdrop-blur-sm">
            <p class="text-[9px] uppercase tracking-widest text-white/55">Brief ref</p>
            <p class="text-[11px] font-semibold tabular-nums tracking-wide text-sky-200">ATL-INT-0409</p>
          </div>
        </div>
        <dl class="intel-hero__block intel-hero__block--stats mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div class="intel-hero-stat rounded-xl border border-white/10 bg-black/22 px-2 py-3 text-center backdrop-blur-md sm:px-3">
            <dt class="text-[9px] font-black uppercase leading-tight tracking-wider text-white/65">High reliability</dt>
            <dd class="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight">${highProp}</dd>
          </div>
          <div class="intel-hero-stat rounded-xl border border-white/10 bg-black/22 px-2 py-3 text-center backdrop-blur-md sm:px-3">
            <dt class="text-[9px] font-black uppercase leading-tight tracking-wider text-white/65">Pack avg support</dt>
            <dd class="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight text-sky-100">${avgSupport || '—'}%</dd>
          </div>
          <div class="intel-hero-stat rounded-xl border border-white/10 bg-black/22 px-2 py-3 text-center backdrop-blur-md sm:px-3">
            <dt class="text-[9px] font-black uppercase leading-tight tracking-wider text-white/65">Comms</dt>
            <dd class="mt-1 font-mono text-[11px] font-semibold leading-snug text-white/92">F2 / text lead</dd>
          </div>
        </dl>
      </section>

      <div
        role="tablist"
        aria-label="Briefing sections"
        class="flex gap-1 rounded-2xl border border-outline-variant/12 bg-surface-container-high/90 p-1 shadow-sm ring-1 ring-outline-variant/10"
      >
        <button type="button" role="tab" aria-selected="true" data-intel-tab="mission" class="intel-tab flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[9px] font-black uppercase tracking-wide text-on-surface-variant transition-all sm:flex-row sm:gap-1.5 sm:text-[10px] aria-selected:bg-surface-container-lowest aria-selected:text-primary aria-selected:shadow-md aria-selected:ring-1 aria-selected:ring-primary/15">
          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">flag</span>
          <span>Mission</span>
        </button>
        <button type="button" role="tab" aria-selected="false" data-intel-tab="door" class="intel-tab flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[9px] font-black uppercase tracking-wide text-on-surface-variant transition-all sm:flex-row sm:gap-1.5 sm:text-[10px] aria-selected:bg-surface-container-lowest aria-selected:text-primary aria-selected:shadow-md aria-selected:ring-1 aria-selected:ring-primary/15">
          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">door_front</span>
          <span><span class="hidden min-[420px]:inline">Door step</span><span class="min-[420px]:hidden">Door</span></span>
        </button>
        <button type="button" role="tab" aria-selected="false" data-intel-tab="dates" class="intel-tab flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[9px] font-black uppercase tracking-wide text-on-surface-variant transition-all sm:flex-row sm:gap-1.5 sm:text-[10px] aria-selected:bg-surface-container-lowest aria-selected:text-primary aria-selected:shadow-md aria-selected:ring-1 aria-selected:ring-primary/15">
          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">calendar_month</span>
          <span>Dates</span>
        </button>
        <button type="button" role="tab" aria-selected="false" data-intel-tab="pack" class="intel-tab flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[9px] font-black uppercase tracking-wide text-on-surface-variant transition-all sm:flex-row sm:gap-1.5 sm:text-[10px] aria-selected:bg-surface-container-lowest aria-selected:text-primary aria-selected:shadow-md aria-selected:ring-1 aria-selected:ring-primary/15">
          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">groups</span>
          <span>Pack</span>
        </button>
      </div>

      <div data-intel-panel="mission" class="intel-panel space-y-4">
        <section class="intel-section-card rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/15">
          <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary ring-1 ring-tertiary/18">
              <span class="material-symbols-outlined text-lg">track_changes</span>
            </span>
            Operational objective
          </h3>
          <p class="mt-3 text-sm leading-relaxed text-on-surface-variant">
            Identify turnout intent, capture ballot assistance needs, and flag safety or access issues. Every knock should end with a clear outcome in the app—even “not home.”
          </p>
        </section>

        <section class="intel-section-card rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/15">
          <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/12 text-secondary ring-1 ring-secondary/18">
              <span class="material-symbols-outlined text-lg">checklist</span>
            </span>
            Pre-walk checklist
          </h3>
          <p class="mt-1 text-xs text-on-surface-variant">Checklist starts fresh each time you open this page.</p>
          <div class="mt-3 space-y-2">${checklistHtml}</div>
        </section>

        <section class="relative overflow-hidden rounded-2xl border border-amber-300/55 bg-gradient-to-br from-amber-50 via-amber-50/95 to-orange-50/40 p-4 ring-1 ring-amber-200/50">
          <div class="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-amber-200/25 blur-2xl" aria-hidden="true"></div>
          <h3 class="relative flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-950">
            <span class="material-symbols-outlined text-base text-amber-700">shield_person</span>
            Field safety & compliance
          </h3>
          <ul class="relative mt-3 space-y-2.5 text-sm text-amber-950/90">
            <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span> Never enter a residence; stay on the stoop or walkway.</li>
            <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span> If a dog is loose or a resident is aggressive, skip the unit and note it.</li>
            <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span> No debates on camera; de-escalate and move on.</li>
            <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span> Respect “no soliciting” and campaign-free zones at polling sites.</li>
          </ul>
        </section>
      </div>

      <div data-intel-panel="door" class="intel-panel hidden space-y-4">
        <section class="intel-section-card rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/15">
          <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <span class="font-mono text-sm font-bold text-primary">→</span>
            Disposition → script
          </h3>
          <p class="mt-1 text-xs text-on-surface-variant">Tap a profile; swap lines before you approach the next door.</p>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button type="button" data-disposition="supporter" class="rounded-xl bg-primary px-2 py-2.5 text-[9px] font-black uppercase leading-tight tracking-wide text-on-primary shadow-sm ring-2 ring-primary">
              Supporter
            </button>
            <button type="button" data-disposition="undecided" class="rounded-xl bg-surface-container-low px-2 py-2.5 text-[9px] font-black uppercase leading-tight tracking-wide text-on-surface-variant ring-1 ring-outline-variant/20">
              Undecided
            </button>
            <button type="button" data-disposition="opposed" class="rounded-xl bg-surface-container-low px-2 py-2.5 text-[9px] font-black uppercase leading-tight tracking-wide text-on-surface-variant ring-1 ring-outline-variant/20">
              Opposed
            </button>
          </div>
          <div data-script-mount>${renderScriptPanel('supporter')}</div>
        </section>

        <details class="group intel-section-card rounded-2xl border border-outline-variant/12 bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/15 open:ring-primary/12">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-headline text-sm font-bold text-on-surface marker:hidden hover:bg-surface-container-low/90">
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">schedule</span>
              Knock rhythm & access cues
            </span>
            <span class="material-symbols-outlined shrink-0 text-on-surface-variant group-open:rotate-180">expand_more</span>
          </summary>
          <ul class="space-y-2 border-t border-outline-variant/10 px-4 py-3 text-sm text-on-surface-variant">
            <li><strong class="text-on-surface">Triple knock + step back</strong> — visible, non-threatening stance.</li>
            <li><strong class="text-on-surface">Peak evening</strong> — 5:30–7:30 local; note “best time” in voter file when told.</li>
            <li><strong class="text-on-surface">Gateways / stairs</strong> — offer to hold lit at the bottom if mobility looks tight.</li>
          </ul>
        </details>
      </div>

      <div data-intel-panel="dates" class="intel-panel hidden space-y-3">
        <p class="rounded-xl border border-outline-variant/12 bg-surface-container-low px-3 py-2.5 font-mono text-[11px] leading-snug text-on-surface-variant ring-1 ring-outline-variant/10">
          Demo calendar — verify against your state board before quoting in the field.
        </p>
        ${deadlinesHtml}
      </div>

      <div data-intel-panel="pack" class="intel-panel hidden space-y-4">
        <section class="intel-section-card rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/15">
          <h3 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
            <span class="material-symbols-outlined text-base text-primary">dataset</span>
            Priority pack <span class="font-mono font-semibold normal-case text-on-surface-variant">(tap row → full file)</span>
          </h3>
          <div class="mt-3 max-h-[280px] space-y-2 overflow-y-auto scrolling-hide-scrollbar">${packRows || '<p class="text-sm text-on-surface-variant">No priority rows loaded.</p>'}</div>
        </section>
        ${featuredSection}
      </div>
    </main>`
}

function syncTabUI(root: HTMLElement, tab: string): void {
  root.querySelectorAll<HTMLButtonElement>('.intel-tab[data-intel-tab]').forEach((btn) => {
    const on = btn.dataset.intelTab === tab
    btn.setAttribute('aria-selected', on ? 'true' : 'false')
  })
  root.querySelectorAll<HTMLElement>('.intel-panel[data-intel-panel]').forEach((panel) => {
    const show = panel.dataset.intelPanel === tab
    panel.classList.toggle('hidden', !show)
    if (show) {
      panel.classList.remove('intel-panel--enter')
      void panel.offsetWidth
      panel.classList.add('intel-panel--enter')
    }
  })
}

function syncDispositionUI(root: HTMLElement, mode: keyof typeof INTEL_SCRIPT_PACKS): void {
  root.querySelectorAll<HTMLButtonElement>('[data-disposition]').forEach((btn) => {
    const on = btn.dataset.disposition === mode
    btn.classList.toggle('bg-primary', on)
    btn.classList.toggle('text-on-primary', on)
    btn.classList.toggle('ring-2', on)
    btn.classList.toggle('ring-primary', on)
    btn.classList.toggle('shadow-sm', on)
    btn.classList.toggle('bg-surface-container-low', !on)
    btn.classList.toggle('text-on-surface-variant', !on)
    btn.classList.toggle('ring-1', !on)
    btn.classList.toggle('ring-outline-variant/20', !on)
  })
  const mount = root.querySelector('[data-script-mount]')
  if (mount) mount.innerHTML = renderScriptPanel(mode)
  root.querySelectorAll<HTMLButtonElement>('[data-copy-script]').forEach((b) => {
    bindCopyButton(b)
  })
}

function bindCopyButton(btn: HTMLButtonElement): void {
  const mode = btn.dataset.copyScript as keyof typeof INTEL_SCRIPT_PACKS | undefined
  if (!mode || !INTEL_SCRIPT_PACKS[mode]) return
  btn.addEventListener('click', async () => {
    const s = INTEL_SCRIPT_PACKS[mode]
    const text = `${s.headline}\n\nOpener: ${s.opener}\nAsk: ${s.ask}\nClose: ${s.closer}\nAvoid: ${s.avoid}`
    try {
      await navigator.clipboard.writeText(text)
      const prev = btn.innerHTML
      btn.innerHTML =
        '<span class="material-symbols-outlined text-base fill">check_circle</span> Copied'
      window.setTimeout(() => {
        btn.innerHTML = prev
      }, 1600)
    } catch {
      btn.textContent = 'Copy blocked'
    }
  })
}

/** Checklist completion for route briefing (same storage as Field brief page). */
export function readIntelChecklistState(): Set<string> {
  return readChecklist()
}

/** Reset pre-walk checklist when a new canvass driving route is generated. */
export function clearIntelChecklistState(): void {
  try {
    writeChecklist(new Set())
  } catch {
    /* private mode */
  }
}

/** Persist checklist toggles from briefing or Intel UI (shared localStorage). */
export function bindIntelChecklistInputs(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('[data-intel-check]').forEach((input) => {
    const id = input.dataset.intelCheck
    if (!id) return
    input.addEventListener('change', () => {
      const next = readChecklist()
      if (input.checked) next.add(id)
      else next.delete(id)
      writeChecklist(next)
    })
  })
}

export function bindIntel(root: HTMLElement): void {
  syncTabUI(root, 'mission')

  root.querySelectorAll<HTMLButtonElement>('.intel-tab[data-intel-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.intelTab
      if (tab) syncTabUI(root, tab)
    })
  })

  let disposition: keyof typeof INTEL_SCRIPT_PACKS = 'supporter'
  syncDispositionUI(root, disposition)

  root.querySelectorAll<HTMLButtonElement>('[data-disposition]').forEach((button) => {
    button.addEventListener('click', () => {
      const d = button.dataset.disposition as keyof typeof INTEL_SCRIPT_PACKS | undefined
      if (d && INTEL_SCRIPT_PACKS[d]) {
        disposition = d
        syncDispositionUI(root, disposition)
      }
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-mark-visited]').forEach((button) => {
    button.addEventListener('click', () => {
      const voterId = button.dataset.voterId
      if (!voterId) return
      openLogModal(voterId, false)
      button.innerHTML = '<span class="material-symbols-outlined align-middle text-sm fill mr-1">check_circle</span> Visited'
      button.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300')
      button.classList.remove('text-primary', 'border-primary/30')
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-log-ballot-request]').forEach((button) => {
    button.addEventListener('click', () => {
      const voterId = button.dataset.voterId
      if (!voterId) return
      openLogModal(voterId, true)
    })
  })
}
