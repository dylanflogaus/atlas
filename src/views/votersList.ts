import type { Voter } from '../data'
import { voters } from '../data'
import { navigate } from '../router'

function voterSearchHaystack(v: Voter): string {
  return `${v.name} ${v.address} ${v.cityState} ${v.district}`.toLowerCase()
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function row(v: Voter, index: number): string {
  const partyClass =
    v.party === 'IND' ? 'text-amber-700 bg-amber-500/15' : v.party === 'REP' ? 'text-secondary bg-secondary/15' : 'text-on-surface-variant bg-surface-container-high'

  return `
    <button type="button" style="--voters-i:${index}" data-voter-row data-party="${v.party}" data-voter-search="${escapeAttr(voterSearchHaystack(v))}" data-goto="/voters/${v.id}" class="voters-row w-full text-left bg-surface-container-low hover:bg-surface-container-high transition-colors p-4 rounded-lg shadow-sm flex items-center gap-4">
      <img src="${v.photoUrl}" alt="" class="h-14 w-14 rounded-lg object-cover shrink-0 ring-2 ring-white shadow" width="56" height="56" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-headline font-bold text-on-surface truncate">${v.name}</span>
          <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${partyClass}">${v.party}</span>
        </div>
        <p class="text-xs text-secondary font-medium truncate">${v.address}</p>
        <p class="text-[10px] text-on-surface-variant font-bold mt-1">${v.supportScore}% support • ${v.reliability} reliability</p>
      </div>
      <span class="material-symbols-outlined text-secondary shrink-0">chevron_right</span>
    </button>`
}

export function renderVotersList(): string {
  const parties = [...new Set(voters.map((v) => v.party))].sort()
  const partyOptions = [
    `<option value="">All parties</option>`,
    ...parties.map((p) => `<option value="${p}">${p}</option>`),
  ].join('')

  return `
    <main class="voters-view px-4 pt-4 pb-6 max-w-4xl mx-auto">
      <header class="voters-header">
        <p class="text-[10px] font-black text-secondary tracking-widest uppercase mb-3">Field registry</p>
        <h2 class="font-headline font-black text-2xl text-on-surface uppercase tracking-tight mb-4">All Targets</h2>
      </header>
      <div class="voters-toolbar mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div class="relative min-w-0 flex-1">
          <span class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-xl text-secondary">search</span>
          <input
            type="search"
            data-voters-search
            autocomplete="off"
            enterkeyhint="search"
            class="w-full rounded-lg border border-outline-variant/35 bg-surface-container-low py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Search name, address, district…"
            aria-label="Search voters"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1 sm:w-44">
          <label for="voters-party-filter" class="text-[9px] font-black uppercase tracking-wider text-secondary sm:sr-only">Party</label>
          <select
            id="voters-party-filter"
            data-voters-party-filter
            class="min-h-[42px] w-full rounded-lg border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by party"
          >
            ${partyOptions}
          </select>
        </div>
      </div>
      <p data-voters-empty class="hidden rounded-lg border border-outline-variant/25 bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">No voters match your search or filter.</p>
      <div data-voters-rows class="flex flex-col gap-3">
        ${voters.map((v, i) => row(v, i)).join('')}
      </div>
    </main>`
}

function applyVotersFilters(root: HTMLElement): void {
  const q = root.querySelector<HTMLInputElement>('[data-voters-search]')?.value.trim().toLowerCase() ?? ''
  const party = root.querySelector<HTMLSelectElement>('[data-voters-party-filter]')?.value ?? ''
  const rows = root.querySelectorAll<HTMLElement>('[data-voter-row]')
  let visible = 0
  rows.forEach((row) => {
    const haystack = row.dataset.voterSearch ?? ''
    const rowParty = row.dataset.party ?? ''
    const matchSearch = !q || haystack.includes(q)
    const matchParty = !party || rowParty === party
    const show = matchSearch && matchParty
    row.classList.toggle('hidden', !show)
    if (show) visible += 1
  })
  root.querySelector<HTMLElement>('[data-voters-empty]')?.classList.toggle('hidden', visible !== 0)
}

export function bindVotersList(root: HTMLElement): void {
  const searchEl = root.querySelector<HTMLInputElement>('[data-voters-search]')
  const partyEl = root.querySelector<HTMLSelectElement>('[data-voters-party-filter]')
  searchEl?.addEventListener('input', () => applyVotersFilters(root))
  partyEl?.addEventListener('change', () => applyVotersFilters(root))

  root.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const dest = el.dataset.goto
      if (dest) navigate('#' + dest)
    })
  })
}
