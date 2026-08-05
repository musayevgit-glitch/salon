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

**Accessibility rule:** `--brand-gold` (#C58B3F) measures only ~2.75:1 against
`--background`/`--surface`, which fails WCAG AA for text at any size (needs 4.5:1 for normal
text, 3:1 for large text/icons). `--brand-gold-dark` (#8F6028) measures ~5:1 and passes.
**Rule: any `color:` (text/icon glyph) use of gold MUST be `--brand-gold-dark`, never bare
`--brand-gold`/`--violet`/`--primary`.** The light `--brand-gold` is reserved for non-text uses
only: fills, borders, box-shadows, focus rings, selected-state backgrounds.

### Creative uplift pass — direction and rationale

The product owner explicitly rejected a prior pass that only fixed the gold contrast bug and
declined a real visual uplift. This pass makes an actual decision: **keep the aged-gold/ink/ivory
base — it is genuinely premium and already threaded through every stylesheet — but add real
editorial depth instead of a flat single-accent look.** Concretely:

- **New secondary accent — deep wine/bordeaux**, used *only* where something is deliberately
  singled out as premium/featured, never as a general UI color (so it stays a deliberate signal,
  not visual noise):
  ```css
  --accent-wine:#7A2E39;--accent-wine-dark:#5C2129;--accent-wine-soft:#F5E7E6;--accent-wine-border:#E6CFCC;
  ```
  Contrast: `--accent-wine-dark` on `--accent-wine-soft` ≈ 8.9:1 (AAA), on `--surface`/`--background`
  ≈ 9.6:1. Used by `.badge-premium` (top-rated salon card badges, salon-detail "Premium salon"
  badge) and the gradient dividers below. Never used for large fills or as a competing primary.
- **Gradient divider tokens** — `--divider-gradient` (gold → wine) power a small 2px tick before
  every section eyebrow (`.eyebrow`, `.eyebrow-divider`) and a 3px vertical rule on hero copy
  blocks (`.hero-copy-rule`), replacing flat text-only eyebrows with a considered editorial mark.
  Because `.eyebrow` itself carries the upgrade, every admin surface (salon admin catalog/team/
  hours, manager operations, appointment action sheets, super admin tenant detail) inherits it
  automatically — one CSS change, whole-app consistency, no risk of missed pages.
- **Tinted elevation** — `--shadow-gold` / `--shadow-wine` replace flat grey shadows on primary
  button hover and salon-card hover with warm, color-matched shadows (`.button:hover`,
  `.salon-card:hover`), which reads noticeably more considered than generic drop shadow.
- **Photography treatment** — salon card images now sit in `.card-image-wrap` and scale in
  gently on hover (`transform:scale(1.045)`, `transition .5s`, disabled under
  `prefers-reduced-motion`), so listing photography feels art-directed rather than static stock
  thumbnails.
- **Serif wordmark eyebrow** — the landing hero now opens with a tracked-out serif "Salonomia"
  mark (`.hero-wordmark`) above the tagline, giving the hero an actual masthead instead of
  starting cold on the H1.
- Palette alternatives considered and rejected: a full black/cream/single-gold editorial system
  (loses the warmth that already reads well in the booking flow and auth screens) and a
  forest-green secondary accent (too close to the existing `--success` semantic color and would
  create ambiguity with status badges). Deep wine reads as "premium signal" without colliding
  with any existing status/semantic color.

Files touched for markup in this pass: `src/app/page.tsx` (landing hero + salon grid),
`src/app/salons/page.tsx` (catalog + featured badge), `src/app/salons/[slug]/page.tsx` (hero,
services, team, policy eyebrows), `src/app/confirm/[bookingRef]/page.tsx` (confirmation badge),
`src/app/salonadmin/page.tsx` and `src/app/superadmin/page.tsx` (eyebrow treatment).

**Update — auth and reservation composition rebuild:** `BookingForm.tsx` and `LoginForm.tsx`
were originally left markup-untouched (see history above) specifically to avoid destabilizing
their fragile state wiring. A follow-up pass rebuilt both from a "phone-screenshot mockup
centered on the page" composition (`.shot-*` / `.auth-ref-*` classes, deleted) into real
responsive web layouts. All state, effects, and handlers in both components are byte-identical
to before — only the JSX layout around them changed. See the two new patterns below.

### Pattern: sticky-summary + stepper booking layout (`BookingForm.tsx`)

Composition, top to bottom:
- `.reservation-page-head` — back link, salon-name kicker, step title (swaps per step).
- `.reservation-progress` — a real three-stage stepper (Xidmət / Tarix və saat / Təsdiq) with
  gold-filled circles for the active step and a check-mark + gold fill for completed steps,
  replacing the old plain-text bottom stepper.
- `.reservation-luxury` — two-column grid on desktop (`≥1025px`): `.reservation-main` (the
  active step's content — service/specialist picker, date/time picker, or confirm review) next
  to a **persistent `.reservation-summary-card`** that builds up the running selection (salon,
  specialist, service, date, time, price) as the user progresses through steps, plus the
  required payment-method line and the primary continue/submit button
  (`.desktop-submit`).
- Below `1024px` the summary card drops out of the grid (`order:2`, static) and
  `.mobile-sticky-reservation` — a fixed bottom bar showing the running total plus the same
  continue button — takes over; `.desktop-submit` and `.mobile-sticky-reservation` are mutually
  exclusive via media query, both call the exact same `submit`/`setStep` handlers.
- Step 1 (`ServiceStep`) and the specialist list both use `.service-radio-card` (photo, name,
  price/meta, radio dot) — a single reusable selectable-card component for both service and
  provider choice, each wrapped in its own `fieldset`/`legend` numbered section.
- Step 2 (`DateTimeStep`) uses `.date-time-grid` (two columns ≥760px, stacked below): a redesigned
  calendar (`.cal-grid`/`.cal-days`, gold-filled selected day, ring on today) on the left, and
  `.luxury-slots` — a tactile time-slot grid with `.slot-legend` (available/selected/disabled
  swatches) and clear pressed/disabled states on the right.
- Step 3 (`ConfirmStep`) is a proper review card: `.summary-row` line items for every booking
  attribute, a `.policy-card` for the cancellation rules, and `.payment-highlight` — a dedicated,
  visually weighted block (gold-subtle fill, icon, bold text) carrying the exact required copy
  "Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək." so it can't be missed, in
  addition to the shorter mention in the sticky summary sidebar.

### Pattern: split-panel auth layout (`LoginForm.tsx`)

`.auth-shell` is a two-column CSS grid ≥900px: `.auth-visual` (a fixed dark editorial brand
panel — serif wordmark, tagline, a quote line, decorative ring textures on a near-black
gradient) on the left, `.auth-panel` (the actual form column) on the right. Below 900px the
grid collapses to one column and `.auth-visual` shrinks into a compact header band (wordmark +
back link only, the quote line hides) instead of disappearing, so the brand presence survives
on mobile.

Inside `.auth-panel`: `.auth-tabs` is a real pill-shaped mode switcher (Daxil ol / Qeydiyyat,
dark-fill active state) shown on the login and register variants — not shown on the
forgot-password variant, which instead gets a centered `.auth-icon-badge` — so the three modes
are visually distinct beyond a heading swap. Register's name/surname fields sit in
`.auth-form-row.two-col` (two columns ≥480px, stacked on mobile). Every input uses
`.auth-field` → `.auth-field-control` (icon + input, gold focus ring) with the label now
visible above the field instead of screen-reader-only. `.auth-notice` (error/warning/success)
is a distinct colored block with an icon, not a generic inline `<p>`, used for the blocked-salon
warning, form errors, and the password-reset success message across all three modes.

### Pattern: shared step-heading / step-badge component (`BookingForm.tsx` + `page.tsx`)

**Bug fixed this pass:** every numbered fieldset heading in the booking flow ("1 Xidmət seçin",
"2 Usta seçin", "3 Rezervasiya məlumatları", "4 Əlaqə məlumatları") used to render the number
badge and heading text directly inside a real `<legend>` (`<legend><span>1</span> Xidmət
seçin</legend>`). Browsers render `<legend>` by cutting a notch into the parent `<fieldset>`'s
own border and vertically straddling that border line — regardless of `display`/`flex` rules
applied to the legend's own content. That produced exactly what the product owner flagged from a
screenshot: the badge appeared to sit too high relative to the heading text (the whole legend box
was pulled up onto the fieldset's border line instead of flowing normally inside the panel's
padding), and a "floating", disconnected horizontal line trailing to the right of the heading —
which was never a designed divider, it was the fieldset's own `border-top` resuming past the
legend's notch.

**Fix:** `<legend>` is now visually hidden (`.sr-only`) and kept only for its accessible name.
The visible heading is a plain, fully author-controlled row placed right after it:
```html
<legend class="sr-only">Xidmət seçin</legend>
<div class="step-heading" aria-hidden="true">
  <span class="step-badge">1</span>
  <span class="step-heading-text">Xidmət seçin</span>
  <span class="step-heading-rule"></span>
</div>
```
`.step-heading` is a flex row (`align-items:center`, `gap:var(--space-3)`) so the badge and
heading text share one true center line; `.step-heading-rule` is `flex:1 1 auto`, so it grows to
fill the remaining width and is vertically centered by the same `align-items:center`, reading as
an intentional gold→wine gradient tick (`var(--divider-gradient)`) rather than a stray line.
`.step-badge` (36px circle, gold-subtle fill, `--brand-gold-dark` numeral) is the single shared
numbered-step visual used both here and by the landing page's `.step-path` ("Necə işləyir")
markers — one numbered-step visual language for the whole app, not two.

### Pattern: editorial hero + featured showcase + connected steps (`src/app/page.tsx`)

The landing page previously carried an older, more conservative composition (a hero with a small
"hero-card" mockup showing **fabricated** data — a fake "16:30" slot and a fake "Studio Bloom"
agenda entry — competing visually with the headline, a plain salon grid, and a "3 steps" section
that was just three numbered `<div>`s) that had only been lightly re-skinned (wine badge, eyebrow
divider, image hover zoom) in an earlier pass, not structurally rebuilt like the auth/booking
screens. This pass rebuilds it with the same rigor:

- **`.landing-hero`** — an asymmetric two-column layout (`.landing-hero-inner`, `1.15fr .7fr`).
  Left: the serif wordmark eyebrow, a real display headline with an italicized gold emphasis
  word, the lead paragraph, a real search affordance (`.search.landing-search`, the same search
  pattern used on `/salons`, not a generic boxed SaaS search bar), and the trust row. Right:
  `.landing-visual` — an honest editorial panel (a short serif quote + three real platform
  commitments, `ShieldCheck`/`CalendarCheck`/`Star`) replacing the old fake-data hero-card mockup.
  No invented salon names, ratings, or time slots — every number shown elsewhere on the page comes
  from the actual `prisma.salon.findMany` result.
- **`.featured-section` / `.featured-salon`** — the single top-rated fetched salon (`orderBy:
  rating desc`, first of the 7 fetched) gets its own dedicated showcase card using the existing
  `.badge-premium` wine signal, visually distinct from the regular grid below it (which now shows
  the remaining 6 salons, so nothing is duplicated between the two sections).
- **Salon grid** — identical `.card.salon-card` markup to `/salons` (image-wrap, row with
  rating tag, muted address line, `.service-chips`, CTA button) — the landing page and the salon
  catalogue read as one product, not two card styles.
- **`.step-path`** — replaces the old `.steps-grid` (three flat divs) with a connected step
  visual: three `.step-path-item`s in a row on desktop with a `.step-badge` (the same shared
  component used for the booking step headings, see above) and a gradient connector line between
  each pair of badges (`::after`, `var(--divider-gradient)`). Below 900px it becomes a vertical
  connected list (badge pinned left, connector becomes a vertical line), consistent with the
  existing `.audit-timeline` vertical-connector pattern used elsewhere in the app.
- **`.landing-cta`** — a dedicated closing panel (dark gradient fill, inverse text, gold/outline
  secondary button) instead of ending cold on the salon grid, with two real CTAs (`/salons`,
  `/register`).
- `PublicHeader` (`.public-header`, sticky frosted-glass bar) was checked against the new hero and
  needs no changes — the hero background stays light/warm (`radial-gradient` of
  `--brand-gold-subtle` into `--background`), so the header's existing light styling still reads
  correctly; a fully dark hero was considered and rejected specifically to avoid an unscoped
  header redesign.

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

- **Buttons:** `.button` (primary, dark-fill pill), `.button.secondary` (outline), `.auth-submit`
  (full-width dark CTA, auth flow), `.desktop-submit`/`.mobile-sticky-reservation .button`
  (reservation flow, same handlers, two render targets per breakpoint).
- **Inputs:** `.field input/select/textarea`, `.auth-field-control input`, `.catalog-form input`.
- **Cards:** `.card`, `.service-card`, `.provider-profile`, `.panel`, `.metric`, `.tenant-hero`,
  `.reservation-panel`, `.service-radio-card`, `.reservation-summary-card`.
- **Badges / status:** `.tag`, `.status`, `.status-pending/-confirmed/-rejected/-cancelled/-completed/-no_show/-needs_reassignment`
  (Azerbaijani labels: Gözləmədə, Təsdiqləndi, Rədd edildi, Ləğv edilib, Tamamlanıb, Gəlmədi, Yenidən təyinat).
- **Empty states:** `.empty-state`, `.catalog-empty`, `.agenda-empty`, `.empty-inline`.
- **Navigation:** `.public-header` (customer), `.side` / `.admin` (salon admin + super admin shell,
  `AdminShell.tsx`), `.reservation-page-head .back-link` (reservation flow), `.auth-visual-back`
  (auth flow).
- **Auth + booking layout (see the two dedicated pattern write-ups above):** `.auth-shell` /
  `.auth-visual` / `.auth-panel` / `.auth-tabs` / `.auth-notice`, `.reservation-luxury` /
  `.reservation-progress` / `.reservation-summary-card` / `.cal-grid` / `.luxury-slots` /
  `.payment-highlight`.
- **Editorial accents (this pass):** `.eyebrow` / `.eyebrow-divider` (gradient-tick section
  label, used everywhere), `.hero-copy-rule` (vertical gold→wine rule on hero copy blocks),
  `.hero-wordmark` (serif tracked wordmark, landing hero only), `.badge-premium` (wine "featured/
  premium" badge — top-rated salon cards, salon-detail rating badge, landing featured showcase),
  `.confirm-badge` (circular gradient icon badge on the reservation confirmation screen),
  `.card-image-wrap` (hover-zoom wrapper for salon card photography).
- **Shared numbered-step component (this pass):** `.step-heading` / `.step-badge` /
  `.step-heading-text` / `.step-heading-rule` (booking fieldset headings, `BookingForm.tsx`) and
  `.step-path` / `.step-path-item` (landing "Necə işləyir", `page.tsx`) — one visual language for
  numbered steps, reusing the same `.step-badge` circle in both places. `.sr-only` is a new
  general-purpose visually-hidden utility (used to keep `<legend>` accessible-name-only once its
  visible content moved out into `.step-heading`).
- **Landing rebuild (this pass):** `.landing-hero` / `.landing-hero-inner` / `.landing-search` /
  `.landing-visual` (editorial hero), `.featured-salon` (dedicated premium-salon showcase),
  `.landing-cta` (closing CTA panel).

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
