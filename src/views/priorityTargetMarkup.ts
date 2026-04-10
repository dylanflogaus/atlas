import type { Voter } from '../data'

export function partyChip(party: string): string {
  if (party === 'REP')
    return `<div class="bg-secondary/15 px-2 py-1 rounded-sm"><span class="text-[10px] font-black text-secondary uppercase tracking-wide">${party}</span></div>`
  if (party === 'IND')
    return `<div class="bg-amber-500/15 px-2 py-1 rounded-sm"><span class="text-[10px] font-black text-amber-700 uppercase tracking-wide">${party}</span></div>`
  if (party === 'DEM')
    return `<div class="bg-sky-600/15 px-2 py-1 rounded-sm"><span class="text-[10px] font-black text-sky-800 uppercase tracking-wide">${party}</span></div>`
  if (party === 'PERS')
    return `<div class="bg-violet-500/15 px-2 py-1 rounded-sm"><span class="text-[10px] font-black text-violet-800 uppercase tracking-wide">${party}</span></div>`
  return `<div class="bg-surface-container-high px-2 py-1 rounded-sm"><span class="text-[10px] font-black text-on-surface-variant uppercase tracking-wide">${party}</span></div>`
}

export function cardAccent(party: string): string {
  if (party === 'REP') return 'border-b-4 border-primary'
  if (party === 'IND') return 'border-b-4 border-amber-500'
  if (party === 'DEM') return 'border-b-4 border-sky-600'
  if (party === 'PERS') return 'border-b-4 border-violet-500'
  return 'border-b-4 border-surface-dim'
}

/** Shared header, party chip, support / reliability — used by dashboard cards and map popups. */
export function priorityTargetBodyHtml(v: Voter): string {
  return `
      <div class="flex justify-between items-start mb-3">
        <button type="button" data-goto="/voters/${v.id}" class="text-left">
          <h3 class="font-headline font-bold text-lg leading-tight text-on-surface">${v.name}</h3>
          <p class="text-[10px] font-black text-secondary tracking-widest uppercase mt-0.5">${v.address}</p>
        </button>
        ${partyChip(v.party)}
      </div>
      <div class="flex gap-6 mb-6">
        <div class="flex flex-col">
          <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Support Score</span>
          <span class="font-mono text-2xl font-black text-primary">${v.supportScore}%</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Reliability</span>
          <span class="font-mono text-2xl font-black text-secondary">${v.reliability}</span>
        </div>
      </div>`
}

export function priorityCard(v: Voter): string {
  return `
    <article class="min-w-[280px] snap-start bg-surface-container-low/95 p-5 flex flex-col ${cardAccent(v.party)} shadow-lg shadow-black/20 ring-1 ring-black/10 backdrop-blur-md">
      ${priorityTargetBodyHtml(v)}
      <a href="#/voters/${v.id}" class="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline mt-1 w-fit">
        Open voter file<span class="text-[0.92em] opacity-90" aria-hidden="true">→</span>
      </a>
    </article>`
}
