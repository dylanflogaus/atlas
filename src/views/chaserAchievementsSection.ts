import type { BallotChaserAchievement } from '../data'
import { renderAchievementChip } from './achievementChips'

const ACHIEVEMENT_SECTION_PREVIEW = 2

function collapsibleAchievementSection(
  previewHtml: string,
  extraHtml: string,
  extraCount: number,
  variant: 'locked' | 'recent',
): string {
  const listGapClass = variant === 'recent' ? 'gap-3' : 'gap-2'
  const extraPaddingClass = variant === 'recent' ? 'pt-3' : 'pt-2'
  if (extraCount === 0) {
    return `<div class="flex flex-col ${listGapClass}">${previewHtml}</div>`
  }
  const attrs =
    variant === 'locked'
      ? {
          root: 'data-locked-achievements',
          extra: 'data-locked-extra',
          action: 'toggle-locked-achievements',
          count: 'data-locked-extra-count',
        }
      : {
          root: 'data-recent-achievements',
          extra: 'data-recent-extra',
          action: 'toggle-recent-achievements',
          count: 'data-recent-extra-count',
        }
  return `<div ${attrs.root}>
                    <div class="flex flex-col ${listGapClass}">${previewHtml}</div>
                    <div class="flex flex-col ${listGapClass} hidden ${extraPaddingClass}" ${attrs.extra}>${extraHtml}</div>
                    <div class="mt-3">
                      <button
                        type="button"
                        data-action="${attrs.action}"
                        ${attrs.count}="${extraCount}"
                        aria-expanded="false"
                        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/35 hover:bg-primary/10 transition-colors"
                      >
                        <span data-role="achievement-toggle-label">Show more (${extraCount})</span>
                        <span class="material-symbols-outlined text-base" data-role="achievement-toggle-icon">expand_more</span>
                      </button>
                    </div>
                  </div>`
}

export type ChaserAchievementsBlockOptions = {
  /** Outer wrapper classes (default matches Progress chaser card spacing). Ignored when fixedOverlay is true. */
  rootClass?: string
  /** Pin to the top of the viewport above shell chrome; scrolls internally if tall. */
  fixedOverlay?: boolean
}

function renderChaserAchievementsBlockInner(
  achievements: BallotChaserAchievement[],
  rootClass: string,
): string {
  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)
  const unlockedNewestFirst = [...unlocked].reverse()
  const recentPreview = unlockedNewestFirst.slice(0, ACHIEVEMENT_SECTION_PREVIEW)
  const recentExtra = unlockedNewestFirst.slice(ACHIEVEMENT_SECTION_PREVIEW)
  const recentPreviewHtml = recentPreview.map(renderAchievementChip).join('')
  const recentExtraHtml = recentExtra.map(renderAchievementChip).join('')
  const lockedPreview = locked.slice(0, ACHIEVEMENT_SECTION_PREVIEW)
  const lockedExtra = locked.slice(ACHIEVEMENT_SECTION_PREVIEW)
  const lockedPreviewHtml = lockedPreview.map(renderAchievementChip).join('')
  const lockedExtraHtml = lockedExtra.map(renderAchievementChip).join('')

  return `
      <div class="${rootClass}">
        <div
          class="atlas-progress-achievements-panel relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.09] via-surface-container-highest/35 to-primary/[0.07] p-4 shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.07)] ring-1 ring-outline-variant/15 sm:p-5"
          role="region"
          aria-labelledby="atlas-achievements-heading"
        >
          <div class="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-amber-400/18 blur-3xl" aria-hidden="true"></div>
          <div class="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-primary/14 blur-2xl" aria-hidden="true"></div>
          <div
            class="pointer-events-none absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-amber-400 via-amber-500/80 to-primary/55 opacity-90"
            aria-hidden="true"
          ></div>

          <div class="relative pl-3 sm:pl-4">
            <header class="mb-5 flex items-start gap-3 sm:mb-6 sm:items-center">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-800 text-white shadow-[0_10px_28px_-8px_rgba(217,119,6,0.55)] ring-2 ring-amber-200/55"
                aria-hidden="true"
              >
                <span class="material-symbols-outlined text-[26px] fill">emoji_events</span>
              </div>
              <div class="min-w-0 pt-0.5 sm:pt-0">
                <h3 id="atlas-achievements-heading" class="font-headline text-base font-black tracking-tight text-on-surface sm:text-lg">
                  Achievements
                </h3>
                <p class="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/90">
                  Roster badges & milestones
                </p>
              </div>
            </header>

            <div class="space-y-5">
              <div class="space-y-2 rounded-xl bg-surface-container-low/70 p-3 ring-1 ring-outline-variant/[0.08] backdrop-blur-[2px] sm:p-4">
                <h4 class="font-headline flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                  <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/18 text-secondary ring-1 ring-secondary/25">
                    <span class="material-symbols-outlined text-base fill">verified</span>
                  </span>
                  Recent achievements
                </h4>
                <p class="text-[10px] text-on-surface-variant/85 leading-snug pl-0.5">Newest unlocks shown first.</p>
                ${
                  unlocked.length === 0
                    ? `<p class="rounded-lg border border-dashed border-outline-variant/35 bg-surface-container-highest/40 px-3 py-3 text-[11px] font-medium italic text-on-surface-variant/75">No unlocked achievements yet — keep knocking.</p>`
                    : collapsibleAchievementSection(recentPreviewHtml, recentExtraHtml, recentExtra.length, 'recent')
                }
              </div>

              <div class="space-y-2 rounded-xl bg-surface-container-low/55 p-3 ring-1 ring-outline-variant/[0.08] backdrop-blur-[2px] sm:p-4">
                <h4 class="font-headline flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-on-surface-variant/12 text-on-surface-variant ring-1 ring-outline-variant/30">
                    <span class="material-symbols-outlined text-base">lock_clock</span>
                  </span>
                  Not unlocked yet
                </h4>
                <p class="text-[10px] text-on-surface-variant/80 leading-snug pl-0.5">
                  Complete each requirement to move these into Recent achievements.
                </p>
                ${
                  locked.length === 0
                    ? `<p class="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2.5 text-[11px] font-semibold text-emerald-800/95">All roster achievements unlocked — outstanding.</p>`
                    : collapsibleAchievementSection(lockedPreviewHtml, lockedExtraHtml, lockedExtra.length, 'locked')
                }
              </div>
            </div>
          </div>
        </div>
      </div>`
}

/** Same achievements block as the Progress page (recent + locked, collapsible). */
export function renderChaserAchievementsBlock(
  achievements: BallotChaserAchievement[],
  options?: ChaserAchievementsBlockOptions,
): string {
  const rootClass = options?.fixedOverlay ? 'relative mt-0' : (options?.rootClass ?? 'relative mt-6')
  const inner = renderChaserAchievementsBlockInner(achievements, rootClass)

  if (options?.fixedOverlay) {
    return `
    <div
      class="atlas-achievements-fixed-overlay fixed left-0 right-0 top-0 z-[500] max-h-[min(72vh,32rem)] overflow-y-auto overscroll-y-contain border-b border-outline-variant/25 bg-surface-container-low/98 shadow-[0_12px_40px_rgb(0_0_0_/_0.14)] backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-3 [scrollbar-gutter:stable]"
      data-atlas-achievements-overlay
      role="region"
      aria-label="Achievements"
    >
      <div class="mx-auto w-full max-w-6xl px-3 sm:px-6">${inner}</div>
    </div>`
  }

  return inner
}

export function bindAchievementSectionToggles(root: HTMLElement): void {
  const achievementToggleBindings = [
    {
      action: 'toggle-locked-achievements',
      root: 'data-locked-achievements',
      extra: 'data-locked-extra',
      countKey: 'lockedExtraCount' as const,
    },
    {
      action: 'toggle-recent-achievements',
      root: 'data-recent-achievements',
      extra: 'data-recent-extra',
      countKey: 'recentExtraCount' as const,
    },
  ] as const

  for (const cfg of achievementToggleBindings) {
    root.querySelectorAll<HTMLButtonElement>(`[data-action="${cfg.action}"]`).forEach((btn) => {
      const wrap = btn.closest(`[${cfg.root}]`)
      if (!wrap) return
      const extra = wrap.querySelector<HTMLElement>(`[${cfg.extra}]`)
      const label = btn.querySelector<HTMLElement>('[data-role="achievement-toggle-label"]')
      const icon = btn.querySelector<HTMLElement>('[data-role="achievement-toggle-icon"]')
      const extraCount = btn.dataset[cfg.countKey] ?? '0'
      let expanded = false

      btn.addEventListener('click', () => {
        expanded = !expanded
        extra?.classList.toggle('hidden', !expanded)
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
        if (label) label.textContent = expanded ? 'Show less' : `Show more (${extraCount})`
        if (icon) icon.textContent = expanded ? 'expand_less' : 'expand_more'
      })
    })
  }
}
