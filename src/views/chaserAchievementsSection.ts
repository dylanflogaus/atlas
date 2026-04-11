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
          fade: 'data-locked-fade',
          extra: 'data-locked-extra',
          action: 'toggle-locked-achievements',
          count: 'data-locked-extra-count',
        }
      : {
          root: 'data-recent-achievements',
          fade: 'data-recent-fade',
          extra: 'data-recent-extra',
          action: 'toggle-recent-achievements',
          count: 'data-recent-extra-count',
        }
  return `<div ${attrs.root}>
                    <div class="relative">
                      <div class="flex flex-col ${listGapClass}">${previewHtml}</div>
                      <div
                        class="pointer-events-none absolute inset-x-0 bottom-0 h-[4.5rem] bg-gradient-to-t from-surface-container-low from-[18%] via-surface-container-low/75 to-transparent"
                        ${attrs.fade}
                        aria-hidden="true"
                      ></div>
                    </div>
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
        <h3 class="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[18px] fill">emoji_events</span>
          Achievements
        </h3>
        <p class="mb-4 text-[10px] font-medium leading-snug text-on-surface-variant/75">
          Colorful cards are <span class="font-bold text-on-surface-variant">unlocked</span>. Dashed rows with a lock badge are <span class="font-bold text-on-surface-variant">not unlocked yet</span>.
        </p>

        <div class="space-y-2">
          <h4 class="font-headline text-[10px] font-black uppercase tracking-[0.18em] text-secondary flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary text-base fill">verified</span>
            Recent achievements
          </h4>
          <p class="text-[10px] text-on-surface-variant/80 leading-snug">Newest unlocks shown first.</p>
          ${
            unlocked.length === 0
              ? `<p class="text-[11px] font-medium text-on-surface-variant/70 italic">No unlocked achievements yet — keep knocking.</p>`
              : collapsibleAchievementSection(recentPreviewHtml, recentExtraHtml, recentExtra.length, 'recent')
          }
        </div>

        <div class="mt-5 space-y-2 border-t border-outline-variant/15 pt-5">
          <h4 class="font-headline text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant flex items-center gap-2">
            <span class="material-symbols-outlined text-on-surface-variant/60 text-base">lock_clock</span>
            Not unlocked yet
          </h4>
          <p class="text-[10px] text-on-surface-variant/75 leading-snug">Complete each requirement to move these into Recent achievements.</p>
          ${
            locked.length === 0
              ? `<p class="text-[11px] font-medium text-emerald-800/90">All roster achievements unlocked — outstanding.</p>`
              : collapsibleAchievementSection(lockedPreviewHtml, lockedExtraHtml, lockedExtra.length, 'locked')
          }
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
      fade: 'data-locked-fade',
      countKey: 'lockedExtraCount' as const,
    },
    {
      action: 'toggle-recent-achievements',
      root: 'data-recent-achievements',
      extra: 'data-recent-extra',
      fade: 'data-recent-fade',
      countKey: 'recentExtraCount' as const,
    },
  ] as const

  for (const cfg of achievementToggleBindings) {
    root.querySelectorAll<HTMLButtonElement>(`[data-action="${cfg.action}"]`).forEach((btn) => {
      const wrap = btn.closest(`[${cfg.root}]`)
      if (!wrap) return
      const extra = wrap.querySelector<HTMLElement>(`[${cfg.extra}]`)
      const fade = wrap.querySelector<HTMLElement>(`[${cfg.fade}]`)
      const label = btn.querySelector<HTMLElement>('[data-role="achievement-toggle-label"]')
      const icon = btn.querySelector<HTMLElement>('[data-role="achievement-toggle-icon"]')
      const extraCount = btn.dataset[cfg.countKey] ?? '0'
      let expanded = false

      btn.addEventListener('click', () => {
        expanded = !expanded
        extra?.classList.toggle('hidden', !expanded)
        fade?.classList.toggle('hidden', expanded)
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false')
        if (label) label.textContent = expanded ? 'Show less' : `Show more (${extraCount})`
        if (icon) icon.textContent = expanded ? 'expand_less' : 'expand_more'
      })
    })
  }
}
