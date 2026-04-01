# Core Concepts

## Surfaces

A surface is a named region with a semantic identity. `card` always means `card` — its lightness is determined by its name and polarity, not by DOM nesting depth.

The default configuration defines five surfaces across two polarities:

| Surface   | Polarity | Role                         |
| --------- | -------- | ---------------------------- |
| Page      | page     | Base background              |
| Workspace | page     | Elevated work area           |
| Card      | page     | Content container            |
| Action    | page     | Interactive element (button) |
| Spotlight | inverted | High-emphasis callout        |

Each surface class sets CSS custom properties that text and border utilities consume:

```css
.surface-card {
  --axm-surface: light-dark(oklch(...), oklch(...));
  --axm-text-high: light-dark(oklch(...), oklch(...));
  --axm-text-strong: light-dark(oklch(...), oklch(...));
  /* ...etc */
  background: var(--axm-surface);
}
```

## Polarity

Surfaces belong to one of two independent **polarity ladders**:

- **Page polarity** — light surfaces in light mode, dark in dark mode
- **Inverted polarity** — the opposite: dark in light mode, light in dark mode

Cross-polarity pairs (e.g., Page ↔ Spotlight) have massive APCA contrast gaps (80+ points). This is a **guarantee**, not an enhancement. Same-polarity pairs (Page ↔ Workspace) have small lightness differences — real but not load-bearing for hierarchy.

## Text Grades

Text on any surface is available in four contrast grades:

| Grade    | APCA Target | Use                                                    |
| -------- | ----------- | ------------------------------------------------------ |
| High     | 100         | Maximum contrast — high contrast mode, critical labels |
| Strong   | 95          | Body text — comfortable sustained reading              |
| Subtle   | 90          | Secondary text — supporting information                |
| Subtlest | 75          | Tertiary text — hints, timestamps, metadata            |

The solver binary-searches for the text lightness that achieves each target. When the surface's APCA ceiling can't reach a target, the solver finds the best achievable value and flags it in diagnostics.

## Border Tiers

Borders follow the same pattern — three tiers solved per surface:

| Tier        | APCA Target | Use                                                  |
| ----------- | ----------- | ---------------------------------------------------- |
| Decorative  | 10          | Subtle edges — card boundaries, dividers             |
| Interactive | 30          | Visible boundaries — input outlines, active dividers |
| Critical    | 80          | High-contrast — focus rings, error outlines          |

## Atmosphere

Atmosphere is the hue and chroma that permeate all surfaces. It's set via CSS custom properties (`--axm-atm-hue` and `--axm-atm-chroma`) that inherit through the DOM.

A key color (like a brand purple `#6e56cf`) seeds the atmosphere — the system extracts its oklch hue and chroma and applies them to every surface. The **safe bicone taper** automatically reduces chroma near lightness extremes:

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

At L=0.5, full chroma shows through. At L=0 or L=1, chroma collapses to zero. This prevents out-of-gamut colors without manual intervention.
