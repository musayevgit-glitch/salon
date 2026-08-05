# Salonomia Design System — Master File

> **Status:** Canonical. This is the single governing design system for the whole app
> (landing, auth, discovery, reservation flow, customer account, salon admin, super admin).
>
> **History:** This repo previously had three auto-generated, mutually incompatible drafts
> (`design-system/salonomia/MASTER.md` — purple SaaS palette, `design-system/salonomia-reservation/MASTER.md`
> — pink/lavender palette, `design-system/salonomia-responsive-luxury/MASTER.md` — black/pink editorial palette).
> None of them matched what actually shipped in `src/app/globals.css`, which had *also* drifted through
> several redesign passes (a purple "UI Pro Max" admin theme, a gold/cream "luxury reservation" theme scoped
> only to the booking flow, and a gold/cream "screenshot-matched" phone-mockup theme scoped only to auth +
> booking). That fragmentation — three unread docs plus three live palettes in one stylesheet — is exactly
> the "hər yerdə fərqli görünüş, məsafə problemləri" the product owner flagged. All three old docs are
> deleted; this file replaces them, and the tokens below are wired directly into
> `src/app/globals.css` as CSS custom properties (`:root`), not just documented.

---

## Color tokens (CSS custom properties, light theme only)

```css
--background: #FAF7F2;
--background-soft: #F5EEE6;
--background-muted: #F1E9E0;
--surface: #FFFFFF;
--surface-warm: #FFFCF8;
--surface-elevated: #FFFFFF;
--text-primary: #171717;
--text-secondary: #68625C;
--text-muted: #968E86;
--text-inverse: #FFFFFF;
--brand-gold: #C58B3F;
--brand-gold-hover: #AE7631;
--brand-gold-dark: #8F6028;
--brand-gold-soft: #E9D4B2;
--brand-gold-subtle: #F8F0E4;
--border-default: #E7DDD3;
--border-subtle: #F0E9E2;
--border-strong: #D7C8BA;
--button-dark: #171717;
--button-dark-hover: #292725;
--button-dark-active: #0D0D0D;
--success: #5F815C;
--success-strong: #456A43;
--success-background: #EDF5EB;
--warning: #B98133;
--warning-background: #FBF2E4;
--error: #B95757;
--error-strong: #963F3F;
--error-background: #FAECEA;
--info: #597687;
--info-background: #EDF4F7;
--disabled-text: #A9A39D;
--disabled-background: #F1EEEA;
```

Gold is an accent, used sparingly: active states, icons, selected controls, focus rings, badges.
It is never used for body text or large fills. Primary buttons are `--button-dark` with
`--text-inverse` text. Backgrounds are warm cream/white; never neon, never dark mode.

## Radii

| Use | Value |
|---|---|
| Small control (chip, icon button) | 10–12px (`--radius-sm`) |
| Input / button | 12–16px (`--radius-control`) |
| Card | 18–22px (`--radius-card`) |
| Large panel / modal / hero | 24–32px (`--radius-panel`) |
| Pill (tag, status badge) | 999px (`--radius-pill`) |

## Shadows

```css
--shadow-sm: 0 4px 16px rgba(43,32,22,.05);
--shadow-md: 0 12px 36px rgba(43,32,22,.07);
--shadow-lg: 0 24px 70px rgba(43,32,22,.09);
```

## Typography

- Heading / branding: serif — Cormorant Garamond (primary) with Playfair Display / Georgia fallback,
  loaded via `next/font/google` in `src/app/layout.tsx` as `--font-heading`, exposed as `--font-serif`.
- Body / UI: sans — Inter, loaded via `next/font/google` as `--font-body`, exposed as `--font-sans`.
- Heading line-height 1.05–1.2, body line-height 1.5–1.7.
- Fluid sizing via `clamp()` for display/page-title/section-title (already used throughout `globals.css`).

## Spacing scale

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96` px — exposed as `--space-1` … `--space-24`.

## Layout widths

- Global max width: 1440px (`--max-width`)
- Primary content: 1280px (`--content-width`)
- Form / reading column: 680–760px (`--reading-width`, 760px)
- Horizontal padding: 40–64px desktop, 24–32px tablet, 16–20px mobile (`.shell` and page containers).

## Components (source of truth = the CSS classes actually shipped, not new ones)

All of the below already exist in `src/app/globals.css` and the feature stylesheets, and are now
repainted from the tokens above instead of three separate hardcoded palettes:

- **Buttons:** `.button` (primary, dark-fill pill), `.button.secondary` (outline), `.shot-primary` /
  `.auth-ref-primary` (full-width dark CTA used in the booking + auth flows).
- **Inputs:** `.field input/select/textarea`, `.auth-ref-input`, `.catalog-form input`.
- **Cards:** `.card`, `.service-card`, `.provider-profile`, `.panel`, `.metric`, `.tenant-hero`.
- **Badges / status:** `.tag`, `.status`, `.status-pending/-confirmed/-rejected/-cancelled/-completed/-no_show/-needs_reassignment`
  (Azerbaijani labels: Gözləmədə, Təsdiqləndi, Rədd edildi, Ləğv edilib, Tamamlanıb, Gəlmədi, Yenidən təyinat).
- **Empty states:** `.empty-state`, `.catalog-empty`, `.agenda-empty`, `.shot-empty`.
- **Navigation:** `.public-header` (customer), `.side` / `.admin` (salon admin + super admin shell,
  `AdminShell.tsx`), `.shot-topbar` (reservation flow), `.auth-ref-back` (auth flow).

## Anti-patterns (do not reintroduce)

- No neon/bright colors, no dark mode, no glassmorphism/heavy blur, no crowded cards.
- No third competing palette — any new UI work must consume the tokens above, not hardcode hex values.
- No emojis as icons — use `lucide-react` (already the icon set in use).
- Every interactive element needs a visible focus state (already enforced via `outline:3px solid var(--brand-gold-soft)`).
- `prefers-reduced-motion` must be respected (already handled in `globals.css`/`mobile.css`).

## Responsive contract

Mobile-first, no horizontal scroll, safe-area padding on fixed bottom bars
(`env(safe-area-inset-*)`, already used for `.mobile-sticky-reservation`, `.mobile-sticky-cta`,
`.booking-submit`). Verified at 320 / 375 / 768 / 1024 / 1440px breakpoints (see project report for
the conceptual review, since no browser is available in this environment).

## Business-rule copy that must never change

- No online payment UI anywhere. Exact required copy wherever payment is mentioned:
  **"Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək."**
- Reservation statuses (exact Azerbaijani labels): **Gözləmədə**, **Təsdiqləndi**, **Rədd edildi**,
  **Avtomatik rədd edildi** (see "Known gaps" in the project report — the current `AppointmentStatus`
  enum has no distinct "auto-rejected" value, so it is not yet distinguishable from a manual rejection).
