import type { BallotChaser } from '../data'
import { ballotChasers } from '../data'
import { bindAchievementSectionToggles, renderChaserAchievementsBlock } from './chaserAchievementsSection'
import { renderVolunteerLeaderboardSection } from './volunteerLeaderboard'

function pct(cur: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((cur / goal) * 100))
}

function chaserCard(c: BallotChaser): string {
  const defaultVisibleActions = 3
  const doorPct = pct(c.doorsKnocked, c.doorsGoal)
  const ballotPct = pct(c.ballotsSecured, c.ballotGoal)
  const hasHiddenActions = c.recentActions.length > defaultVisibleActions
  const timelineHtml = c.recentActions
    .map(
      (act, idx) => `
      <li class="relative pl-5 ${idx >= defaultVisibleActions ? 'hidden' : ''}" data-action-item="${idx >= defaultVisibleActions ? 'hidden' : 'visible'}">
        <span class="absolute left-0 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary shadow-[0_0_0_4px_var(--color-surface-container-low)] ring-1 ring-primary-container"></span>
        <p class="text-[10px] font-bold uppercase tracking-widest text-secondary">${act.time}</p>
        <p class="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-secondary text-[18px]">${act.icon}</span>
          ${act.summary}
        </p>
        <p class="text-xs text-on-surface-variant mt-0.5 leading-snug pl-[26px]">${act.detail}</p>
      </li>`,
    )
    .join('')

  return `
    <article class="rounded-2xl bg-surface-container-low p-5 shadow-md ring-1 ring-outline-variant/15 overflow-hidden relative">
      <div class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/8 blur-2xl"></div>
      <div class="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-secondary/10 blur-xl"></div>
      <div class="relative flex flex-col sm:flex-row sm:items-start gap-4">
        <div class="flex items-center gap-4 shrink-0">
          <div class="relative">
            <img src="${c.photoUrl}" alt="" class="h-16 w-16 rounded-2xl object-cover ring-2 ring-white shadow-lg" width="64" height="64" />
            <span class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-on-primary text-[10px] font-black font-headline shadow-md">${c.streakDays}d</span>
          </div>
          <div class="min-w-0">
            <h2 class="font-headline text-lg font-black text-on-surface tracking-tight">${c.name}</h2>
            <p class="text-xs font-bold uppercase tracking-widest text-secondary">${c.role}</p>
            <p class="mt-1 inline-flex items-center rounded-md bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold text-on-surface-variant ring-1 ring-outline-variant/20">
              <span class="material-symbols-outlined text-[14px] mr-0.5">near_me</span>
              ${c.zone}
            </p>
          </div>
        </div>
        <div class="flex-1 w-full space-y-4 min-w-0">
          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">Doors knocked</span>
              <span class="font-mono text-sm font-black text-on-surface">${c.doorsKnocked}<span class="text-on-surface-variant font-bold"> / ${c.doorsGoal}</span></span>
            </div>
            <div class="h-3 rounded-full bg-surface-container-highest overflow-hidden ring-1 ring-outline-variant/25">
              <div class="atlas-route-flow-goals-meter__fill atlas-route-flow-goals-meter__fill--doors h-full rounded-full bg-gradient-to-r from-primary via-primary-container to-secondary shadow-sm" style="width: ${doorPct}%"></div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">Ballots secured</span>
              <span class="font-mono text-sm font-black text-on-surface">${c.ballotsSecured}<span class="text-on-surface-variant font-bold"> / ${c.ballotGoal}</span></span>
            </div>
            <div class="h-3 rounded-full bg-surface-container-highest overflow-hidden ring-1 ring-outline-variant/25">
              <div class="atlas-route-flow-goals-meter__fill atlas-route-flow-goals-meter__fill--ballots h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 shadow-sm" style="width: ${ballotPct}%"></div>
            </div>
          </div>
          ${renderVolunteerLeaderboardSection(c, {
            headingId: 'progress-lb-heading',
            wrapClass: 'mission-complete-leaderboard atlas-progress-embed-leaderboard',
          })}
        </div>
      </div>

      ${renderChaserAchievementsBlock(c.achievements)}

      <div class="relative mt-6 pt-5 border-t border-outline-variant/20">
        <h3 class="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[18px]">history</span>
          Past actions
        </h3>
        <ul class="space-y-4 border-l-2 border-primary/20 ml-1.5 pl-0 list-none m-0 p-0">
          ${timelineHtml}
        </ul>
        ${
          hasHiddenActions
            ? `<div class="mt-4">
                <button
                  type="button"
                  data-action="toggle-actions"
                  aria-expanded="false"
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/35 hover:bg-primary/10 transition-colors"
                >
                  <span data-role="toggle-actions-label">More</span>
                  <span class="material-symbols-outlined text-base" data-role="toggle-actions-icon">expand_more</span>
                </button>
              </div>`
            : ''
        }
      </div>

    </article>`
}

export function renderChaserProgress(): string {
  const currentChaser = ballotChasers[0]
  if (!currentChaser) {
    return `
      <main class="atlas-progress-page w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-nav">
        <section class="rounded-2xl bg-surface-container-low p-5 ring-1 ring-outline-variant/20">
          <h1 class="font-headline text-xl font-black text-on-surface">Your progress</h1>
          <p class="mt-2 text-sm text-on-surface-variant">No personal progress data is available yet.</p>
        </section>
      </main>`
  }

  const cardHtml = chaserCard(currentChaser)

  return `
    <main class="atlas-progress-page w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-nav space-y-5">
      <header class="atlas-progress-page__header">
        <h1 class="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight text-on-surface">Your progress</h1>
        <p class="mt-1 text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Field goals, achievements, and volunteer standings in one place.
        </p>
      </header>

      <section class="atlas-progress-page__activity">
        <div class="space-y-5">${cardHtml}</div>
      </section>
    </main>`
}

export function bindChaserProgress(root: HTMLElement): void {
  const toggleBtn = root.querySelector<HTMLButtonElement>('[data-action="toggle-actions"]')
  if (toggleBtn) {
    const hiddenActions = root.querySelectorAll<HTMLLIElement>('li[data-action-item="hidden"]')
    const label = toggleBtn.querySelector<HTMLElement>('[data-role="toggle-actions-label"]')
    const icon = toggleBtn.querySelector<HTMLElement>('[data-role="toggle-actions-icon"]')
    let expanded = false

    toggleBtn.addEventListener('click', () => {
      expanded = !expanded
      hiddenActions.forEach((item) => item.classList.toggle('hidden', !expanded))
      toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
      if (label) label.textContent = expanded ? 'Less' : 'More'
      if (icon) icon.textContent = expanded ? 'expand_less' : 'expand_more'
    })
  }

  bindAchievementSectionToggles(root)
}
