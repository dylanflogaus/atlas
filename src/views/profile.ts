import { getVoterApproxCoords, type Voter } from '../data'
import { navigate } from '../router'
import { openLogModal } from './log'

const toneIcon: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
}

function areaMapEmbedUrl(voterId: string): string | null {
  const coords = getVoterApproxCoords(voterId)
  if (!coords) return null
  // Small viewport around the pin so users see immediate neighborhood context.
  const latDelta = 0.0045
  const lngDelta = 0.0075
  const left = coords.lng - lngDelta
  const right = coords.lng + lngDelta
  const top = coords.lat + latDelta
  const bottom = coords.lat - latDelta
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
}

export function renderProfile(v: Voter): string {
  const mapEmbedUrl = areaMapEmbedUrl(v.id)
  const issuesHtml = v.issues
    .map(
      (i) => `
    <div class="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneIcon[i.tone]}">
        <span class="material-symbols-outlined">${i.icon}</span>
      </div>
      <div>
        <p class="text-sm font-bold text-on-surface leading-none">${i.label}</p>
        <p class="text-[10px] text-secondary font-medium uppercase tracking-tighter mt-1">${i.detail}</p>
      </div>
    </div>`,
    )
    .join('')

  const historyHtml = v.history
    .map(
      (h) => `
    <div class="bg-surface-container-low p-5 rounded-lg flex items-center justify-between gap-3 group hover:bg-surface-container-high transition-all">
      <div class="flex items-center gap-4 min-w-0">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${h.iconTone === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'}">
          <span class="material-symbols-outlined ${h.iconTone === 'primary' ? 'text-primary' : 'text-secondary'}">${h.icon}</span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-on-surface truncate">${h.title}</p>
          <p class="text-xs text-secondary truncate">${h.meta}</p>
        </div>
      </div>
      <span class="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">chevron_right</span>
    </div>`,
    )
    .join('')

  return `
    <main class="max-w-4xl mx-auto px-4 pt-6 pb-nav space-y-8">
      <section class="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-end gap-6 ring-1 ring-outline-variant/10">
        <div class="relative">
          <div class="w-32 h-32 rounded-xl overflow-hidden shadow-lg ring-2 ring-white">
            <img src="${v.photoUrl}" alt="${v.name}" class="h-full w-full object-cover" width="128" height="128" />
          </div>
          <div class="absolute -bottom-2 -right-2 bg-primary text-on-primary p-1.5 rounded-lg shadow-md">
            <span class="material-symbols-outlined text-sm fill">verified</span>
          </div>
        </div>
        <div class="flex-1 text-center md:text-left w-full">
          <div class="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
            <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline">${v.name}</h1>
            <span class="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest uppercase justify-center">${v.district}</span>
          </div>
          <p class="text-secondary font-medium text-lg">${v.subtitle}</p>
          <div class="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <a href="tel:" class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/25 active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-base">phone</span>
              Call Now
            </a>
            <button type="button" data-open-log data-voter-id="${v.id}" class="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-6 py-2.5 text-sm font-bold text-on-surface active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-base">edit_note</span>
              Quick Log
            </button>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-36 group hover:bg-surface-container-lowest transition-colors shadow-sm">
          <span class="material-symbols-outlined text-primary mb-1">bolt</span>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Engage Score</h3>
            <p class="text-4xl font-black text-on-surface font-headline">${v.engageScore}<span class="text-lg text-secondary">/100</span></p>
          </div>
        </div>
        <div class="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-36 group hover:bg-surface-container-lowest transition-colors shadow-sm">
          <span class="material-symbols-outlined text-tertiary mb-1">calendar_today</span>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Last Contact</h3>
            <p class="text-2xl font-black text-on-surface font-headline">${v.lastContact}</p>
          </div>
        </div>
        <div class="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-36 group hover:bg-surface-container-lowest transition-colors shadow-sm">
          <span class="material-symbols-outlined text-secondary mb-1">how_to_vote</span>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Vote Method</h3>
            <p class="text-2xl font-black text-on-surface font-headline">${v.voteMethod}</p>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-black tracking-tight uppercase text-on-surface-variant flex items-center gap-2 font-headline">
          <span class="w-8 h-1 bg-primary rounded-full"></span>
          Top Priority Issues
        </h2>
        <div class="flex flex-wrap gap-4">${issuesHtml}</div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-black tracking-tight uppercase text-on-surface-variant flex items-center gap-2 font-headline">
          <span class="w-8 h-1 bg-secondary rounded-full"></span>
          Field Intelligence
        </h2>
        <div class="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl ring-1 ring-outline-variant/15">
          ${
            mapEmbedUrl
              ? `<iframe
            src="${mapEmbedUrl}"
            title="Area map"
            class="w-full h-full border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>`
              : `<img src="${v.mapImageUrl}" alt="Area map" class="w-full h-full object-cover" />`
          }
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          <div class="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div class="text-white">
              <p class="text-xs font-bold uppercase tracking-widest opacity-80">Primary Address</p>
              <p class="text-lg font-bold">${v.address}</p>
              <p class="text-sm">${v.cityState}</p>
            </div>
            <div class="glass-panel max-w-xs p-4 rounded-xl shadow-lg text-left">
              <p class="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Canvassing Note</p>
              <p class="text-sm italic font-medium text-on-surface">${v.canvassingNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-black tracking-tight uppercase text-on-surface-variant flex items-center gap-2 font-headline">
          <span class="w-8 h-1 bg-primary-container rounded-full"></span>
          History
        </h2>
        <div class="space-y-2">${historyHtml}</div>
      </section>

      <section class="pb-4">
        <button type="button" data-open-log data-log-ballot data-voter-id="${v.id}" class="w-full bg-primary-container text-on-primary py-4 px-6 rounded-xl font-extrabold text-base shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all min-h-[56px] uppercase tracking-wider font-headline">
          <span class="material-symbols-outlined">how_to_reg</span>
          Log Ballot Request
        </button>
      </section>
    </main>`
}

export function bindProfile(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const dest = el.dataset.goto
      if (dest) navigate('#' + dest)
    })
  })
  root.querySelectorAll<HTMLElement>('[data-open-log]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.voterId
      if (id) openLogModal(id, el.hasAttribute('data-log-ballot'))
    })
  })
}
