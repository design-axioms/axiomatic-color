# Axiomatic Color

A color system that guarantees contrast correctness. Surfaces set backgrounds, text grades set contrast, borders have tiers, atmosphere adds hue. Toggle dark mode and it all works.

<SurfaceTile />

## Quick Start

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

Five classes. Every color resolved, every contrast target met, both modes handled.

## How It Works

**Surfaces** are named regions with fixed lightness. `.surface-card` always means card, regardless of where it appears. Each surface establishes text and border tokens for its contents.

**Text grades** resolve per surface per mode. `.text-high` on Page and `.text-high` on Spotlight both meet their APCA target with different lightness values.

**Borders** come in three tiers: decorative (subtle), interactive (visible), and critical (high contrast).

**Atmosphere** tints surfaces with hue and chroma. Contrast guarantees are unaffected because chroma fades near lightness extremes.

**Polarity** is the system's key insight. Page-polarity surfaces are light in light mode, dark in dark mode. Spotlight uses inverted polarity, so it always contrasts against page surfaces.

## Explore

- [Surfaces](/surfaces) — the lightness ladder
- [Text](/text) — four contrast grades
- [Borders](/borders) — three tiers
- [Atmosphere](/atmosphere) — hue and chroma
- [Composition](/composition) — how the pieces combine
