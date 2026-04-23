# Accessibility

The color system supports two accessibility regimes beyond the default: **forced colors** (Windows High Contrast, browser "force colors" preferences) and **high contrast** (`prefers-contrast: more` — landing in PR B).

The architectural claim: **these regimes are derived from the semantic vocabulary the system already has.** You don't re-author surfaces for accessibility; you declare their role once, and the generator maps them.

## The `role` field

Every surface has a semantic role. It drives the forced-colors mapping — and will drive future accessibility axes.

```ts
interface SurfaceConfig {
  position: number;
  role?: "surface" | "interactive" | "alert" | "link"; // default: "surface"
  // ...
}
```

| Role          | Meaning                            | Example surfaces     |
| ------------- | ---------------------------------- | -------------------- |
| `surface`     | Standard content surface (default) | `page`, `card`       |
| `interactive` | Button-like                        | `action`             |
| `alert`       | Status / notification              | `success`, `error`   |
| `link`        | Hyperlink surface                  | Link-styled elements |

Most surfaces are `"surface"`. Tag `action` and similar as `"interactive"`. Tag status surfaces as `"alert"`.

## Forced colors

When the user enables forced colors, the OS supplies a restricted palette via CSS system color keywords. The system emits a `@media (forced-colors: active)` block that remaps surface and token values per role.

| Role          | Surface      | Text                  | Border         |
| ------------- | ------------ | --------------------- | -------------- |
| `surface`     | `Canvas`     | `CanvasText`          | `CanvasText`   |
| `interactive` | `ButtonFace` | `ButtonText`          | `ButtonBorder` |
| `alert`       | `Canvas`     | `CanvasText` → `Mark` | `CanvasText`   |
| `link`        | `Canvas`     | `LinkText`            | `CanvasText`   |

Across every role:

- `.text-link` → `LinkText`
- `.text-disabled` → `GrayText`

### Alert cascade fallback

`alert`-role surfaces emit two declarations for each text token: `CanvasText` first, then `Mark`. Browsers that support `Mark` apply it; older ones keep the `CanvasText` baseline. Both are legible; only one is ideal.

### Text utilities

Two new utilities accompany the system color story:

- `.text-link` — links, underlined. Under forced colors: `LinkText`.
- `.text-disabled` — disabled text. Under forced colors: `GrayText`.

## High contrast

`@media (prefers-contrast: more), (prefers-contrast: custom)` re-solves surfaces with tighter targets and an optional separate high-contrast scale.

### How it works

Each `PolarityScale` can optionally declare a `highContrast` companion scale:

```ts
scale: {
  page: {
    light: [0.975, 0.955, 0.9, 0.85, 0.78],
    dark: [0.1, 0.18, 0.25, 0.32, 0.4],
    highContrast: {
      light: [0.99, 0.982, 0.96, 0.94, 0.912],
      dark: [0.04, 0.072, 0.1, 0.128, 0.16],
    },
  },
  inverted: {
    // No highContrast: inverted already lives at the edge of what
    // the architecture allows. HC mode uses target bumps only.
    light: [0.1, 0.12],
    dark: [0.9, 0.88],
  },
}
```

When HC is active, the solver re-solves text and border values against:

- The HC scale, if present, and
- Tighter default targets (`TEXT_GRADES_HIGH_CONTRAST`: `high: 100, strong: 100, subtle: 95, subtlest: 90`).

The generator emits the re-solved values under `@media (prefers-contrast: more), (prefers-contrast: custom)`. This block comes **before** the forced-colors block so forced-colors wins the cascade for users who have both active.

### Configurable targets

The library caps `high` at 100 by default — the APCA practical ceiling. Users with stricter accessibility needs can override:

```ts
accessibility: {
  textGrades: { high: 108, strong: 105, subtle: 100, subtlest: 95 },
  borderTargets: { decorative: 25, interactive: 60, critical: 90 },
}
```

### Deriving an HC scale at authoring time

`deriveHcScale` is a helper for the _config-authoring step_ — not the runtime. It pushes each position toward its mode's extreme:

```ts
import { deriveHcScale } from "@design-axioms/color";
const pageHc = deriveHcScale(base.page, { factor: 0.6 });
// Inline the result into your config — don't derive at runtime.
```

The helper is opt-in; most configurations are clearer with explicit arrays.

### Inverted polarity under HC

Inverted surfaces swap `light-dark()` branches at emission time so children inherit `color-scheme: dark` (and vice versa) correctly. The HC media block **replicates the same swap** so inverted HC values land in the right branch. If you hand-author the HC emission (e.g. in a framework that can't run the generator), preserve this.

### Simulating HC in a demo

Set `highContrastSimulationClass: "hc-simulate"` on `generateCSS` options to emit an additional class-triggered copy of the HC rules. A demo can toggle the class on `<html>` to preview HC mode without changing OS settings.

## Surface distinction

The system guarantees that adjacent same-polarity surfaces stay visually distinguishable. When lightness stagger falls below APCA Lc 45, the generator emits a distinction mechanism — by default an inset 1px border sourced from `--axm-border-decorative`.

The rule is checked per-mode (base and HC) and per-surface. Two outs:

- The outermost surface in each polarity (position 0) never carries distinction — there is nothing outside it to be distinguished from.
- Per-surface overrides (`distinction.overrides`) let users opt out (`false`), opt in (`true`), or supply their own CSS snippet.

Atmosphere (`targetChroma > 0`) does **not** rescue the rule. The taper in §5 reduces effective chroma to near-zero at the lightness extremes where our surfaces live, so a colored surface next to an achromatic one of the same lightness is still at the same lightness — and that's what spatial perception reads. Atmosphere is a secondary signal layered on top of the lightness-derived distinction.

### Configuration

```ts
distinction: {
  threshold: 45,          // APCA Lc. Default 45 (APCA "essential non-text").
  mechanism: "inset",     // "inset" | "border" | "none"
  token: "decorative",    // which border token to source from
  overrides: {            // per-surface escape hatches
    card: false,          // skip card's distinction
    workspace: "outline: 2px dashed red",  // custom
  },
}
```

The default mechanism is an inset box-shadow because it doesn't affect layout. If you prefer a real border (affecting box size), set `mechanism: "border"`.

## Reduced contrast

The default scale serves as the low-contrast case. There's no separate `prefers-contrast: less` scale.

## What's out of scope

- **`prefers-reduced-motion`** — the system uses CSS transitions on surface backgrounds only; respecting reduced motion is the consumer's responsibility.
- **Font size / zoom** — font size affects APCA thresholds in practice (smaller text needs higher contrast). The default targets are calibrated for ~14–16px body copy. Apps with smaller text should raise their targets.
