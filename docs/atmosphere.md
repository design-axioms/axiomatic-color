# Atmosphere

Tint surfaces with hue and chroma. Contrast guarantees are unaffected.

## The Taper

<TaperCurve />

As a surface approaches pure black or pure white, its ability to carry color fades — neon black doesn't exist in physics, and the taper encodes that reality.

::: details Why does chroma fade at the extremes?
This shape is the **safe bicone taper**: wide at mid-lightness, zero at the extremes.

**Bicone** because the chroma envelope forms a double cone in oklch, widest at the midpoint. **Taper** because chroma gradually fades toward the extremes. **Safe** because the fade keeps the solver from placing high chroma where contrast would suffer.
:::

## Usage

Apply atmosphere per surface with a <Token name=".hue-*" /> utility:

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

## Key Colors

Key colors define named atmosphere presets. A brand hex color is parsed into hue and chroma, then applied through <Token name=".hue-brand" />:

```js
// In the solver config
anchors: {
  keyColors: {
    brand: "#6e56cf",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  }
}
```

Each key color generates a utility class (<Token name=".hue-brand" />, <Token name=".hue-success" />, etc.) and CSS custom properties (`--axm-key-brand-hue`, `--axm-key-brand-chroma`).

Use the atmosphere controls in the header to try different brand colors. The taper ensures that surfaces near lightness extremes stay nearly neutral regardless of the chroma you set.

## The Formula

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

Surfaces near the midpoint get vivid color. Surfaces near the extremes stay nearly neutral.
