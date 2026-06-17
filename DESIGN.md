# TrainLog Design System

## Overview

TrainLog is a mobile-first dark-theme training log application. The visual language is inspired by iOS native design with glassmorphism effects, subtle gradients, and a distinctive green accent palette. Every surface is dark, text is light, and interactive elements pulse with the accent green `#4ae09a`. The app targets a maximum content width of 480px and uses safe-area-aware spacing for notched devices.

Design density is compact and information-dense. Touch targets are generous (minimum 38px), but visual spacing is restrained. The overall feel is premium, calm, and data-focused — not playful or colorful.

---

## Colors

### Backgrounds

| Token | Hex / RGBA | Usage |
|---|---|---|
| `--color-bg-primary` | `#111114` | Page background, app shell |
| `--color-bg-secondary` | `#1a1a1f` | Sheet backgrounds, elevated surfaces |
| `--color-bg-tertiary` | `#24242a` | Button secondary backgrounds, cancel buttons |
| `--color-bg-elevated` | `#2e2e36` | Reserved for future popover/tooltip surfaces |
| `--color-bg-card` | `rgba(255, 255, 255, 0.05)` | Card surfaces, input backgrounds |
| `--color-bg-card-hover` | `rgba(255, 255, 255, 0.08)` | Active/hover state for cards and buttons |
| `--color-bg-overlay` | `rgba(0, 0, 0, 0.6)` | Modal and bottom sheet overlay |
| `--color-bg-glass` | `rgba(26, 26, 31, 0.9)` | Header glass effect with `backdrop-filter: blur(20px)` |

Body has two fixed radial gradients that create ambient depth:
- Top-center: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74, 224, 154, 0.06), transparent)` — subtle green glow from above
- Bottom-right: `radial-gradient(ellipse 60% 40% at 80% 100%, rgba(100, 210, 255, 0.04), transparent)` — subtle blue hint at bottom

### Accent (Primary)

| Token | Hex / RGBA | Usage |
|---|---|---|
| `--color-accent` | `#4ae09a` | Primary interactive color — buttons, links, today marker, tags, FAB |
| `--color-accent-hover` | `#3dd68c` | Active/pressed state of accent elements |
| `--color-accent-dim` | `rgba(74, 224, 154, 0.12)` | Focus rings, subtle highlight backgrounds |
| `--color-accent-glow` | `rgba(74, 224, 154, 0.3)` | Glow effects on accent elements |
| `--color-accent-surface` | `rgba(74, 224, 154, 0.08)` | Tinted background for today cells, active tags |

Accent glow box-shadow: `0 0 20px rgba(61, 214, 140, 0.15), 0 0 60px rgba(61, 214, 140, 0.05)`

Title gradient: `linear-gradient(135deg, #4ae09a, #64d2ff)` — used only for the "Train" word in the app title via `background-clip: text`.

### Text

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#f5f5f7` | Headings, body text, primary content |
| `--color-text-secondary` | `#a0a0a8` | Secondary labels, descriptions, nav buttons |
| `--color-text-tertiary` | `#636370` | Placeholder text, section labels, disabled state |
| `--color-text-inverse` | `#111114` | Text on accent-colored backgrounds |
| `--color-text-accent` | `#4ae09a` | Inline accent text (same as accent color) |

### Borders & Dividers

| Token | RGBA | Usage |
|---|---|---|
| `--color-border` | `rgba(255, 255, 255, 0.1)` | Input borders, active card borders |
| `--color-border-light` | `rgba(255, 255, 255, 0.06)` | Card borders, tag borders, subtle separators |
| `--color-divider` | `rgba(255, 255, 255, 0.08)` | Section dividers, header bottom borders |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--color-danger` | `#ff453a` | Delete confirm button, delete active state |
| `--color-danger-dim` | `rgba(255, 69, 58, 0.12)` | Delete button active background |
| `--color-warning` | `#ffd60a` | Reserved for future warning states |
| `--color-info` | `#64d2ff` | Reserved for future info states |

---

## Typography

### Font Families

| Token | Stack | Usage |
|---|---|---|
| `--font-sans` | `'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | All UI text, body, labels |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', Consolas, monospace` | Numbers, dates, section labels, code-like elements |

### Size Scale

| Token | Size | Usage |
|---|---|---|
| `--font-size-2xs` | `9px` | Section labels, tiny metadata, calendar tags |
| `--font-size-xs` | `11px` | Small remove buttons, tag close icons |
| `--font-size-sm` | `13px` | Body text, tag labels, weekday names, form labels |
| `--font-size-md` | `15px` | Default body size, textarea text |
| `--font-size-lg` | `17px` | Sheet titles, form page title, empty state text, tag buttons |
| `--font-size-xl` | `20px` | Calendar month label, form number input |
| `--font-size-2xl` | `26px` | App title |
| `--font-size-3xl` | `34px` | Reserved for future hero/stat numbers |

### Weight Scale

| Token | Value | Usage |
|---|---|---|
| `--font-weight-light` | `300` | Empty state hints, secondary descriptions |
| `--font-weight-regular` | `400` | Body text, placeholder text |
| `--font-weight-medium` | `500` | Calendar day numbers, loading text, form input |
| `--font-weight-semibold` | `600` | Tags, buttons, weekday labels, section titles |
| `--font-weight-bold` | `700` | Headings, today number, sheet actions, app title |
| `--font-weight-black` | `900` | App logo title only |

### Line Heights

| Token | Value | Usage |
|---|---|---|
| `--line-height-tight` | `1.2` | Headings, sheet titles |
| `--line-height-normal` | `1.5` | Body text, default |
| `--line-height-relaxed` | `1.65` | Textarea, multi-line content |

### Letter Spacing

- Headings: `-0.02em` to `-0.03em` (tight)
- Uppercase labels: `0.06em` to `0.1em` (wide)
- Tags: `0.02em` (slight spread)
- Date badges: `0.04em` to `0.08em`

---

## Layout

### Spacing Scale

| Token | Value | Common Usage |
|---|---|---|
| `--space-xs` | `4px` | Tag gap, inner tag padding, tiny margins |
| `--space-sm` | `8px` | List gaps, label margins, small padding |
| `--space-md` | `12px` | Medium gaps, input padding, tag gaps |
| `--space-lg` | `16px` | Card padding, header padding, section gaps |
| `--space-xl` | `20px` | Horizontal page padding, card inner padding |
| `--space-2xl` | `24px` | Page side padding, sheet content padding |
| `--space-3xl` | `32px` | Form field bottom margin |
| `--space-4xl` | `48px` | Reserved for larger section separators |
| `--space-5xl` | `64px` | Empty state top padding, form body bottom padding |

### Structural Dimensions

| Token / Value | Size | Usage |
|---|---|---|
| `--max-content-width` | `480px` | Max app width, centered |
| `--header-height` | `56px` | Reserved header height |
| `--bottom-bar-height` | `64px` | Reserved bottom bar height |
| FAB size | `56px × 56px` | Fixed action button |
| Nav buttons | `38px × 38px` | Calendar nav, form back button |
| Action buttons | `30px × 30px` | Card edit/delete icon buttons |
| Calendar cell | `aspect-ratio: 1` | Square grid cells |

### Safe Areas

| Token | Value |
|---|---|
| `--safe-area-top` | `env(safe-area-inset-top, 0px)` |
| `--safe-area-bottom` | `env(safe-area-inset-bottom, 0px)` |
| `--safe-area-left` | `env(safe-area-inset-left, 0px)` |
| `--safe-area-right` | `env(safe-area-inset-right, 0px)` |

Safe areas are added to header top padding, FAB bottom/right offset, sheet bottom padding, and form body bottom padding.

### Grid

- Calendar grid: `display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px`
- Weekday labels: same 7-column grid, `gap: 2px`

---

## Shadows & Elevation

| Name | Value | Usage |
|---|---|---|
| `--glow-accent` | `0 0 20px rgba(61, 214, 140, 0.15), 0 0 60px rgba(61, 214, 140, 0.05)` | Accent element glow |
| `--glow-subtle` | `0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)` | General elevation |
| FAB shadow | `0 2px 8px rgba(61, 214, 140, 0.3), 0 8px 24px rgba(61, 214, 140, 0.2)` | Floating action button |
| Selected day | `0 2px 12px rgba(61, 214, 140, 0.25)` | Calendar selected cell |
| Accent button | `0 2px 12px rgba(61, 214, 140, 0.2)` | Primary action buttons |
| Danger button | `0 2px 12px rgba(255, 69, 58, 0.2)` | Delete confirm button |
| Training dot glow | `0 0 6px rgba(61, 214, 140, 0.4)` | Calendar training indicator dot |

Elevation hierarchy (low to high):
1. Card surface (`--color-bg-card` + `border: 1px solid var(--color-border-light)`)
2. Tertiary surface (`--color-bg-tertiary`)
3. Secondary surface (`--color-bg-secondary` + glass blur)
4. Primary surface with gradient (body background)
5. Modal overlays (`z-index: 100`)
6. Bottom sheets (`z-index: 1000`)

---

## Shapes

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Calendar day cells, small action buttons |
| `--radius-md` | `10px` | Nav buttons, inputs, textareas, action groups |
| `--radius-lg` | `14px` | Cards, sheet action buttons, tag buttons in sheets |
| `--radius-xl` | `20px` | Bottom sheet top corners |
| `--radius-full` | `9999px` | Tags, badges, pills, date badges, "today" button |

### Shape Rules

- All interactive elements use rounded corners — no sharp rectangles
- Tags and pills always use `--radius-full`
- Cards use `--radius-lg`
- Input fields use `--radius-md`
- Calendar cells use `--radius-sm`
- Bottom sheets have top corners rounded with `--radius-xl`, bottom corners are 0

---

## Components

### Buttons

**FAB (Floating Action Button)**
- Size: `56px × 56px`
- Background: `var(--color-accent)` (#4ae09a)
- Color: `var(--color-text-inverse)` (#111114)
- Border-radius: `16px`
- Shadow: green glow shadow
- Active: `scale(0.9)`, reduced shadow
- Position: `fixed`, bottom-right with safe-area offset

**Nav / Icon Buttons**
- Size: `38px × 38px`
- Border-radius: `var(--radius-md)` (10px)
- Color: `var(--color-text-secondary)` (#a0a0a8)
- Active: `background: var(--color-bg-card-hover)`, `color: var(--color-text-primary)`, `scale(0.9)`

**Action Buttons (in-card)**
- Size: `30px × 30px`
- Border-radius: `var(--radius-sm)` (6px)
- Edit: `color: var(--color-text-secondary)`, active → accent
- Delete: `color: var(--color-text-tertiary)`, active → danger
- Grouped in a container with `background: var(--color-bg-card)`, `border: 1px solid var(--color-border-light)`, `border-radius: var(--radius-md)`, `padding: 2px`

**Sheet Action Buttons**
- Width: `100%`
- Padding: `var(--space-xl)` (20px)
- Border-radius: `var(--radius-lg)` (14px)
- Font-size: `var(--font-size-lg)` (17px)
- Font-weight: `var(--font-weight-bold)`
- Confirm variant: accent background, inverse text, accent shadow
- Cancel variant: tertiary background, secondary text, light border
- Danger variant: danger background, white text, danger shadow
- Active: `scale(0.97)`, `opacity: 0.85`

**Tag Toggle Buttons**
- Font-size: `var(--font-size-lg)` (17px) in quick-add, `var(--font-size-sm)` (13px) in form
- Padding: `var(--space-md) var(--space-xl)` in quick-add, `var(--space-sm) var(--space-xl)` in form
- Border-radius: `var(--radius-lg)` in quick-add, `var(--radius-full)` in form
- Default: `color: var(--color-text-secondary)`, `background: var(--color-bg-card)`, `border: 1.5px solid var(--color-border)`
- Active: `color: var(--color-accent)`, `border-color: var(--color-accent)`, `background: var(--color-accent-surface)`, `scale(1.05)`
- Active+pressed: `scale(1.0)`
- Disabled: `opacity: 0.4`, `pointer-events: none`

### Cards

**Training Card**
- Background: `var(--color-bg-card)` with `backdrop-filter: blur(20px)`
- Border-radius: `var(--radius-lg)` (14px)
- Border: `1px solid var(--color-border-light)`
- Padding: `var(--space-lg) var(--space-xl)` (16px 20px)
- Margin-bottom: `var(--space-sm)` (8px)
- Active: `scale(0.98)`, `border-color: var(--color-border)`
- Entrance animation: `fade-in-up` with stagger delay

### Tags / Badges

**Training Tag (in card)**
- Font-size: `var(--font-size-sm)` (13px)
- Font-weight: `var(--font-weight-semibold)`
- Padding: `4px 10px`
- Border-radius: `var(--radius-full)`
- Color: `var(--color-accent)`
- Background: `var(--color-accent-surface)`

**Preset Tag (in form, unselected)**
- Font-size: `var(--font-size-sm)` (13px)
- Padding: `var(--space-xs) var(--space-md)` (4px 12px)
- Border-radius: `var(--radius-full)`
- Color: `var(--color-text-tertiary)`
- Background: `var(--color-bg-card)`
- Border: `1px solid var(--color-border-light)`

**Selected Tag**
- Color: `var(--color-accent)`
- Border-color: `var(--color-accent)`
- Background: `var(--color-accent-surface)`

**Custom Tag (user-added)**
- Color: `var(--color-text-inverse)`
- Background: `var(--color-accent)`
- Border-color: `var(--color-accent)`

**Date Badge**
- Font-size: `var(--font-size-2xs)` (9px)
- Font-family: `var(--font-mono)`
- Font-weight: `var(--font-weight-semibold)`
- Padding: `6px 12px`
- Border-radius: `var(--radius-full)`
- Border: `1px solid var(--color-border-light)`
- Background: `var(--color-bg-card)`
- Color: `var(--color-text-tertiary)`

### Input Fields

**Text Input**
- Background: `var(--color-bg-card)`
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-md)` (10px)
- Padding: `var(--space-md) var(--space-xl)` (12px 20px)
- Font-size: `var(--font-size-lg)` (17px)
- Font-weight: `var(--font-weight-medium)`
- Focus: `border-color: var(--color-accent)`, `box-shadow: 0 0 0 3px var(--color-accent-dim), var(--glow-accent)`, `background: var(--color-bg-card-hover)`
- Placeholder: `color: var(--color-text-tertiary)`, `font-weight: var(--font-weight-regular)`

**Textarea**
- Same as text input but with `resize: none`, `line-height: var(--line-height-relaxed)`, `font-size: var(--font-size-md)`

**Tag Input (inline mini input)**
- Width: `56px`, expands to `72px` on focus
- Border: `1px dashed var(--color-border)`, solid accent on focus
- Border-radius: `var(--radius-full)`
- Padding: `var(--space-xs) var(--space-sm)`
- Font-size: `var(--font-size-sm)`

### Bottom Sheets

**Overlay**
- `position: fixed; inset: 0`
- Background: `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(8px)`
- Z-index: `1000`
- Animation: fade-in over `var(--duration-normal)`

**Sheet Panel**
- Max-width: `var(--max-content-width)` (480px)
- Background: `var(--color-bg-secondary)` (#1a1a1f)
- Top corners: `var(--radius-xl)` (20px), bottom: 0
- Top border: `1px solid var(--color-border)`
- Padding-bottom: `var(--safe-area-bottom)`
- Animation: slide-up from bottom over `var(--duration-normal)`

**Handle**
- Width: `36px`, Height: `4px`
- Border-radius: `2px`
- Background: `rgba(255, 255, 255, 0.15)`
- Margin: `var(--space-md) auto 0`

**Quick Add Sheet** (lighter variant)
- Same structure but z-index `100`, blur `4px`, overlay `rgba(0,0,0,0.5)`

### Calendar

**Grid**
- 7-column CSS grid, `gap: 3px`
- Padding: `0 var(--space-xl)`

**Day Cell**
- `aspect-ratio: 1` (square)
- Border-radius: `var(--radius-sm)` (6px)
- Default: transparent background
- Today (not selected): `background: var(--color-accent-surface)`
- Selected: `background: var(--color-accent)`, `scale(1.05)`, accent shadow, inverse text color
- Other month: `opacity: 0.5` on number and indicators
- Active: `scale(0.9)` (not selected), `scale(0.95)` (selected)

**Training Indicator Dot**
- Size: `5px × 5px` (6px when today)
- Border-radius: `50%`
- Background: `var(--color-accent)` with glow
- Position: `absolute; bottom: 5px`
- On selected day: inverse color, no glow

**Tag Text (in cell)**
- Font-size: `8px`
- Font-weight: `var(--font-weight-semibold)`
- Color: `var(--color-accent)` (inverse on selected day)
- Position: `absolute; bottom: 2px`
- Max-width: `calc(100% - 6px)`, text overflow ellipsis

---

## Animation & Motion

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `100ms` | Button active state transitions |
| `--duration-fast` | `180ms` | Hover/focus transitions, tag toggles |
| `--duration-normal` | `280ms` | Sheet entrance, page transitions, card entrance |
| `--duration-slow` | `400ms` | Section entrance animations |
| `--duration-slower` | `500ms` | FAB entrance delay |

### Easing Curves

| Token | Value | Usage |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | Primary easing — most transitions, entrances |
| `--ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | General purpose, button state changes |
| `--ease-decelerate` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements entering view |
| `--ease-accelerate` | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements leaving view |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved for bouncy interactions |

### Animation Patterns

**Page Entrance (fade-in-up)**
- From: `opacity: 0; translateY(12px)`
- To: `opacity: 1; translateY(0)`
- Duration: `var(--duration-slow)` (400ms)
- Easing: `var(--ease-out-expo)`
- Stagger delays: header 50ms, calendar 100ms, form body 100ms, section header 300ms, training list 350ms, FAB 500ms

**Form Page Entrance (slide from right)**
- From: `translateX(100%); opacity: 0.5`
- To: `translateX(0); opacity: 1`
- Duration: `var(--duration-normal)` (280ms)
- Easing: `var(--ease-out-expo)`

**Sheet Entrance (slide from bottom)**
- From: `translateY(100%)`
- To: `translateY(0)`
- Duration: `var(--duration-normal)` (280ms)
- Easing: `var(--ease-out-expo)`

**Scale Feedback**
- Active/pressed: `scale(0.9)` to `scale(0.98)` depending on element size
- Larger elements use smaller scale (cards: 0.98, cells: 0.9)
- Duration: `var(--duration-fast)` or `var(--duration-instant)`

**Loading Spinner**
- Border: `2px solid var(--color-border)` with `border-top-color: var(--color-accent)`
- Rotation: `0.7s linear infinite`

**Reduced Motion**: All animations and transitions collapse to `0.01ms` when `prefers-reduced-motion: reduce` is active.

---

## Do's and Don'ts

### Do

- **Do** use `var(--color-accent)` (#4ae09a) as the single source of truth for all interactive accent colors
- **Do** use the spacing scale variables (`--space-*`) — never hardcode pixel values for padding, margin, or gap
- **Do** use the radius scale variables (`--radius-*`) — never hardcode border-radius values
- **Do** apply `backdrop-filter: blur()` on overlay surfaces (sheets, headers) for glass effect
- **Do** use `var(--font-mono)` for dates, numbers, and data values
- **Do** add safe-area offsets (`var(--safe-area-*)`) to fixed-position elements and page edges
- **Do** use `scale()` transforms for press feedback instead of changing dimensions
- **Do** respect `prefers-reduced-motion` media query
- **Do** use BEM naming: `.block__element--modifier`
- **Do** stagger entrance animations with incremental delays (50ms, 100ms, 300ms, 350ms, 500ms)
- **Do** use `fade-in-up` for content entrance and `form-page-in` for full-page transitions
- **Do** keep all content within `max-width: 480px` centered container
- **Do** use `aspect-ratio: 1` for square grid cells
- **Do** use functional `setState(prev => ...)` pattern for state updates that depend on previous state

### Don't

- **Don't** introduce new green shades — always derive from `#4ae09a` using the accent token family
- **Don't** use pure white (#fff) for text — use `#f5f5f7` (`--color-text-primary`) instead
- **Don't** use solid borders on dark surfaces — use `rgba(255, 255, 255, 0.06–0.1)` for subtle separation
- **Don't** create z-index values above 1000 (reserved for bottom sheets)
- **Don't** use `position: fixed` without safe-area offset compensation
- **Don't** hardcode pixel values for font-size, spacing, or border-radius — always use CSS variables
- **Don't** use `color: black` or `#000` — the inverse text color is `#111114` (`--color-text-inverse`)
- **Don't** add box-shadows without matching the existing shadow style (colored glow for accent, dark for elevation)
- **Don't** use `transform: translateY()` for hover states on mobile — only for entrance animations and active/press feedback
- **Don't** use `font-weight` values outside the defined scale (300, 400, 500, 600, 700, 900)
- **Don't** combine `card-elevated` style with `border-strong` — surfaces should have either subtle border OR elevation, never both prominently
- **Don't** use accent color (#4ae09a) for decorative/non-interactive backgrounds wider than 200px — it is exclusively for interactive elements and status indicators
- **Don't** use `useEffect` with `setState` for initializing component state from props — use lazy initializer `useState(() => ...)` or the `key` pattern to reset
- **Don't** store module-level date values (e.g., `const today = new Date()` outside components) — they won't update when the user crosses midnight
