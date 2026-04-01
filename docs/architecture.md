# Architecture

This document describes the architecture decisions validated through experiment-driven development. Each decision is backed by evidence from the experiment scripts in the original research repository.

## Core Thesis

The color system guarantees **contrast correctness** — that text, borders, and interactive elements on any surface meet APCA accessibility targets. It does not guarantee visual hierarchy. Hierarchy is a multi-signal problem (borders, shadows, spacing, lightness, chroma) that belongs to a design system layer built on top.

## 1. Mode Mechanism: `light-dark()`

Use CSS `light-dark()` as the primary mode-switching mechanism.

**Consequences:**

- Each mode is independently solved: light and dark are separate, complete solutions
- `color-scheme` on `:root` drives mode; `transition` on surface properties drives animation
- No intermediate states — eliminates the need for chroma tunneling during transitions
- Each `light-dark()` wraps two complete `oklch()` colors (not bare numbers)

## 2. Solver Role: Validator, Not Computer

The solver is a constraint satisfaction engine. It validates that the system's guarantees can be met, pre-solves all lightness values, and reports what it finds.

**What the solver does:**

- Places surfaces on the lightness ladder per polarity, group order, and contrast offsets
- Pre-solves text lightness for all grades on all surfaces (both modes)
- Pre-solves border lightness for all tiers on all surfaces (both modes)
- Computes hue-aware safety margins
- Classifies composition relationships (guarantee vs enhancement)
- Reports diagnostics — the "noisy no" for unmet targets

**What the solver does NOT do:**

- Compute intermediate mode states (eliminated by `light-dark()`)
- Track DOM nesting depth or parent-relative composition

## 3. Text Derivation

Since `light-dark()` only accepts `<color>` values, both mode branches must emit complete `oklch()` colors with pre-solved lightness. The solver is the single source of truth for all lightness values.

**Dead zone (L ≈ 0.46–0.82):** No surface should be placed in this range — neither polarity can produce adequate text contrast.

## 4. Chroma and Hue Effects

**Chroma effect on APCA:** Negligible. Even at C = 0.30, APCA shifts by at most ~0.6 points.

**Hue effect (Helmholtz-Kohlrausch):** Significant. At L = 0.9, C = 0.15, the hue swing is ~5.4 APCA points. Worst-case hues are magenta/red (~330°).

**Safety margins by chroma level:**

| Chroma | Safety Margin |
|--------|---------------|
| 0.05   | 2 APCA pts    |
| 0.10   | 3 APCA pts    |
| 0.15   | 4 APCA pts    |
| 0.20   | 5 APCA pts    |

The solver adds the appropriate margin before validating. This guarantees targets are met at worst-case hue.

## 5. Safe Bicone Taper

Chroma fades near lightness extremes via a single `calc()` expression:

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

At $L = 0.5$, full chroma. At $L = 0$ or $L = 1$, chroma collapses to zero. This prevents out-of-gamut colors at the CSS level. The `min(C, ...)` wrapper from the spec is algebraically redundant since the taper factor is always in $[0, 1]$.

## 6. Surface Composition: Three-Tier Contract

### Tier 1: Guarantees

- Text on any surface meets its APCA target grade
- Cross-polarity surface pairs are visually distinct (80+ APCA gap)
- Atmosphere (hue/chroma) is correct and inheritable

### Tier 2: Enhancements

- Small lightness steps between same-polarity surfaces
- State variations (hover, active) as lightness shifts
- Real, non-zero values — but not guaranteed as sufficient for visual distinction alone

### Tier 3: Out of Scope

- Multi-signal visual hierarchy (border + shadow + spacing + lightness + chroma)
- Consumers who need surface distinction must layer additional signals

## 7. Surface Identity: Semantic, Not Positional

A surface's lightness is fixed by its semantic name and the current mode/polarity. It does not change based on DOM nesting depth or parent surface.

- `card` always resolves to the same lightness, whether inside `page` or `workspace`
- The solver has no depth parameter — it solves each surface once per mode × polarity
- CSS resets local tokens per `.surface-*` class; descendants inherit the nearest surface's context

## 8. Polarity: Two Independent Ladders

Page-polarity and inverted-polarity surfaces live on independent lightness ladders. A polarity flip is a context reset, not a nesting level.

- Page surfaces share one contrast budget (solved against page anchors)
- Inverted surfaces share a separate budget (solved against inverted anchors)
- An inverted surface inside a page surface starts fresh on its own ladder

## 9. Atmosphere: Orthogonal to Lightness

Two orthogonal composition axes:

- **Lightness composition** — finite budget, semantic ladder, max ~2 distinguishable levels per polarity per mode
- **Atmosphere composition** — hue/chroma tinting, inherited down the DOM, does not consume lightness budget

A key color seeds the atmosphere. The taper (§5) ensures it degrades gracefully at lightness extremes.

## 10. CSS Architecture

**Inheritance model:**

- Surface classes write local tokens: background, text values, border values, atmosphere
- Text/border utilities consume the nearest ancestor surface's tokens
- A child surface class resets the context — it does not additively compose

**`light-dark()` integration:**

- Each surface class writes `light-dark(oklch(...), oklch(...))` for every token
- Mode switch = change `color-scheme` on `:root`
- Animation = CSS `transition` on the properties that change

**Registered properties:**

- `--axm-atm-hue` and `--axm-atm-chroma`: inheriting, initial value 0
- Surface-local vars: scoped by class, not registered
