# Core Concepts

## Surfaces

<SurfaceMap />

<Token name=".surface-card" /> behaves the same regardless of DOM position. Its lightness comes from its name, not from nesting depth.

The map above shows five surfaces across two polarities. Four share **page polarity**: light in light mode, dark in dark mode. <Token name=".surface-spotlight" /> uses **inverted polarity**, so it stays opposite page-polarity surfaces <ApcaBadge :value="87" :target="80" />.

Apply a surface with a single class:

```html
<body class="surface-page">
  <div class="surface-card">
    <h2 class="text-high">Title</h2>
    <p class="text-strong">Body text.</p>
  </div>
</body>
```

The <Token name=".surface-card" /> class sets the background and establishes text and border tokens for its contents.

## Text Grades and Border Tiers

<GradePreview />

The preview above shows the four text grades (<span class="nowrap"><Token name=".text-high" />,</span> <span class="nowrap"><Token name=".text-strong" />,</span> <span class="nowrap"><Token name=".text-subtle" />,</span> <Token name=".text-subtlest" />) and the three border tiers (<span class="nowrap"><Token name=".border-decorative" />,</span> <span class="nowrap"><Token name=".border-interactive" />,</span> <Token name=".border-critical" />).

The system solves each grade for each surface and mode. <Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both meet their APCA target with different solved lightness values. If a target can't be fully met, the solver reports the shortfall.

## Atmosphere

<TaperCurve />

Surfaces are achromatic by default. Atmosphere tints a surface with hue and chroma without affecting any contrast guarantees.

The curve above shows the shape: chroma fades to zero near the lightness extremes, and the tick marks show where each surface sits.

::: details
We call this shape the **safe bicone taper**: wide at mid-lightness, zero at the extremes. The formula below captures it in one expression.

**Bicone** because the chroma envelope forms a double cone in oklch, widest at the midpoint. **Taper** because chroma gradually fades toward the extremes. **Safe** because the fade keeps the solver from placing high chroma where contrast would suffer.
:::

Apply atmosphere per surface with a <Token name=".hue-*" /> utility:

```html
<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-subtle">Tinted, same contrast.</p>
</div>
```

The taper is defined by one expression:

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

## Putting It Together

<SurfaceTile />

Surface, atmosphere, and grade are independent axes: lightness, hue, and contrast. Each choice modifies one axis without disturbing the others. The tile above demonstrates: dark mode and hue changes do not affect grade behavior or border visibility.
