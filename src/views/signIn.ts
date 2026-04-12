import { navigate } from '../router'

const SESSION_KEY = 'atlas_signed_in'
const PROFILE_EMAIL_KEY = 'atlas_profile_email'

export function getProfileEmail(): string | null {
  try {
    return sessionStorage.getItem(PROFILE_EMAIL_KEY) ?? localStorage.getItem(PROFILE_EMAIL_KEY)
  } catch {
    return null
  }
}

export function signOut(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(PROFILE_EMAIL_KEY)
    localStorage.removeItem(PROFILE_EMAIL_KEY)
  } catch {
    /* ignore */
  }
  navigate('#/sign-in')
}

export function isSignedIn(): boolean {
  try {
    return (
      sessionStorage.getItem(SESSION_KEY) === '1' || localStorage.getItem(SESSION_KEY) === '1'
    )
  } catch {
    return false
  }
}

export function renderSignIn(): string {
  return `
    <main class="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div class="w-full max-w-md">
        <div class="relative mb-8 text-center">
          <div class="pointer-events-none absolute -left-6 -top-6 text-primary/35">
            <span class="material-symbols-outlined text-4xl fill">radar</span>
          </div>
          <div class="pointer-events-none absolute -bottom-4 -right-2 text-tertiary/35">
            <span class="material-symbols-outlined text-3xl">shield_lock</span>
          </div>
          <p class="font-headline text-[10px] font-bold uppercase tracking-[0.28em] text-secondary mb-2">Project Atlas</p>
          <h2 class="font-headline text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary leading-tight">Tactical access</h2>
          <p class="mt-2 font-body text-sm text-on-surface-variant">Sign in to sync your route and field data.</p>
        </div>

        <form
          id="sign-in-form"
          class="glass-panel rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgb(0_0_0/0.06)] ring-1 ring-outline-variant/20"
          novalidate
        >
          <div class="space-y-5">
            <div>
              <label for="sign-in-email" class="font-headline mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary">Work email</label>
              <input
                id="sign-in-email"
                name="email"
                type="email"
                autocomplete="username"
                placeholder="you@organization.org"
                class="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label for="sign-in-password" class="font-headline mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-secondary">Password</label>
              <input
                id="sign-in-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <label class="flex cursor-pointer items-center gap-2 font-body text-xs font-medium text-on-surface-variant">
                <input id="sign-in-remember" name="remember" type="checkbox" class="size-4 rounded border-outline-variant text-primary focus:ring-primary/30" />
                Stay signed in
              </label>
              <button type="button" data-help class="font-headline text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-container">
                Need help?
              </button>
            </div>
          </div>

          <p id="sign-in-error" class="mt-4 hidden rounded-lg bg-error/10 px-3 py-2 font-body text-xs font-semibold text-error" role="alert"></p>

          <button
            type="submit"
            class="font-headline mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-black uppercase tracking-wide text-on-primary shadow-[0_4px_14px_rgb(158_0_31/0.35)] transition-[transform,filter] active:scale-[0.99] hover:brightness-[1.03]"
          >
            <span class="material-symbols-outlined text-[22px]">login</span>
            Enter command
          </button>
        </form>

        <p class="mt-8 text-center font-body text-xs text-on-surface-variant/80">
          Field organizers only. Unauthorized access is monitored.
        </p>
        <p class="mt-5 text-center">
          <a
            href="#/admin"
            class="font-body text-[10px] font-medium tracking-widest text-on-surface-variant/55 transition-colors duration-150 hover:text-primary"
          >Campaign metrics</a>
        </p>
      </div>
    </main>`
}

export function bindSignIn(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('#sign-in-form')
  const errEl = root.querySelector<HTMLParagraphElement>('#sign-in-error')
  const helpBtn = root.querySelector<HTMLButtonElement>('[data-help]')

  helpBtn?.addEventListener('click', () => {
    errEl?.classList.add('hidden')
    errEl && (errEl.textContent = '')
    window.alert('Contact your campaign administrator for account access or a password reset.')
  })

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const email = String(fd.get('email') ?? '').trim()
    const remember = fd.get('remember') === 'on'

    if (errEl) {
      errEl.textContent = ''
      errEl.classList.add('hidden')
    }

    try {
      if (remember) {
        localStorage.setItem(SESSION_KEY, '1')
        sessionStorage.removeItem(SESSION_KEY)
        if (email) {
          localStorage.setItem(PROFILE_EMAIL_KEY, email)
          sessionStorage.removeItem(PROFILE_EMAIL_KEY)
        } else {
          localStorage.removeItem(PROFILE_EMAIL_KEY)
          sessionStorage.removeItem(PROFILE_EMAIL_KEY)
        }
      } else {
        sessionStorage.setItem(SESSION_KEY, '1')
        localStorage.removeItem(SESSION_KEY)
        if (email) {
          sessionStorage.setItem(PROFILE_EMAIL_KEY, email)
          localStorage.removeItem(PROFILE_EMAIL_KEY)
        } else {
          sessionStorage.removeItem(PROFILE_EMAIL_KEY)
          localStorage.removeItem(PROFILE_EMAIL_KEY)
        }
      }
    } catch {
      /* ignore storage failures; still allow navigation */
    }

    navigate('#/')
  })
}
