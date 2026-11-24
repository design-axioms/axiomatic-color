# Axiomatic Color

CSS color systems break when you add a surface or switch modes. Contrast that worked on one background fails on another, and every change sends you back into a manual re-check across light mode, dark mode, high contrast, and forced colors.

Axiomatic Color starts from intent instead of a palette. You declare **surfaces**, **contrast grades**, and **atmosphere**. The solver computes CSS using `oklch()` and `light-dark()` so every surface carries its own solved text and border tokens against [APCA](/reference/apca) targets—with diagnostics whenever a target can't be met.

Drag hue, chroma, or dark mode below—or open **Theme** in the top bar on any page to adjust Brand, Accent, Dark mode, and High Contrast site-wide:

<SurfaceTile />

```html
<body class="surface-page">
  <div class="surface-card border-decorative">
    <h2 class="text-high">Title</h2>
    <p class="text-strong">Body text.</p>
    <p class="text-subtle">Secondary info.</p>
    <button class="surface-spotlight text-high">Action</button>
  </div>
</body>
```

## Explore the System

- **[Why Axiomatic?](/why)** — why swatch palettes can't answer "does this work?", with an interactive palette explorer
- **[Getting Started](/getting-started)** — install the alpha packages, generate CSS, and run the CLI
- **[Live Demo](/demo)** — full interactive surface, border, atmosphere, and CSS inspector

### Concepts

- **[Surfaces](/surfaces)** — named regions with fixed lightness across page and inverted polarities
- **[Text](/text)** — four contrast grades, solved per surface and mode
- **[Borders](/borders)** — three contrast tiers (`decorative`, `interactive`, `critical`) and automatic surface distinction
- **[Atmosphere](/atmosphere)** — opt-in hue and chroma shaped by the safe bicone taper
- **[Composition](/composition)** — orthogonal axes, polarity contrast, and same-polarity distinction
- **[Preferences](/preferences)** — `prefers-color-scheme`, `prefers-contrast`, and `forced-colors` derived from semantic role
