# Atmosphere

Surfaces are achromatic by default. Add color per element with <Token name=".hue-*" /> classes.

<TaperCurve />

## How It Works

Surfaces start with no color. A <Token name=".hue-brand" /> or <Token name=".hue-accent" /> class opts a surface into color by setting its hue and chroma from the corresponding key color.

The taper shapes how much chroma each surface actually carries. Surfaces near mid-lightness get vivid color; surfaces near the extremes stay nearly neutral. This keeps contrast guarantees intact regardless of the hue you choose.

::: details Why does chroma fade at the extremes?
This shape is the **safe bicone taper**: wide at mid-lightness, zero at the extremes.

**Bicone** because the chroma envelope forms a double cone in oklch, widest at the midpoint. **Taper** because chroma gradually fades toward the extremes. **Safe** because the fade keeps the solver from placing high chroma where contrast would suffer.
:::

## Usage

Apply color per surface with a <Token name=".hue-*" /> utility:

<LiveExample
surface="surface-page"
:html='`<div class="surface-card hue-brand" style="padding: 1.25rem; border-radius: 6px;">

  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Brand Card</h2>
  <p class="text-subtle" style="font-size: 0.875rem; margin: 0;">Tinted, same contrast.</p>
</div>`'
  :code='`<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-subtle">Tinted, same contrast.</p>
</div>`'
/>

<LiveExample
surface="surface-spotlight"
:html='`<div class="hue-brand" style="padding: 1.25rem; border-radius: 6px;">

  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Featured Release</h2>
  <p class="text-subtle" style="font-size: 0.875rem; margin: 0;">Atmosphere on inverted polarity.</p>
</div>`'
  :code='`<div class="surface-spotlight hue-brand">
  <h2 class="text-high">Featured Release</h2>
  <p class="text-subtle">Atmosphere on inverted polarity.</p>
</div>`'
/>

## Key Colors

Key colors are named hex values that the solver parses into hue and chroma. <Token name=".hue-brand" /> and <Token name=".hue-accent" /> are the two editable key colors. Semantic colors (<Token name=".hue-success" />, <Token name=".hue-warning" />, <Token name=".hue-error" />) are fixed in config.

```js
// In the solver config
anchors: {
  keyColors: {
    brand: "#6e56cf",
    accent: "#0891b2",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  }
}
```

Each key color generates a utility class and CSS custom properties (`--axm-key-brand-hue`, `--axm-key-brand-chroma`).

Try the color controls in the nav bar. Every <Token name=".hue-brand" /> surface on this page updates in real time.

## The Formula

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

Surfaces near the midpoint get vivid color. Surfaces near the extremes stay nearly neutral.
