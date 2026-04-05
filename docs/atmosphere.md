# Atmosphere

Tint surfaces with hue and chroma. Contrast guarantees are unaffected.

## The Taper

<TaperCurve />

Chroma fades to zero near the lightness extremes, and the tick marks show where each surface sits.

::: details
We call this shape the **safe bicone taper**: wide at mid-lightness, zero at the extremes. The formula below captures it in one expression.

**Bicone** because the chroma envelope forms a double cone in oklch, widest at the midpoint. **Taper** because chroma gradually fades toward the extremes. **Safe** because the fade keeps the solver from placing high chroma where contrast would suffer.
:::

## Usage

Apply atmosphere per surface with a <Token name=".hue-*" /> utility:

```html
<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-subtle">Tinted, same contrast.</p>
</div>
```

## The Formula

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

Surfaces near the midpoint get vivid color. Surfaces near the extremes stay nearly neutral.
