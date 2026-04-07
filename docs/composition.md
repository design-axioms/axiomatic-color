# Composition

Surface, atmosphere, and grade are independent axes: lightness, hue, and contrast. Each choice modifies one axis without disturbing the others.

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

```html
<!-- Page-polarity context: primary pops dark -->
<div class="surface-card">
  <button class="surface-spotlight text-high">Primary</button>
  <button class="border-interactive text-high">Secondary</button>
</div>

<!-- Inverted context: primary pops light -->
<div class="surface-spotlight">
  <button class="surface-page text-high">Primary</button>
  <button class="border-interactive text-high">Secondary</button>
</div>
```

The same pattern, opposite polarities, both high contrast.
