# Surfaces

Named regions with fixed lightness. Each surface establishes text and border tokens for its contents.

## The Map

<SurfaceMap />

The map shows seven surfaces across two polarities. Four share **page polarity**: light in light mode, dark in dark mode. Three share **inverted polarity** (<Token name=".surface-spotlight" />, <Token name=".surface-spotlight-card" />, <Token name=".surface-spotlight-action" />), so they stay opposite page-polarity surfaces with at least <ApcaBadge :value="87" :target="80" /> contrast.

## Usage

Apply a surface with a single class. The specimen below uses the system CSS and responds to the color controls in the nav bar:

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

A button using the opposite polarity pops against its container. The contrast gap is the point — it's visible because both surfaces are in the same example:

<LiveExample
surface="surface-page"
:html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px; display: flex; align-items: center; gap: 1rem;">

  <p class="text-strong" style="margin: 0; font-size: 0.875rem; flex: 1;">Ready to deploy?</p>
  <button class="surface-spotlight text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Deploy</button>
</div>`'
  :code='`<div class="surface-card">
  <p class="text-strong">Ready to deploy?</p>
  <button class="surface-spotlight text-high">Deploy</button>
</div>`'
/>

<LiveExample
surface="surface-spotlight"
:html='`<div style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">

  <p class="text-strong" style="margin: 0; font-size: 0.875rem; flex: 1;">Confirm your selection.</p>
  <button class="surface-page text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Confirm</button>
</div>`'
  :code='`<div class="surface-spotlight">
  <p class="text-strong">Confirm your selection.</p>
  <button class="surface-page text-high">Confirm</button>
</div>`'
/>
