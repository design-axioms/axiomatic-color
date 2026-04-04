# Core Concepts

## Surfaces

<SurfaceMap />

A surface is a named region with a fixed lightness. `card` always means `card`, regardless of where it appears in the DOM. Its lightness comes from its name, not from nesting depth.

The default configuration has five surfaces across two polarities. Four share **page polarity**: light in light mode, dark in dark mode. Spotlight uses **inverted polarity**, always the opposite, so it stands out against any page-polarity surface <ApcaBadge :value="87" :target="80" />. Toggle dark mode in the map above to see both sides of the flip.

Apply a surface with a single class:

```html
<body class="surface-page">
  <div class="surface-card">
    <h2 class="text-high">Title</h2>
    <p class="text-strong">Body text.</p>
  </div>
</body>
```

The <Token name=".surface-card" /> class sets the background and establishes text and border tokens for everything inside it.

## Text Grades and Border Tiers

<GradePreview />

Four text grades (<Token name=".text-high" />, <Token name=".text-strong" />, <Token name=".text-subtle" />, <Token name=".text-subtlest" />) and three border tiers (<Token name=".border-decorative" />, <Token name=".border-interactive" />, <Token name=".border-critical" />).

The same class produces correct contrast on every surface. The system solves each grade per surface per mode, so <Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both hit their APCA target, with different solved lightness values. When a target can't be fully met, the solver reports the shortfall.

## Atmosphere

<TaperCurve />

Surfaces are achromatic by default. Atmosphere tints a surface with hue and chroma without affecting any contrast guarantees.

Drag the sliders above: the gradient shows how chroma changes across the lightness range. Near the extremes (very light, very dark), chroma fades to zero. This is the **safe bicone taper**. Surfaces near the midpoint get vivid color; surfaces near the edges stay nearly neutral. The tick marks show where each surface sits on the curve.

Apply atmosphere per surface with a <Token name=".hue-*" /> utility:

```html
<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-subtle">Tinted, same contrast.</p>
</div>
```

The taper is one expression:

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

## Putting It Together

<SurfaceTile />

Three independent axes: surface (lightness), atmosphere (hue), and grade (contrast). Pick a surface, pick a hue, pick a grade. Each choice modifies one axis without disturbing the others. Toggle dark mode and the hue buttons above to see this in action: text grades stay correct, borders stay visible, and the tint changes independently.
