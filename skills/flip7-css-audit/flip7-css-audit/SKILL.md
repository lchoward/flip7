---
name: flip7-css-audit
description: >
  Audit the Flip 7 project's CSS for hardcoded values, unused classes, and
  inconsistencies with the design system. Use this skill when the user wants to
  clean up styles, check for design system compliance, find unused CSS, or
  ensure consistency across components. Trigger on phrases like "audit CSS",
  "check styles", "unused CSS", "hardcoded colors", "design system check",
  "style cleanup", "CSS consistency", or "theme compliance".
---

# Flip 7 CSS Theme Auditor

This skill scans all CSS files in the Flip 7 project and flags issues that undermine the design system's consistency. The project uses CSS custom properties (variables) defined in `src/styles/global.css`, and every component should reference them rather than hardcoding values.

## Design System Reference

These are the canonical tokens from `src/styles/global.css`:

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | #0f1923 | Page background |
| `--surface` | #1a2735 | Card/panel backgrounds |
| `--surface2` | #223344 | Secondary surface (badges, borders) |
| `--primary` | #00d4aa | Primary teal — scores, headings, focus states |
| `--primary-dim` | #00a885 | Dimmer teal — gradients, hover states |
| `--accent` | #ffb347 | Orange — leader highlights, winner |
| `--accent2` | #ff6b6b | Red — danger buttons, bust indicator |
| `--text` | #e8f0f8 | Primary text color |
| `--text-dim` | #8899aa | Secondary/muted text |
| `--card-bg` | #fff | Card background (light context) |

### Spacing & Shape
| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 16px | Large border-radius (panels, banners) |
| `--radius-sm` | 10px | Small border-radius (rows, badges) |
| `--card-shadow` | 0 4px 20px rgba(0,0,0,0.3) | Standard box shadow |

### Fonts
| Font | Usage |
|------|-------|
| `'Fredoka', sans-serif` | Headings, scores, numbers, buttons — always weight 700 |
| `'DM Sans', sans-serif` | Body text — set on `body`, inherited |

## What to Audit

### 1. Hardcoded Colors

Scan all `.css` and `.module.css` files for color values that should be using tokens. Flag any hex codes, `rgb()` / `rgba()` values, or named colors that could use a design token instead.

**Exceptions** (don't flag these):
- `transparent` — always fine
- `#fff` / `rgba(255,255,255,...)` in the winner banner gradient — intentional white text on a colored gradient
- Colors inside the `:root` block itself — that's where tokens are defined
- The gradient values `#ffb347` and `#ff6b6b` in `GameScreen.module.css`'s winner banner — these are the accent colors used directly in a `linear-gradient()`, which is acceptable since CSS variables can't always be used inside gradients the same way
- `rgba(0, 212, 170, 0.3)` and `rgba(0, 212, 170, 0.5)` in buttons.css — these are the primary color with opacity for box-shadows, where `rgba` is needed

### 2. Hardcoded Dimensions

Flag `border-radius` values that should use `--radius` or `--radius-sm`:
- Look for pixel values that are close to 16px or 10px but aren't using the token
- Exception: `50px` for pill-shaped buttons is intentional
- Exception: `20px` for small badges (like `.roundBadge`) is fine as a distinct element
- Very small values like `4px` for minor UI details are acceptable

### 3. Unused CSS Classes

For each `.module.css` file, check if every class it defines is referenced in its paired `.jsx` file. CSS modules scope classes to their component, so an unused class in a module is dead code.

How to check: each class `.foo` in `Component.module.css` should appear as `styles.foo` somewhere in `Component.jsx`. If it doesn't, it's unused.

### 4. Font Consistency

Flag any `font-family` declarations that don't use one of the two project fonts (`Fredoka` or `DM Sans`). Also flag places where Fredoka is used without `font-weight: 700` — the project convention is that Fredoka always appears bold.

### 5. Missing Hover/Active States

Interactive elements (anything with `cursor: pointer`) should have `:hover` and/or `:active` states. Flag clickable elements that lack them — they'll feel unresponsive.

## How to Run the Audit

Read all CSS files in the project:
- `src/styles/global.css`
- `src/styles/buttons.css`
- All `src/components/*/*.module.css` files

And all JSX files:
- All `src/components/*/*.jsx` files

Then check each rule above and produce a report.

## Report Format

Organize findings by severity:

**Issues** — Things that should probably be fixed:
```
src/components/Foo/Foo.module.css:29
  Hardcoded color #1a2735 — use var(--surface) instead
```

**Suggestions** — Worth considering but not necessarily wrong:
```
src/components/Bar/Bar.module.css:45
  border-radius: 12px — could use var(--radius-sm) for consistency
```

**Summary** at the end with quick counts:
```
Audit complete: 3 issues, 2 suggestions, 0 unused classes
```

If everything looks clean, say so — a passing audit is good news worth celebrating.
