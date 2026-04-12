import type { BallotChaser } from '../data'
import { ballotChasers } from '../data'

function compareVolunteerStanding(a: BallotChaser, b: BallotChaser): number {
  if (b.ballotsSecured !== a.ballotsSecured) return b.ballotsSecured - a.ballotsSecured
  if (b.doorsKnocked !== a.doorsKnocked) return b.doorsKnocked - a.doorsKnocked
  return b.streakDays - a.streakDays
}

export type VolunteerLeaderboardOptions = {
  headingId?: string
  wrapClass?: string
}

export function renderVolunteerLeaderboardSection(
  you: BallotChaser | undefined,
  opts?: VolunteerLeaderboardOptions,
): string {
  if (!ballotChasers.length) return ''

  const headingId = opts?.headingId ?? 'mission-lb-heading'
  const wrapClass = opts?.wrapClass ?? 'mission-complete-leaderboard mb-8'

  const youId = you?.id
  const ranked = [...ballotChasers]
    .sort(compareVolunteerStanding)
    .map((chaser, idx) => ({ rank: idx + 1, chaser }))

  const rows = ranked
    .map(({ rank, chaser }) => {
      const isYou = chaser.id === youId
      const medal =
        rank === 1
          ? '<span class="material-symbols-outlined text-amber-500 text-lg fill" aria-hidden="true">emoji_events</span>'
          : rank === 2
            ? '<span class="material-symbols-outlined text-slate-400 text-lg" aria-hidden="true">military_tech</span>'
            : rank === 3
              ? '<span class="material-symbols-outlined text-amber-800/70 text-lg" aria-hidden="true">military_tech</span>'
              : `<span class="mission-complete-lb-rank font-headline text-xs font-black text-on-surface-variant tabular-nums w-6 text-center">${rank}</span>`

      return `
        <li class="mission-complete-lb-row flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition-colors ${
          isYou
            ? 'bg-primary/10 ring-primary/35 shadow-sm'
            : 'bg-surface-container-lowest/80 ring-outline-variant/15'
        }" ${isYou ? 'data-mission-lb-you aria-current="true"' : ''}>
          <div class="flex w-7 shrink-0 items-center justify-center">${medal}</div>
          <img src="${chaser.photoUrl}" alt="" class="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-outline-variant/20" width="36" height="36" />
          <div class="min-w-0 flex-1">
            <p class="font-headline text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
              ${chaser.name}
              ${
                isYou
                  ? '<span class="shrink-0 rounded bg-primary px-1.5 py-0.5 font-label text-[9px] font-black uppercase tracking-wider text-on-primary">You</span>'
                  : ''
              }
            </p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-secondary truncate">${chaser.zone}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-mono text-sm font-black text-on-surface tabular-nums">${chaser.ballotsSecured}</p>
            <p class="font-label text-[9px] font-bold uppercase tracking-tight text-on-surface-variant">ballots</p>
          </div>
        </li>`
    })
    .join('')

  const yourRank = youId ? ranked.find((r) => r.chaser.id === youId)?.rank : undefined

  return `
      <section class="${wrapClass} rounded-2xl bg-surface-container-highest p-5 shadow-md ring-1 ring-outline-variant/20" aria-labelledby="${headingId}">
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span class="material-symbols-outlined text-2xl" aria-hidden="true">leaderboard</span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 id="${headingId}" class="font-headline text-sm font-black uppercase tracking-wide text-on-surface">Volunteer leaderboard</h3>
            <p class="mt-0.5 text-xs text-on-surface-variant leading-snug">
              Shift standings by ballots secured — ${yourRank != null ? `<span class="font-bold text-primary">You're #${yourRank}</span> of ${ranked.length}.` : 'See how you stack up.'}
            </p>
          </div>
        </div>
        <ol class="m-0 flex list-none flex-col gap-2 p-0" aria-label="Volunteer standings">
          ${rows}
        </ol>
      </section>`
}
