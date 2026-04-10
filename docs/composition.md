# Composition

Surface, atmosphere, and text grade are three independent axes. Surface controls lightness, atmosphere controls hue and chroma, and text grade controls contrast. Each choice modifies one axis without disturbing the others.

## The Tile

<SurfaceTile />

Toggle dark mode or change the hue. Grade behavior and border visibility hold.

## Nesting

Surfaces don't nest — they compose. A card inside a workspace has the same lightness as a card on a page. Surface identity comes from the name, not the position.

```html
<body class="surface-page">
  <div class="surface-workspace">
    <div class="surface-card border-decorative">
      <!-- card always means card -->
    </div>
  </div>
</body>
```

## Polarity Contrast

Primary actions use the opposite polarity:

<LiveExample
  surface="surface-page"
  :html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px;">
  <div style="display: flex; gap: 0.5rem;">
    <button class="surface-spotlight text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Primary</button>
    <button class="border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; background: transparent; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Secondary</button>
  </div>
</div>`'
  :code='`<!-- Page-polarity: primary pops dark -->
<div class="surface-card">
  <button class="surface-spotlight text-high">Primary</button>
  <button class="border-interactive text-high">Secondary</button>
</div>`'
/>

<LiveExample
  surface="surface-spotlight"
  :html='`<div style="padding: 1.25rem; border-radius: 6px;">
  <div style="display: flex; gap: 0.5rem;">
    <button class="surface-page text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Primary</button>
    <button class="border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; background: transparent; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Secondary</button>
  </div>
</div>`'
  :code='`<!-- Inverted: primary pops light -->
<div class="surface-spotlight">
  <button class="surface-page text-high">Primary</button>
  <button class="border-interactive text-high">Secondary</button>
</div>`'
/>

The same pattern, opposite polarities, both high contrast.
