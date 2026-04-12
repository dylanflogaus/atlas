import { ballotChasers } from '../data'
import { navigate } from '../router'
import { readCanvassTourOrder } from '../canvassFlow'
import { bindAchievementSectionToggles, renderChaserAchievementsBlock } from './chaserAchievementsSection'

function pct(cur: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((cur / goal) * 100))
}

export function renderCanvassGoals(): string {
  const tour = readCanvassTourOrder()
  if (!tour) {
    return `
      <main class="mx-auto max-w-lg px-4 pb-nav pt-6">
        <p class="text-sm text-on-surface-variant">No active route. Start a route from the map.</p>
        <a href="#/" class="mt-4 inline-flex font-bold text-primary">Back to route →</a>
      </main>`
  }

  const chaser = ballotChasers[0]
  if (!chaser) {
    return `
      <main class="mx-auto max-w-lg px-4 pb-nav pt-6">
        <p class="text-sm text-on-surface-variant">Progress data unavailable.</p>
      </main>`
  }

  const doorPct = pct(chaser.doorsKnocked, chaser.doorsGoal)
  const ballotPct = pct(chaser.ballotsSecured, chaser.ballotGoal)
  const doorsLeft = Math.max(0, chaser.doorsGoal - chaser.doorsKnocked)
  const ballotsLeft = Math.max(0, chaser.ballotGoal - chaser.ballotsSecured)

  return `
    <main class="canvass-goals atlas-route-flow-page mx-auto w-full max-w-lg space-y-6 px-4 pb-28 pt-4 sm:px-6">
      <div>
        <p class="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Shift goals</p>
        <h2 class="mt-1 font-headline text-2xl font-black tracking-tight text-on-surface">Your progress</h2>
        <p class="mt-2 text-sm text-on-surface-variant leading-relaxed">
          ${tour.length} doors in today’s route order. Here’s how close you are to your numeric goals and the same achievements roster as on Progress.
        </p>
      </div>

      <section class="space-y-4 rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        <div class="space-y-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">Doors knocked</span>
            <span class="font-mono text-sm font-black text-on-surface">${chaser.doorsKnocked}<span class="text-on-surface-variant font-bold"> / ${chaser.doorsGoal}</span></span>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-surface-container-highest ring-1 ring-outline-variant/25">
            <div class="atlas-route-flow-goals-meter__fill atlas-route-flow-goals-meter__fill--doors h-full rounded-full bg-gradient-to-r from-primary via-primary-container to-secondary shadow-sm" style="width: ${doorPct}%"></div>
          </div>
          <p class="text-xs font-medium text-on-surface-variant">${doorsLeft === 0 ? 'Door goal met — great work.' : `${doorsLeft} more doors to hit your door goal.`}</p>
        </div>
        <div class="space-y-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">Ballots secured</span>
            <span class="font-mono text-sm font-black text-on-surface">${chaser.ballotsSecured}<span class="text-on-surface-variant font-bold"> / ${chaser.ballotGoal}</span></span>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-surface-container-highest ring-1 ring-outline-variant/25">
            <div class="atlas-route-flow-goals-meter__fill atlas-route-flow-goals-meter__fill--ballots h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 shadow-sm" style="width: ${ballotPct}%"></div>
          </div>
          <p class="text-xs font-medium text-on-surface-variant">${ballotsLeft === 0 ? 'Ballot goal met for this sprint.' : `${ballotsLeft} more ballot touches to reach your ballot goal.`}</p>
        </div>
      </section>

      <section class="rounded-2xl border border-outline-variant/12 bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
        ${renderChaserAchievementsBlock(chaser.achievements, { rootClass: 'relative mt-0' })}
      </section>

      <div class="atlas-route-flow-cta-bar fixed bottom-16 left-0 right-0 z-30 border-t border-outline-variant/15 bg-surface/95 px-4 py-3 backdrop-blur-md safe-bottom">
        <button type="button" data-canvass-goals-continue class="mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-headline text-sm font-black uppercase tracking-widest text-on-primary shadow-md active:scale-[0.99] transition-transform">
          Continue to walk list
          <span class="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </div>
    </main>`
}

export function bindCanvassGoals(root: HTMLElement): void {
  bindAchievementSectionToggles(root)
  root.querySelector('[data-canvass-goals-continue]')?.addEventListener('click', () => {
    navigate('#/canvass/walk/0')
  })
}
