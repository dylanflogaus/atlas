import type { BallotChaserAchievement } from '../data'

type UnlockedTierVisual = {
  card: string
  iconBox: string
  icon: string
  title: string
  desc: string
  pill: string
  pillLabel: string
  glowBlob: string
}

function unlockedTierVisual(a: BallotChaserAchievement): UnlockedTierVisual {
  if (a.tier === 'gold') {
    return {
      card: 'bg-gradient-to-br from-amber-100/95 via-yellow-50/90 to-amber-500/50 ring-[3px] ring-amber-300/90 shadow-[0_16px_44px_-10px_rgba(245,158,11,0.65),0_4px_16px_-4px_rgba(180,83,9,0.35),inset_0_1px_0_0_rgba(255,255,255,0.55)] hover:shadow-[0_20px_48px_-10px_rgba(245,158,11,0.7),0_6px_20px_-4px_rgba(180,83,9,0.4),inset_0_1px_0_0_rgba(255,255,255,0.6)]',
      iconBox:
        'bg-gradient-to-br from-yellow-50 via-amber-300 to-amber-700 shadow-[0_8px_20px_-6px_rgba(180,83,9,0.55),inset_0_2px_0_0_rgba(255,255,255,0.45)] ring-2 ring-amber-100/95',
      icon: 'text-amber-950 drop-shadow-[0_2px_3px_rgba(255,255,255,0.5)]',
      title: 'text-amber-950',
      desc: 'text-amber-950/85',
      pill: 'border border-amber-800/25 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-amber-50 shadow-md shadow-amber-900/30',
      pillLabel: 'Gold · Unlocked',
      glowBlob: 'bg-amber-400/35',
    }
  }
  if (a.tier === 'silver') {
    return {
      card: 'bg-gradient-to-br from-white/95 via-sky-50/90 to-slate-400/50 ring-[3px] ring-sky-200/95 shadow-[0_16px_44px_-10px_rgba(56,189,248,0.4),0_4px_16px_-4px_rgba(100,116,139,0.3),inset_0_1px_0_0_rgba(255,255,255,0.85)] hover:shadow-[0_20px_48px_-10px_rgba(56,189,248,0.48),0_6px_20px_-4px_rgba(100,116,139,0.35),inset_0_1px_0_0_rgba(255,255,255,0.9)]',
      iconBox:
        'bg-gradient-to-br from-white via-slate-100 to-slate-500 shadow-[0_8px_20px_-6px_rgba(71,85,105,0.45),inset_0_2px_0_0_rgba(255,255,255,0.9)] ring-2 ring-white',
      icon: 'text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]',
      title: 'text-slate-900',
      desc: 'text-slate-700/90',
      pill: 'border border-slate-600/35 bg-gradient-to-r from-sky-500 via-slate-500 to-slate-700 text-white shadow-md shadow-slate-900/25',
      pillLabel: 'Silver · Unlocked',
      glowBlob: 'bg-sky-300/40',
    }
  }
  if (a.tier === 'bronze') {
    return {
      card: 'bg-gradient-to-br from-orange-100/95 via-amber-50/85 to-orange-700/45 ring-[3px] ring-orange-300/90 shadow-[0_16px_44px_-10px_rgba(249,115,22,0.5),0_4px_16px_-4px_rgba(154,52,18,0.35),inset_0_1px_0_0_rgba(255,255,255,0.45)] hover:shadow-[0_20px_48px_-10px_rgba(249,115,22,0.55),0_6px_20px_-4px_rgba(154,52,18,0.4),inset_0_1px_0_0_rgba(255,255,255,0.5)]',
      iconBox:
        'bg-gradient-to-br from-orange-50 via-orange-300 to-orange-800 shadow-[0_8px_20px_-6px_rgba(154,52,18,0.5),inset_0_2px_0_0_rgba(255,255,255,0.35)] ring-2 ring-orange-100/90',
      icon: 'text-orange-950 drop-shadow-[0_1px_2px_rgba(255,237,213,0.6)]',
      title: 'text-orange-950',
      desc: 'text-orange-950/85',
      pill: 'border border-orange-900/30 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800 text-orange-50 shadow-md shadow-orange-950/30',
      pillLabel: 'Bronze · Unlocked',
      glowBlob: 'bg-orange-400/40',
    }
  }
  return {
    card: 'bg-gradient-to-br from-primary/50 via-fuchsia-500/35 to-secondary/50 ring-[3px] ring-primary/85 shadow-[0_16px_44px_-10px_rgba(200,16,46,0.45),0_4px_16px_-4px_rgba(147,51,234,0.25),inset_0_1px_0_0_rgba(255,255,255,0.35)] hover:shadow-[0_20px_48px_-10px_rgba(200,16,46,0.52),0_6px_20px_-4px_rgba(147,51,234,0.3),inset_0_1px_0_0_rgba(255,255,255,0.42)]',
    iconBox:
      'bg-gradient-to-br from-primary-container via-primary to-primary shadow-[0_8px_20px_-6px_rgba(200,16,46,0.45),inset_0_2px_0_0_rgba(255,255,255,0.25)] ring-2 ring-white/35',
    icon: 'text-on-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]',
    title: 'text-on-primary-container',
    desc: 'text-on-surface',
    pill: 'border border-primary/35 bg-gradient-to-r from-primary via-fuchsia-600 to-secondary text-on-primary shadow-md shadow-primary/35',
    pillLabel: 'Unlocked',
    glowBlob: 'bg-fuchsia-400/30',
  }
}

/** Locked + unlocked achievement rows (matches Progress page styling). */
export function renderAchievementChip(a: BallotChaserAchievement): string {
  const locked = !a.unlocked

  if (locked) {
    return `
    <div
      class="achievement-chip--locked flex gap-4 rounded-2xl border-2 border-dashed border-outline-variant/50 bg-surface-container-highest/70 px-4 py-4 shadow-none ring-1 ring-inset ring-outline-variant/[0.07]"
      title="${a.description}"
    >
      <div class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest/70 ring-1 ring-outline-variant/25">
        <span class="material-symbols-outlined text-[28px] text-on-surface-variant/30 saturate-0 opacity-80" aria-hidden="true">${a.icon}</span>
        <span class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-highest ring-1 ring-outline-variant/45 shadow-sm" aria-hidden="true">
          <span class="material-symbols-outlined text-[15px] text-on-surface-variant/55">lock</span>
        </span>
      </div>
      <div class="min-w-0 flex-1 text-left">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p class="font-headline text-sm font-bold uppercase tracking-tight text-on-surface-variant/60">${a.title}</p>
          <span class="shrink-0 rounded-lg border border-outline-variant/40 bg-surface-container-lowest/80 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-on-surface-variant/75">Not unlocked</span>
        </div>
        <p class="mt-1.5 text-[11px] font-medium leading-snug text-on-surface-variant/40 line-clamp-2">${a.description}</p>
        <p class="mt-2.5 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/35">
          <span class="material-symbols-outlined text-[14px] opacity-70" aria-hidden="true">progress_activity</span>
          Requirement not met yet
        </p>
      </div>
    </div>`
  }

  const v = unlockedTierVisual(a)
  return `
    <div
      class="achievement-chip--unlocked relative flex gap-4 overflow-hidden rounded-2xl px-4 py-4 transition-[transform,filter] duration-200 hover:scale-[1.02] hover:brightness-[1.03] ${v.card}"
      title="${a.description}"
    >
      <div class="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -right-4 -top-16 h-36 w-36 rounded-full bg-white/30 blur-3xl" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full ${v.glowBlob} blur-3xl" aria-hidden="true"></div>
      <div class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${v.iconBox}">
        <span class="material-symbols-outlined text-[28px] shrink-0 ${v.icon} fill" aria-hidden="true">${a.icon}</span>
      </div>
      <div class="relative min-w-0 flex-1 self-center text-left">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <p class="font-headline text-sm font-black uppercase tracking-tight leading-tight ${v.title}">${a.title}</p>
          <span class="shrink-0 rounded-lg px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${v.pill}">${v.pillLabel}</span>
        </div>
        <p class="mt-1.5 text-[11px] font-medium leading-relaxed line-clamp-2 ${v.desc}">${a.description}</p>
      </div>
    </div>`
}
