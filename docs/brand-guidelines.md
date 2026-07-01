# FinEval Brand Guidelines

> Version 1.0 · June 2026

---

## 1. Logo

### Mark
A flat-top hexagon containing an upward chart line with six data points — the rightmost and highest point is the largest dot, representing a quality threshold being met. No gradients, no shadows, no embellishments.

### Wordmark
- **Fin** — bold weight, brand blue
- **Eval** — light weight, ink (light theme) or snow (dark theme)
- 30px gap between the two words — never merged, never touching

### Variants

| Variant | File | Use when |
|---|---|---|
| Light | `fineval-light.png` | White or light backgrounds |
| Dark | `fineval-dark.png` | Dark or navy backgrounds |

### Clear space
Maintain clear space equal to the height of the hex mark on all four sides of the logo. No text, icons, or other elements within this zone.

### Minimum size
- Horizontal lockup: 120px wide minimum
- Below 120px, use the hex mark only (crop from the full logo)

### What not to do
- Do not recolour the logo
- Do not stretch or distort proportions
- Do not place the light variant on dark backgrounds
- Do not add drop shadows or effects
- Do not use the wordmark alone except in severely constrained spaces (e.g. favicon fallback)

---

## 2. Colour palette

### Primary

| Name | Hex | Usage |
|---|---|---|
| Brand blue | `#2563EB` | Primary action, logo mark, chart line, links — light theme |
| Blue light | `#60A5FA` | Brand blue equivalent for dark theme |
| Ink | `#0F172A` | Primary text, dark background surface |
| Snow | `#F8FAFC` | Light background surface, logo background |

### Supporting

| Name | Hex | Usage |
|---|---|---|
| Blue tint | `#EFF6FF` | Hex fill, badges, card highlights |
| Blue grid | `#DBEAFE` | Grid lines, borders, dividers |
| Slate | `#64748B` | Secondary text, labels, metadata |
| Pass green | `#16A34A` | CI gate pass, eval threshold met |
| Fail red | `#DC2626` | CI gate fail, threshold breached |
| Warn amber | `#D97706` | Near-threshold warning states |

### Dark theme equivalents

| Light | Dark | Role |
|---|---|---|
| `#2563EB` | `#60A5FA` | Brand / interactive |
| `#0F172A` | `#F1F5F9` | Primary text |
| `#64748B` | `#94A3B8` | Secondary text |
| `#EFF6FF` | `#1E2D4A` | Tint surface |
| `#DBEAFE` | `#263C64` | Grid / border |

### CSS custom properties

```css
:root {
  --color-brand:        #2563EB;
  --color-brand-light:  #60A5FA;
  --color-brand-tint:   #EFF6FF;
  --color-ink:          #0F172A;
  --color-secondary:    #64748B;
  --color-snow:         #F8FAFC;
  --color-grid:         #DBEAFE;
  --color-border:       #E2E8F0;
  --color-card:         #FFFFFF;
  --color-pass:         #16A34A;
  --color-fail:         #DC2626;
  --color-warn:         #D97706;
}

[data-theme="dark"] {
  --color-brand:        #60A5FA;
  --color-brand-tint:   #1E2D4A;
  --color-ink:          #F1F5F9;
  --color-secondary:    #94A3B8;
  --color-snow:         #0F172A;
  --color-grid:         #263C64;
  --color-border:       #1E293B;
  --color-card:         #1E293B;
}
```

---

## 3. Typography

### Typeface
System font stack — no custom typeface required:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Helvetica Neue, Arial, sans-serif;
```

Monospace for metrics, scores, and code:

```css
font-family: 'SF Mono', 'Fira Code', 'Cascadia Code',
             Consolas, monospace;
```

### Type scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display | 48px | 700 | Hero headings, page titles |
| Heading | 28px | 600 | Section headings, card titles |
| Subheading | 18px | 500 | Sub-sections, sidebar titles |
| Body | 15px | 400 | Paragraph text, descriptions |
| Mono | 13px | 400 | Scores, latency values, code |
| Label | 11px | 500 | Uppercase spaced category labels |

### Label style
All uppercase labels use `letter-spacing: 0.08em` and `text-transform: uppercase`. Maximum two words. Used for section markers and metadata categories only — not for body content.

### Rules
- Sentence case everywhere except labels and proper nouns
- No terminal punctuation on headings and button labels
- Line height 1.6 for body, 1.1–1.2 for display and headings
- Never use font-weight 600 or 700 for body copy

---

## 4. Spacing scale

Based on a 4px base unit:

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Icon internal padding, micro gaps |
| `--space-2` | 8px | Inline gap between label and value |
| `--space-3` | 12px | Component internal padding |
| `--space-4` | 16px | Card padding, list item gap |
| `--space-6` | 24px | Section internal spacing |
| `--space-8` | 32px | Between cards in a grid |
| `--space-12` | 48px | Between page sections |
| `--space-16` | 64px | Top-level page padding |

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 5. Border radius

| Value | Usage |
|---|---|
| `4px` | Chips, small badges, code blocks |
| `8px` | Buttons, inputs, small cards |
| `12px` | Cards, panels, modals |
| `999px` | Avatars, pills, toggle switches |

---

## 6. Borders

All borders use `0.5px` stroke weight — never 1px or 2px for structural borders. The exception is a featured card accent which uses `2px solid var(--color-brand)`.

```css
border: 0.5px solid var(--color-border);
```

---

## 7. Iconography

Use [Tabler Icons](https://tabler.io/icons) outline style exclusively. Never filled variants. Size at 16–20px inline, 24px maximum for decorative use.

Key icons in the FinEval context:

| Icon | Usage |
|---|---|
| `ti-chart-bar` | Eval scores, metrics |
| `ti-check` | CI gate pass, test passed |
| `ti-x` | CI gate fail, test failed |
| `ti-upload` | Document upload |
| `ti-brain` | AI agent, LLM |
| `ti-database` | Qdrant, Neon |
| `ti-clock` | Latency, p95 timing |
| `ti-file-text` | Test reports, findings |

---

## 8. Status colours

Used consistently across the eval dashboard, CI gate, and test reports:

| State | Colour | Hex | When to use |
|---|---|---|---|
| Pass | Green | `#16A34A` | Score above threshold |
| Fail | Red | `#DC2626` | Score below threshold |
| Warn | Amber | `#D97706` | Within 10% of threshold |
| Running | Blue | `#2563EB` | Test in progress |
| Not run | Slate | `#64748B` | No data yet |

Background tints for status chips:

```css
.status-pass { background: #DCFCE7; color: #166534; }
.status-fail { background: #FEE2E2; color: #991B1B; }
.status-warn { background: #FEF3C7; color: #92400E; }
.status-run  { background: #DBEAFE; color: #1E40AF; }
.status-idle { background: #F1F5F9; color: #475569; }
```

---

## 9. Voice and tone

FinEval communicates like a senior engineer writing a clear post-mortem — precise, no filler, actionable.

**Do**
- Use active voice: "CI gate blocked deployment" not "Deployment was blocked"
- Name the specific metric: "Faithfulness 0.58 — below threshold 0.70"
- State what to do next: "Re-run evals after fixing chunk size"

**Don't**
- Use marketing language: "powerful", "seamless", "unlock"
- Soften failures: always state clearly when a threshold was missed
- Add exclamation marks to system messages

### UI copy patterns

| Context | Example |
|---|---|
| Gate pass | `CI gate passed — all 4 metrics within thresholds` |
| Gate fail | `CI gate failed — faithfulness 0.58 below minimum 0.70` |
| Test running | `Running DeepEval suite — 12 of 30 test cases complete` |
| Empty state | `No eval runs yet. Push to main to trigger the pipeline.` |
| Error | `MLflow connection failed. Check MLFLOW_TRACKING_URI in .env` |

---

## 10. File naming convention

```
fineval-light.png          ← horizontal lockup, light theme
fineval-dark.png           ← horizontal lockup, dark theme
fineval-mark-light.png     ← hex mark only, light theme
fineval-mark-dark.png      ← hex mark only, dark theme
fineval-favicon.png        ← 64x64 mark for browser tab
fineval-og.png             ← 1200x630 open graph image
```

---

## 11. Do not use

- No gradients in UI elements or logo
- No drop shadows (except functional focus rings)
- No stock photography
- No decorative illustrations unrelated to data/evaluation
- No animated GIFs in documentation
- No colour combinations that fail WCAG AA contrast (4.5:1 for body text)