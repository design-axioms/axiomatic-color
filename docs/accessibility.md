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

| Role          | Surface      | Text           | Border                       |
| ------------- | ------------ | -------------- | ---------------------------- |
| `surface`     | `Canvas`     | `CanvasText`   | `CanvasText`                 |
| `interactive` | `ButtonFace` | `ButtonText`   | `ButtonBorder`               |
| `alert`       | `Canvas`     | `CanvasText` → `Mark` | `CanvasText`          |
| `link`        | `Canvas`     | `LinkText`     | `CanvasText`                 |

Across every role:

- `.text-link` → `LinkText`
- `.text-disabled` → `GrayText`

### Alert cascade fallback

`alert`-role surfaces emit two declarations for each text token: `CanvasText` first, then `Mark`. Browsers that support `Mark` apply it; older ones keep the `CanvasText` baseline. Both are legible; only one is ideal.

### Text utilities

Two new utilities accompany the system color story:

- `.text-link` — links, underlined. Under forced colors: `LinkText`.
- `.text-disabled` — disabled text. Under forced colors: `GrayText`.

## High contrast (PR B — not yet shipped)

`prefers-contrast: more | custom` re-solves surfaces with tighter targets and optionally a separate high-contrast scale. See the PR when it lands.

## Reduced contrast

The default scale serves as the low-contrast case. There's no separate `prefers-contrast: less` scale.

## What's out of scope

- **`prefers-reduced-motion`** — the system uses CSS transitions on surface backgrounds only; respecting reduced motion is the consumer's responsibility.
- **Font size / zoom** — font size affects APCA thresholds in practice (smaller text needs higher contrast). The default targets are calibrated for ~14–16px body copy. Apps with smaller text should raise their targets.
