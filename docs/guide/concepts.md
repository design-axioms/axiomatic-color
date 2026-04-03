# Core Concepts

## Surfaces

A surface is a named region with a semantic identity. `card` always means `card` — its lightness is determined by its name and polarity, not by DOM nesting depth.

The default configuration defines five surfaces across two polarities:

<SurfaceMap />

Four surfaces share **page polarity** — light in light mode, dark in dark mode. Spotlight uses **inverted polarity** — always the opposite, so it contrasts with any page-polarity surface <ApcaBadge :value="87" :target="80" />. Toggle dark mode in the diagram to see both sides of the flip.

Apply surfaces with CSS classes like <Token name=".surface-page" /> and <Token name=".surface-card" />. A surface class sets the background and defines text grades and border tiers for its subtree:

```html
<body class="surface-page">
  <div class="surface-card">
    <h2 class="text-high">Title</h2>
    <p class="text-strong">Body text.</p>
  </div>
</body>
```

## Text Grades and Border Tiers

The same classes produce correct contrast on any surface. Here are the four text grades and three border tiers on a page-polarity surface (Page) and an inverted-polarity surface (Spotlight):

<GradePreview />

The system solves each grade per surface per mode. When a target can't be fully met, the system reports the shortfall — the "noisy no."

## Atmosphere

Surfaces are achromatic by default. Atmosphere adds hue and chroma without affecting contrast:

<TaperCurve />

Apply atmosphere per surface with <Token name=".hue-brand" />, <Token name=".hue-success" />, or any <Token name=".hue-*" /> utility generated from your key colors:

```html
<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-subtle">This card is brand-tinted.</p>
</div>
```

The same <Token name=".hue-brand" /> produces a faint tint on Page but vivid purple on Card because the **safe bicone taper** reduces chroma as surface lightness moves away from the midpoint:

$$
C_{\text{effective}} = C \times (1 - |2L - 1|)
$$

The three class types compose independently:

| Operator | Sets | Preserves |
| -------- | ---- | --------- |
| <Token name=".surface-*" /> | Lightness, background | — (resets context) |
| <Token name=".hue-*" /> | Hue, chroma | Lightness |
| <Token name=".text-*" /> | Contrast grade | Hue, chroma |

## Putting It Together

The demo renders each surface with its text grades, border tiers, and atmosphere controls. Use the dark-mode toggle to inspect both branches of `light-dark()`. Use the hue buttons to inspect how surface, atmosphere, and contrast compose:

<SurfaceTile />
