# THE MUZE Design System

> Extracted from the current `rebuild01` implementation on 2026-07-24.
> This document records what the product already does, then defines a smaller
> canonical system that future screens can reuse.

## 1. Brand thesis

THE MUZE is a cinematic music label interface with an editorial control layer.
The public experience gives artist imagery and album artwork the stage; the
supporting UI stays dark, precise, and typographic. The admin and account
experiences reuse the same typography, hairline borders, and pink state color
with denser information layouts.

The visual signature is:

- near-black exhibition space;
- oversized, compressed uppercase titles;
- hot pink used as a cue, not a background wash;
- album or artist colors that temporarily tint the experience;
- quiet hairline structures and small catalogue-like metadata;
- one composed motion sequence per surface.

The system should feel closer to an album sleeve, gallery caption, and mixing
console than to a generic entertainment dashboard.

## 2. Design principles

1. **Artwork leads.** Public hero and discography surfaces begin with the
   artist or release image. UI chrome supports the artwork instead of competing
   with it.
2. **Pink means attention.** Use Muze Pink for primary action, focus, active
   state, and a small amount of brand emphasis. Do not use it as general
   decoration.
3. **Content color stays contextual.** Album and artist accent colors may drive
   ambient backgrounds, progress, and release-specific labels. They must not
   replace semantic success, warning, or error colors.
4. **Structure is visible.** Hairline dividers, indexed metadata, strong
   alignment, and deliberate empty space establish hierarchy.
5. **Hero type is scarce.** Monument Extended is reserved for home hero and
   primary album titles. Montserrat carries names, counts, and short English
   navigation labels. Pretendard carries multilingual reading and control text.
6. **Motion is staged.** Prefer one reveal, transition, or ambient behavior that
   reinforces the content. Always provide a reduced-motion outcome.

## 3. System architecture

The product has three related visual modes:

| Mode | Purpose | Background | Density | Signature |
| --- | --- | --- | --- | --- |
| Cinematic | Home, artist scene, discography | Black, image-led | Low | Full-bleed artwork, oversized titles, contextual accent |
| Editorial | About, notices, account, protect | Theme surface | Medium | Split columns, hairlines, compact labels |
| Control | Admin | Theme surface | High | Workbench grids, small metadata, explicit states |

All three share brand color, type roles, focus treatment, borders, and motion
curves. They may differ in spacing and information density.

## 4. Color

### 4.1 Brand colors

| Token | Value | Role |
| --- | --- | --- |
| `brand.pink` | `#FC6FCF` | Primary action, active state, focus, selection |
| `brand.green` | `#2C4B43` | Secondary brand action and legacy identity |
| `brand.ink` | `#121212` | Deep brand neutral |

Pink is the dominant interactive color. Green is secondary and should not
compete with pink in the same control group.

### 4.2 Dark theme

| Token | Value |
| --- | --- |
| `bg.canvas` | `#0A0A0A` |
| `bg.surface` | `#121212` |
| `bg.elevated` | `#1A1A1A` |
| `bg.overlay` | `rgba(10, 10, 10, 0.90)` |
| `text.primary` | `#FFFFFF` |
| `text.secondary` | `#D4D4D4` |
| `text.muted` | `#6B7280` |
| `text.faint` | `#4B5563` |
| `border.subtle` | `rgba(255, 255, 255, 0.05)` |
| `border.default` | `rgba(255, 255, 255, 0.10)` |
| `border.strong` | `rgba(255, 255, 255, 0.20)` |

### 4.3 Light theme

| Token | Value |
| --- | --- |
| `bg.canvas` | `#F7F8FA` |
| `bg.surface` | `#F0F2F5` |
| `bg.elevated` | `#FFFFFF` |
| `bg.overlay` | `rgba(247, 248, 250, 0.92)` |
| `text.primary` | `#15171A` |
| `text.secondary` | `#34383F` |
| `text.muted` | `#6B7280` |
| `text.faint` | `#9CA3AF` |
| `border.subtle` | `rgba(15, 23, 42, 0.06)` |
| `border.default` | `rgba(15, 23, 42, 0.12)` |
| `border.strong` | `rgba(15, 23, 42, 0.24)` |

### 4.4 Semantic and external colors

| Token | Value | Use |
| --- | --- | --- |
| `status.success` | `#58B38C` | Completed and verified |
| `status.warning` | `#D69A35` | Needs attention |
| `status.danger` | `#E47777` | Error, destructive action |
| `platform.youtube` | `#FF0033` | YouTube hover or identity only |
| `platform.spotify` | `#1DB954` | Spotify hover or identity only |

Album and artist accent colors are runtime content tokens:

```css
--artist-accent: var(--color-brand-pink);
--album-accent: var(--color-brand-pink);
```

Use them for artwork-linked ambient light, progress, active track, or an
eyebrow. Keep body copy and functional controls on semantic theme tokens.

## 5. Typography

### 5.1 Families

| Role | Family | Usage |
| --- | --- | --- |
| Hero | Monument Extended Bold | Home hero and primary album titles only |
| Display and wordmark | Montserrat 650–800 | Artist names, large counts, English navigation |
| UI and reading | Pretendard Variable 45–920 | Korean, Japanese, English body, navigation, forms |

Fallback order:

```css
--font-sans: "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-display: var(--font-montserrat), "Montserrat", "Pretendard Variable", sans-serif;
--font-wordmark: var(--font-montserrat), "Montserrat", "Pretendard Variable", sans-serif;
--font-hero: "Monument Extended", var(--font-montserrat), "Montserrat", sans-serif;
```

### 5.2 Canonical type scale

| Token | Size / line height | Typical use |
| --- | --- | --- |
| `type.micro` | `0.625rem / 1.4` | Nonessential catalogue metadata |
| `type.caption` | `0.75rem / 1.5` | Helper text, dates, captions |
| `type.body-sm` | `0.8125rem / 1.6` | Dense list and control copy |
| `type.body` | `0.875rem / 1.7` | Default product copy |
| `type.body-lg` | `1rem / 1.7` | Introductory or editorial copy |
| `type.heading-sm` | `1.125rem / 1.2` | Card and panel title |
| `type.heading-md` | `clamp(1.5rem, 2.3vw, 2rem) / 1.05` | Page section title |
| `type.display-md` | `clamp(2.625rem, 5vw, 4.5rem) / 0.88` | Page title |
| `type.display-lg` | `clamp(3rem, 7vw, 7rem) / 0.80` | Artist or release hero |

Rules:

- Body text uses Pretendard and sentence case.
- Display text may use uppercase, `-0.04em` to `-0.08em` tracking, and tight
  line-height.
- Utility labels may use uppercase with `0.06em` to `0.14em` tracking.
- Interactive and readable text should normally be at least `12px`. Existing
  `6px`–`10px` labels are treated as legacy density, not a default.
- Avoid `font-weight` values above 800 for Korean body copy; reserve the
  heaviest weights for short labels and display text.

## 6. Spacing and layout

### 6.1 Spacing scale

The implementation clusters around a 4px foundation with a 2px half-step.

| Token | Value |
| --- | --- |
| `space.0` | `0` |
| `space.0_5` | `2px` |
| `space.1` | `4px` |
| `space.1_5` | `6px` |
| `space.2` | `8px` |
| `space.2_5` | `10px` |
| `space.3` | `12px` |
| `space.4` | `16px` |
| `space.5` | `20px` |
| `space.6` | `24px` |
| `space.7` | `28px` |
| `space.8` | `32px` |
| `space.10` | `40px` |
| `space.12` | `48px` |
| `space.14` | `56px` |
| `space.16` | `64px` |
| `space.20` | `80px` |
| `space.24` | `96px` |

Use named layout variables for responsive outer gutters:

```css
--layout-gutter: clamp(20px, 4vw, 68px);
--layout-section: clamp(64px, 9vw, 112px);
--layout-copy: 760px;
--layout-content: 1280px;
--layout-wide: 1600px;
```

### 6.2 Layout patterns

- **Cinematic frame:** full viewport artwork, overlays, bottom-aligned copy,
  maximum content width `1280px`.
- **Editorial split:** sticky title rail plus flexible content column, collapsing
  to one column below roughly `720px`.
- **Workbench:** navigation or library rail plus stage, collapsing between
  `850px` and `980px` depending on information density.
- **Reading width:** prose remains at or below `760px`.

Primary public gutters are `20px` on small screens, `24px`–`38px` on regular
screens, and up to `68px` on wide editorial screens.

## 7. Shape, border, elevation

| Token | Value | Use |
| --- | --- | --- |
| `radius.sharp` | `2px` | Editorial forms and hold-to-confirm actions |
| `radius.control` | `8px` | Inputs, filters, compact cards |
| `radius.panel` | `10px` | Major contained shells |
| `radius.card` | `12px` | Floating navigation and elevated cards |
| `radius.pill` | `999px` | Status, primary CTA, icon control |

Use `1px` theme borders for ordinary separation and `2px` only for focus,
active rails, key section tops, or validation emphasis.

Elevation is primarily created with surface contrast, borders, and blur.
Shadows are reserved for floating navigation, artwork controls, and the primary
hero action. Avoid generic card shadows on editorial surfaces.

## 8. Interaction and motion

### 8.1 Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `motion.fast` | `160ms` | Hover, thumb, border |
| `motion.base` | `180ms` | Standard control feedback |
| `motion.medium` | `300ms` | Toggle and navigation |
| `motion.slow` | `500ms` | Page chrome and larger state change |
| `motion.scene` | `1100ms` | Cinematic slide reveal |
| `ease.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General UI |
| `ease.enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveals and expanding UI |
| `ease.scene` | `cubic-bezier(0.76, 0, 0.24, 1)` | Full-frame transitions |

Rules:

- Hover changes color, border, or position by at most `1px`; scaling is limited
  to artwork controls and high-salience actions.
- Auto-advancing media pauses while hovered, focused, or page-hidden.
- `prefers-reduced-motion: reduce` removes ambient animation, auto-motion, and
  smooth scrolling.

## 9. Component contracts

### Button

- Minimum target: `44 × 44px`.
- Primary: pink fill, dark text, pill or contextual shape.
- Secondary: transparent or subtle surface, one-pixel border.
- Destructive: transparent danger border; solid danger fill only at final
  confirmation.
- Focus: `2px` pink outline with `2px`–`3px` offset.
- Disabled: retain label, reduce opacity, remove hover transformation.

### Input

- Standard height: `56px` for editorial forms, `38px`–`44px` for dense filters.
- Border uses `border.strong`; focus uses pink border plus a faint pink ring.
- Labels are always visible; placeholder text is supporting information only.
- Mobile text fields use at least `16px` to prevent viewport zoom.

### Navigation

- Header sits over cinematic pages and becomes a blurred theme surface after
  scroll.
- Desktop links use compact tracked labels and a pink active cue.
- Mobile navigation is a modal surface with focus trap, Escape close, inert
  background, and `56px` row targets.

### Card and panel

- Prefer borders and surface steps over shadows.
- A contained major panel uses `radius.panel`; editorial rows may remain square.
- One accent edge or marker is enough. Avoid combining glow, colored border,
  shadow, and tinted background on the same card.

### Status

- Success, warning, and danger keep their semantic colors in every theme.
- Pair color with text, icon, shape, or label; color is never the only signal.
- Error copy states what happened and the next available action.

### Empty and loading states

- Loading uses the product phrase `YOU ARE MY MUZE` only where a branded pause
  is appropriate.
- Empty states name what is missing and expose the next valid action.
- Content-loading skeletons or progress indicators should not imitate controls
  that cannot yet be used.

## 10. Accessibility baseline

- `:focus-visible` is always visible with a minimum `2px` outline.
- Interactive targets are at least `44px` in one dimension; primary controls
  should be `44 × 44px` or larger.
- Body copy aims for WCAG AA contrast. Muted and faint colors are for metadata,
  not critical instructions.
- Icon-only actions require an accessible name.
- Do not remove scrollbars from long data or workbench surfaces unless an
  equally discoverable scroll affordance exists.
- Keyboard navigation, focus trapping, Escape behavior, and focus restoration
  are part of the component contract.
- Motion-sensitive users receive a static first frame and direct state changes.

## 11. Token guardrails and remaining consolidation

The runtime now centralizes direct color values. The remaining work is semantic
consolidation rather than literal cleanup:

1. Raw HEX/RGB values belong only in `color-primitives.css` or
   `design-tokens.ts`. Components consume semantic or primitive variables.
2. Success and danger use multiple greens and reds (`#35A963`, `#58B38C`,
   `#E46B6B`, `#E47777`, `#DF7777`). Consolidate them to one semantic palette.
3. Typography roles must remain explicit: Monument through `hero`, Montserrat
   through `display` or `wordmark`, and Pretendard through `sans`.
4. Very small `6px`–`10px` text is common in discography and admin screens.
   Keep it only for nonessential metadata; promote useful information to
   `12px` or above.
5. Radius ranges from square to pill without explicit meaning. Apply the shape
   roles in section 7.
6. Cinematic black and white remain intentional, but must flow through
   `color.static.black` and `color.static.white` rather than framework colors.
7. Global scrollbar removal reduces discoverability. Limit hidden scrollbars to
   cinematic or deliberately paged experiences.

## 12. Source map

Primary evidence used for this extraction:

- `src/styles/color-primitives.css`: single source for literal CSS color values
- `src/styles/base.css`: semantic brand, theme, state, platform, focus, and type aliases
- `src/lib/design-tokens.ts`: runtime-safe HEX values for persisted and calculated colors
- `src/styles/animations.css`: motion language and album-aware effects
- `src/styles/pages/home.css`: streaming actions and cinematic controls
- `src/styles/pages/notice.css`: editorial list and panel patterns
- `src/components/Navbar.tsx`: navigation, targets, theme behavior
- `src/components/Footer.tsx`: low-emphasis content and social actions
- `src/app/page.tsx`: cinematic hero hierarchy and sequencing
- `src/app/[artistid]/artist/*.module.css`: exhibition and artist wordmark mode
- `src/app/[artistid]/discography/page.tsx`: album-context accent behavior
- `src/app/account/account.module.css`: editorial forms and split layout
- `src/app/protect/protect.module.css`: validation, status, and sensitive action
- `src/app/admin/admin.css`: high-density control mode

The companion `design-tokens.json` documents the canonical roles. Runtime CSS
is wired through `color-primitives.css` and `base.css`; runtime color values used
for persistence or calculation come from `design-tokens.ts`.
