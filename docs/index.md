# Axiomatic Color

CSS color systems break when you add a surface or change a mode. Text contrast that worked on one background fails on another, and every change triggers a manual re-check across both light and dark modes.

Axiomatic Color solves this. You declare surfaces, text grades, and atmosphere. The solver generates CSS custom properties where every text/surface pair meets its [APCA](/reference/apca) contrast target in both modes — no manual checking, no runtime JS.

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

- [Surfaces](/surfaces) — named regions with fixed lightness
- [Text](/text) — four contrast grades, solved per surface
- [Borders](/borders) — three tiers: decorative, interactive, critical
- [Atmosphere](/atmosphere) — hue and chroma without affecting contrast
- [Composition](/composition) — independent axes, polarity inversion
