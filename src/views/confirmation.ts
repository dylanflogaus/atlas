import type { Voter } from '../data'
import { navigate } from '../router'

export function renderConfirmation(v: Voter): string {
  const initials = v.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return `
    <main class="max-w-md mx-auto px-6 pt-8 pb-12">
      <section class="flex flex-col items-center text-center mb-10">
        <div class="relative mb-6">
          <div class="absolute -top-4 -left-4 text-primary opacity-40 pointer-events-none">
            <span class="material-symbols-outlined text-4xl fill">stars</span>
          </div>
          <div class="absolute -bottom-2 -right-6 text-tertiary opacity-40 pointer-events-none">
            <span class="material-symbols-outlined text-3xl fill">auto_awesome</span>
          </div>
          <div class="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(158,0,31,0.25)] ring-4 ring-white">
            <span class="material-symbols-outlined text-on-primary text-5xl fill">check_circle</span>
          </div>
        </div>
        <h2 class="font-headline text-3xl font-black uppercase tracking-tight text-primary leading-none mb-2">Mission Accomplished</h2>
        <p class="font-label text-secondary text-sm font-semibold tracking-widest uppercase">Target Verified & Synchronized</p>
      </section>

      <section class="bg-surface-container-low rounded-xl p-6 mb-8 shadow-sm ring-1 ring-outline-variant/15 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
          <span class="material-symbols-outlined text-8xl">person</span>
        </div>
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-on-primary font-bold text-xl font-headline">
              ${initials}
            </div>
            <div>
              <p class="font-label text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">Confirmed Voter</p>
              <h3 class="font-body text-xl font-bold text-on-surface">${v.name}</h3>
            </div>
          </div>
          <div class="flex items-center gap-2 bg-surface-container-lowest/80 rounded-lg p-3">
            <span class="material-symbols-outlined text-primary text-sm fill">location_on</span>
            <span class="text-xs font-semibold text-secondary uppercase tracking-tight">${v.district}</span>
          </div>
        </div>
      </section>

      <section class="bg-surface-container-highest rounded-xl p-6 mb-10 ring-1 ring-outline-variant/15">
        <div class="flex justify-between items-end mb-4">
          <div>
            <p class="font-label text-xs font-bold text-secondary uppercase tracking-widest mb-1">Field Performance</p>
            <h4 class="font-headline text-4xl font-black text-on-surface leading-none">12<span class="text-xl text-secondary">/20</span></h4>
          </div>
          <div class="text-right">
            <p class="font-label text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary-fixed px-2 py-1 rounded text-on-primary-fixed">Rank: Tactical Lead</p>
          </div>
        </div>
        <div class="relative h-4 bg-surface-dim rounded-full overflow-hidden mb-4">
          <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out w-[60%]">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-3 justify-center">
          <span class="material-symbols-outlined text-primary">military_tech</span>
          <p class="font-body text-sm font-bold text-secondary uppercase tracking-tight">8 more to reach elite status</p>
        </div>
      </section>

      <div class="flex flex-col gap-4">
        <button type="button" data-next class="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all duration-200">
          <span class="material-symbols-outlined">target</span>
          Engage Next Target
        </button>
        <button type="button" data-home class="w-full border-2 border-secondary text-secondary font-headline font-bold py-4 rounded-lg flex items-center justify-center gap-3 bg-transparent hover:bg-secondary/5 active:scale-[0.98] transition-all duration-200">
          <span class="material-symbols-outlined">camping</span>
          Return to Base
        </button>
      </div>
    </main>`
}

export function bindConfirmation(root: HTMLElement): void {
  root.querySelector('[data-next]')?.addEventListener('click', () => navigate('#/'))
  root.querySelector('[data-home]')?.addEventListener('click', () => navigate('#/'))
}
