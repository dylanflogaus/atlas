import { getProfileEmail, signOut } from './signIn'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function initialsFromEmail(email: string): string {
  const name = displayNameFromEmail(email)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

export function renderAccountProfile(): string {
  const email = getProfileEmail()
  const safeEmail = email ? escapeHtml(email) : ''
  const displayName = email ? escapeHtml(displayNameFromEmail(email)) : 'Field organizer'
  const initials = email ? escapeHtml(initialsFromEmail(email)) : 'AT'

  return `
    <main class="mx-auto max-w-lg px-4 pb-nav pt-8">
      <section class="relative mb-8 overflow-hidden rounded-3xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/15">
        <div class="pointer-events-none absolute -right-4 -top-4 text-primary/15">
          <span class="material-symbols-outlined text-7xl fill">person</span>
        </div>
        <div class="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
          <div class="mb-4 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-on-primary shadow-[0_8px_24px_rgb(158_0_31/0.3)] font-headline sm:mb-0">
            ${initials}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-headline text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Your profile</p>
            <h2 class="font-headline mt-1 text-2xl font-black uppercase tracking-tight text-primary">${displayName}</h2>
            ${
              safeEmail
                ? `<p class="mt-1 truncate font-body text-sm text-on-surface-variant">${safeEmail}</p>`
                : `<p class="mt-1 font-body text-sm text-on-surface-variant">Organizer session active</p>`
            }
          </div>
        </div>
      </section>

      <section class="mb-8 rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/15">
        <h3 class="font-headline mb-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Field role</h3>
        <p class="font-body text-sm text-on-surface">Tactical canvass lead — route sync, voter intel, and progress reporting.</p>
      </section>

      <button
        type="button"
        data-sign-out
        class="font-headline flex w-full items-center justify-center gap-2 rounded-xl border-2 border-error/40 bg-error/5 py-4 text-sm font-black uppercase tracking-wide text-error transition-[transform,background] hover:bg-error/10 active:scale-[0.99]"
      >
        <span class="material-symbols-outlined text-[22px]">logout</span>
        Sign out
      </button>
    </main>`
}

export function bindAccountProfile(root: HTMLElement): void {
  root.querySelector('[data-sign-out]')?.addEventListener('click', () => signOut())
}
