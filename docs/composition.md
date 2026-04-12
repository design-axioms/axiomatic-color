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

Primary and secondary buttons compose on both polarities. The primary uses the opposite surface to pop; the secondary uses a border to stay subordinate:

<LiveExample
surface="surface-page"
:html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px; display: flex; align-items: center; gap: 0.75rem;">

  <p class="text-strong" style="margin: 0; font-size: 0.875rem; flex: 1;">Save your changes?</p>
  <button class="surface-spotlight text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Save</button>
  <button class="border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; background: transparent; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Discard</button>
</div>`'
  :code='`<div class="surface-card">
  <p class="text-strong">Save your changes?</p>
  <button class="surface-spotlight text-high">Save</button>
  <button class="border-interactive text-high">Discard</button>
</div>`'
/>

<LiveExample
surface="surface-spotlight"
:html='`<div style="padding: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">

  <p class="text-strong" style="margin: 0; font-size: 0.875rem; flex: 1;">Confirm deletion?</p>
  <button class="surface-page text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Delete</button>
  <button class="border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; background: transparent; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Cancel</button>
</div>`'
  :code='`<div class="surface-spotlight">
  <p class="text-strong">Confirm deletion?</p>
  <button class="surface-page text-high">Delete</button>
  <button class="border-interactive text-high">Cancel</button>
</div>`'
/>

The same pattern works on both polarities. The primary button's polarity flips, the secondary border adapts, and contrast holds.
