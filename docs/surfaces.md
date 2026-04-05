# Surfaces

Named regions with fixed lightness. Each surface establishes text and border tokens for its contents.

## The Map

<SurfaceMap />

The map shows five surfaces across two polarities. Four share **page polarity**: light in light mode, dark in dark mode. <Token name=".surface-spotlight" /> uses **inverted polarity**, so it stays opposite page-polarity surfaces <ApcaBadge :value="87" :target="80" />.

## Usage

Apply a surface with a single class:

```html
<div class="surface-card">
  <h2 class="text-high">Title</h2>
  <p class="text-strong">Body text.</p>
</div>
```

<Token name=".surface-card" /> sets the background and establishes text and border tokens for its contents.

## Surface Identity

<Token name=".surface-card" /> behaves the same regardless of DOM position. Its lightness comes from its name, not from nesting depth. There is no nesting depth tracking.

## Polarity

Page-polarity surfaces share the same lightness range: light in light mode, dark in dark mode. Spotlight uses the opposite range. This creates a guaranteed contrast gap between any page-polarity surface and spotlight.

Primary actions use the opposite polarity to pop against their container:

```html
<!-- On a page-polarity surface -->
<button class="surface-spotlight text-high">Primary</button>

<!-- On spotlight -->
<button class="surface-page text-high">Primary</button>
```

## Default Surfaces

| Surface | Class | Polarity | Role |
|---------|-------|----------|------|
| Page | `.surface-page` | Page | Base background |
| Workspace | `.surface-workspace` | Page | Elevated work area |
| Card | `.surface-card` | Page | Content container |
| Action | `.surface-action` | Page | Interactive element |
| Spotlight | `.surface-spotlight` | Inverted | High-emphasis callout |
