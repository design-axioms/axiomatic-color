# Preferences

CSS preference queries — `prefers-color-scheme`, `prefers-contrast`, `forced-colors` — let users tell the browser how they want to see things. The system adapts to all of them by re-solving, not re-authoring.

## The Regimes

<PreferencesPreview />

Toggle the three regimes. The markup above the controls stays the same; the solver produces different CSS for each one, and the browser picks which rules apply based on the user's environment.

## How It Works

Every surface has a semantic **role** — `surface`, `interactive`, `alert`, or `link`. Role is the only accessibility input you declare.

- Under `prefers-color-scheme`, roles don't change. `light-dark()` picks the mode-appropriate branch of each surface's solved colors.
- Under `prefers-contrast: more`, the solver re-solves each surface against tighter APCA targets (an optional separate high-contrast lightness scale can tighten further).
- Under `forced-colors: active`, the role maps to the OS palette. `surface` cedes to `Canvas`/`CanvasText`, `interactive` to `ButtonFace`/`ButtonText`/`ButtonBorder`, `alert` to `CanvasText` with a `Mark` fallback, `link` to `LinkText`. Atmosphere and hue are suppressed.

You never author a forced-colors variant of a surface. You tag it `interactive` once, and the generator produces the mapping for every regime.

## Usage

<LiveExample
  surface="surface-page"
  :html='`<div class=\"surface-card\" style=\"padding: 1.25rem; border-radius: 6px;\">\n  <h2 class=\"text-high\" style=\"font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;\">Account</h2>\n  <p class=\"text-strong\" style=\"font-size: 0.875rem; margin: 0 0 0.75rem;\">Your settings.</p>\n  <button class=\"surface-action border-interactive text-high\" style=\"padding: 0.4rem 0.85rem; border-radius: 6px; border-width: 1px; border-style: solid; cursor: pointer; font-size: 0.8rem;\">Save</button>\n</div>`'
  :code='`<div class=\"surface-card\">\n  <h2 class=\"text-high\">Account</h2>\n  <p class=\"text-strong\">Your settings.</p>\n  <button class=\"surface-action border-interactive text-high\">Save</button>\n</div>`'
/>

The same markup works in every regime. Your environment decides which CSS block applies.

## Configuring

Set a surface's role in config:

```ts
surfaces: {
  page: [
    { slug: "card", position: 2, role: "surface" },       // default
    { slug: "action", position: 2, role: "interactive" }, // buttons, inputs
    { slug: "error", position: 2, role: "alert" },        // status
  ],
}
```

For the full mapping tables and HC/distinction tuning, see [Reference → Accessibility](/reference/accessibility).
