# Getting Started

## Installation

```bash
pnpm add @design-axioms/color
```

## Quick Start

Generate CSS from the default configuration:

```typescript
import { DEFAULT_CONFIG, generateCSS, solve } from "@design-axioms/color";

const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, {
  ...DEFAULT_CONFIG.options,
  keyColors: DEFAULT_CONFIG.anchors.keyColors,
});

// css is a complete stylesheet with:
// - light-dark() mode switching
// - .surface-* classes (lightness context)
// - .hue-* utilities (atmosphere from key colors)
// - .text-* and .border-* utilities (contrast intent)
```

## CLI

The CLI provides commands for building, validating, and inspecting the color system:

```bash
# Generate CSS to stdout
npx axiomatic build
```

::: details Output (truncated)
```css
/* Root — color-scheme drives light-dark() */
:root {
  color-scheme: light;
  --axm-key-brand-hue: 288.0332;
  --axm-key-brand-chroma: 0.1790;
  --axm-key-success-hue: 149.5793;
  --axm-key-success-chroma: 0.1920;
  --axm-key-warning-hue: 86.0468;
  --axm-key-warning-chroma: 0.1617;
  --axm-key-error-hue: 25.3313;
  --axm-key-error-chroma: 0.2078;
}

/* Surface classes */

.surface-page {
  --axm-surface: light-dark(oklch(0.9750 ...), oklch(0.2500 ...));
  --axm-text-high: light-dark(oklch(0.2024 ...), oklch(0.9746 ...));
  --axm-text-strong: light-dark(oklch(0.3072 ...), oklch(0.9536 ...));
  --axm-text-subtle: light-dark(oklch(0.3658 ...), oklch(0.9295 ...));
  /* ... borders, more surfaces ... */
}

/* Text utilities */
.text-high { color: var(--axm-text-high); }
.text-strong { color: var(--axm-text-strong); }
/* ... 147 lines total ... */
```
:::

```bash
# Validate configuration and show diagnostics
npx axiomatic validate
```

::: details Output
```
=== LIGHT MODE ===
  page: L=0.9750, polarity=page
  workspace: L=0.9566, polarity=page
  card: L=0.9016, polarity=page
  action: L=0.9016, polarity=page
  spotlight: L=0.1000, polarity=inverted

  Composition:
    page ↔ workspace: 0.0 APCA [enhancement]
    page ↔ card: 14.2 APCA [enhancement]
    page ↔ spotlight: 102.6 APCA [guarantee]

=== DARK MODE ===
  page: L=0.2500, polarity=page
  workspace: L=0.3465, polarity=page
  card: L=0.3999, polarity=page
  action: L=0.3999, polarity=page
  spotlight: L=0.9000, polarity=inverted

  Composition:
    page ↔ spotlight: 83.5 APCA [guarantee]
    workspace ↔ spotlight: 77.2 APCA [guarantee]
    card ↔ spotlight: 71.7 APCA [guarantee]
```
:::

```bash
# Print solver output as JSON
npx axiomatic inspect

# Generate a self-contained HTML demo page
npx axiomatic demo
```

## Hello World

Save the build output and open it in a browser:

```bash
npx axiomatic build -o axiomatic.css
```

<LiveExample
  surface="surface-page"
  :html='`<div class="surface-card" style="padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Neutral Card</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">No atmosphere. Pure lightness.</p>
</div>
<div class="surface-card hue-brand" style="padding: 1.5rem; border-radius: 8px;">
  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Brand Card</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">Same contrast, brand tint.</p>
</div>`'
  :code='`<div class="surface-card">
  <h1 class="text-high">Neutral Card</h1>
  <p class="text-strong">No atmosphere. Pure lightness.</p>
</div>
<div class="surface-card hue-brand">
  <h1 class="text-high">Brand Card</h1>
  <p class="text-strong">Same contrast, brand tint.</p>
</div>`'
/>

::: details Full HTML document
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="axiomatic.css">
</head>
<body class="surface-page">
  <div class="surface-card" style="padding: 1.5rem; border-radius: 8px; max-width: 400px; margin: 2rem auto;">
    <h1 class="text-high">Neutral Card</h1>
    <p class="text-strong">No atmosphere. Pure lightness.</p>
  </div>
  <div class="surface-card hue-brand" style="padding: 1.5rem; border-radius: 8px; max-width: 400px; margin: 2rem auto;">
    <h1 class="text-high">Brand Card</h1>
    <p class="text-strong">Same contrast, brand tint.</p>
  </div>
</body>
</html>
```
:::

## Using the CSS

The generated CSS uses `color-scheme` on `:root` to drive `light-dark()`. Switch modes by changing the property:

```css
/* Light mode (default) */
:root {
  color-scheme: light;
}

/* Dark mode */
:root {
  color-scheme: dark;
}
```

Apply surfaces and text grades using the generated classes:

<LiveExample
  surface="surface-page"
  :html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px; margin-bottom: 1rem;">
  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Card Title</h2>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0 0 0.25rem;">Body text at the strong grade.</p>
  <p class="text-subtle" style="font-size: 0.8125rem; margin: 0;">Secondary information.</p>
</div>
<div class="surface-card hue-brand" style="padding: 1.25rem; border-radius: 6px;">
  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Brand Card</h2>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">Same contrast, brand purple tint.</p>
</div>`'
  :code='`<div class="surface-card">
  <h2 class="text-high">Card Title</h2>
  <p class="text-strong">Body text at the strong grade.</p>
  <p class="text-subtle">Secondary information.</p>
</div>

<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-strong">Same contrast, brand purple tint.</p>
</div>`'
/>

Three kinds of classes compose orthogonally:

- <Token name=".surface-*" /> — sets lightness context (background, text values, borders)
- <Token name=".hue-*" /> — overrides atmosphere (hue and chroma) without changing lightness
- <Token name=".text-*" /> / <Token name=".border-*" /> — selects contrast grade from the current surface context
