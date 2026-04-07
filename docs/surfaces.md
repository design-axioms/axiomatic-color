# Surfaces

Named regions with fixed lightness. Each surface establishes text and border tokens for its contents.

## The Map

<SurfaceMap />

The map shows five surfaces across two polarities. Four share **page polarity**: light in light mode, dark in dark mode. <Token name=".surface-spotlight" /> uses **inverted polarity**, so it stays opposite page-polarity surfaces <ApcaBadge :value="87" :target="80" />.

## Usage

Apply a surface with a single class. The specimen below uses the system CSS and responds to the site's atmosphere controls:

<LiveExample
  surface="surface-page"
  :html='`<div class=\"surface-card\" style=\"padding: 1.25rem; border-radius: 6px;\">\n  <h2 class=\"text-high\" style=\"font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;\">Title</h2>\n  <p class=\"text-strong\" style=\"font-size: 0.875rem; margin: 0;\">Body text.</p>\n</div>`'
  :code='`<div class=\"surface-card\">\n  <h2 class=\"text-high\">Title</h2>\n  <p class=\"text-strong\">Body text.</p>\n</div>`'
/>

<Token name=".surface-card" /> sets the background and scopes the text and border tokens.

## Surface Identity

<Token name=".surface-card" /> behaves the same regardless of DOM position. Its lightness comes from its name, not from nesting depth.

## Polarity

Page-polarity surfaces share the same lightness range: light in light mode, dark in dark mode. Spotlight uses the opposite range. This creates a guaranteed contrast gap between any page-polarity surface and spotlight.

Primary actions use the opposite polarity to pop against their container:

```html
<!-- On a page-polarity surface -->
<button class="surface-spotlight text-high">Primary</button>

<!-- On spotlight -->
<button class="surface-page text-high">Primary</button>
```
